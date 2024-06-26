import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as R from 'ramda';
import { DateTime, Settings } from 'luxon';
import * as tf from '@tensorflow/tfjs';
import * as tfnGPU from '@tensorflow/tfjs-node-gpu';
import * as tfnNode from '@tensorflow/tfjs-node';
import { LevelDbService } from '../level-dbservice/level-dbservice.service';
import { ProcessingOptions } from './interfaces/data-processing.interfaces';
import { AppConfig } from '../config/app/app.config';
import {
  WeatherData,
  WeatherDataNormalized,
} from '../openweather/interfaces/openweather.interfaces';
import { TrainArguments } from './interfaces/train-arguments.interfaces';

const VAL_MIN_ROW = 200001;
const VAL_MAX_ROW = 300000;

const TRAIN_MIN_ROW = 0;
const TRAIN_MAX_ROW = 200000;

const NUM_BATCHES_PER_EPOCH = 500;

@Injectable()
export class DataProcessingService {
  private appConfig: AppConfig;
  private trainArguments: TrainArguments;
  private tfn;
  private model;
  private dataset;
  private readonly logger = new Logger(DataProcessingService.name);
  private columns;
  private dateTime;
  private data;
  private normalizedDayOfYear;
  private normalizedTimeOfDay;
  private numRows;
  private numColumns;
  private numColumnsExcludingTarget;
  private means;
  private stddevs;
  private normalizedData;
  private tempCol;

  constructor(
    private configService: ConfigService,
    private readonly levelDBService: LevelDbService,
  ) {
    this.appConfig = this.configService.get<AppConfig>('app');
    this.trainArguments = {
      modelType: null,
      gpu: false,
      lookBack: 10 * 24 * 6,
      step: 6,
      delay: 144,
      normalize: true,
      includeDateTime: false,
      batchSize: 128,
      epochs: 20,
      earlyStoppingPatience: 2,
      logDir: '',
      logUpdateFreq: null,
    };

    this.columns = [];
    this.dateTime = [];
    this.data = [];
    this.normalizedDayOfYear = [];
    this.normalizedTimeOfDay = [];
    this.numRows = 0;
    this.numColumns = 0;
    this.numColumnsExcludingTarget = 0;
    this.means = [];
    this.stddevs = [];
    this.normalizedData = [];
    this.tempCol = -1;
  }

  async cleanAndProcess(
    options: ProcessingOptions,
  ): Promise<WeatherDataNormalized[]> {
    const { timeZone, syncHour } = this.appConfig;
    const { startDate, endDate, lat: latitude, lon: longitude } = options;
    const rawData: WeatherData[] = [];

    Settings.defaultZone = timeZone;

    const dtStart = DateTime.fromMillis(startDate).set({ hour: syncHour });
    if (!startDate || !dtStart.isValid) {
      throw new Error(`Invalid start date. ${dtStart.invalidExplanation}`);
    }

    const dtEnd = DateTime.fromMillis(endDate).set({ hour: syncHour });
    if (!endDate || !dtEnd.isValid) {
      throw new Error(`Invalid end date. ${dtEnd.invalidExplanation}`);
    }

    const { days } =
      startDate < endDate
        ? dtEnd.diff(dtStart, 'days').toObject()
        : dtStart.diff(dtEnd, 'days').toObject();

    Settings.defaultZone = null;

    for (let i = 0; i < days; i++) {
      const dt =
        startDate < endDate
          ? dtStart.plus({ days: i })
          : dtEnd.plus({ days: i });
      const key: string = `day-summary-${latitude}-${longitude}-${dt.toMillis()}`;
      const cachedData: WeatherData | undefined =
        await this.levelDBService.get(key);
      if (cachedData) {
        rawData.push(cachedData);
      }
    }

    this.logger.log(` rawData ${rawData.length}`);

    const remap = R.curry((desc, obj) =>
      R.map((path) => R.view(R.lensPath(path), obj), desc),
    );

    const checkTemperature = R.pipe(
      R.prop('temperature'),
      R.where({
        max: R.is(Number),
        min: R.is(Number),
        morning: R.is(Number),
        afternoon: R.is(Number),
        evening: R.is(Number),
        night: R.is(Number),
      }),
    );

    const filterByTemperature = R.filter(checkTemperature);

    const checkHumidity = R.pipe(
      R.prop('humidity'),
      R.where({
        afternoon: R.is(Number),
      }),
    );

    const filterByHumidity = R.filter(checkHumidity);

    const checkPressure = R.pipe(
      R.prop('pressure'),
      R.where({
        afternoon: R.is(Number),
      }),
    );

    const filterByPressure = R.filter(checkPressure);

    const checkPrecipitation = R.pipe(
      R.prop('precipitation'),
      R.where({
        total: R.is(Number),
      }),
    );

    const filterByPrecipitation = R.filter(checkPrecipitation);

    const checkCloudCover = R.pipe(
      R.prop('cloud_cover'),
      R.where({
        afternoon: R.is(Number),
      }),
    );

    const filterByCloudCover = R.filter(checkCloudCover);

    const myExtract = remap({
      temperature_min: ['temperature', 'min'],
      temperature_max: ['temperature', 'max'],
      temperature_1: ['temperature', 'morning'],
      temperature_2: ['temperature', 'afternoon'],
      temperature_3: ['temperature', 'evening'],
      temperature_4: ['temperature', 'night'],
      humidity: ['humidity', 'afternoon'],
      pressure: ['pressure', 'afternoon'],
      precipitation: ['precipitation', 'total'],
      wind: ['wind', 'max', 'speed'],
      cloud_cover: ['cloud_cover', 'afternoon'],
      date: ['date'],
      id: ['id'],
    });

    const processedData: WeatherDataNormalized[] | any = R.map(
      myExtract,
      R.pipe(
        filterByTemperature,
        filterByHumidity,
        filterByPressure,
        filterByPrecipitation,
        filterByCloudCover,
      )(rawData),
    );

    return processedData;
  }

  /**
   * Calculate the commonsense baseline temperture-prediction accuracy.
   *
   * The latest value in the temperature feature column is used as the
   * prediction.
   *
   * @param {boolean} normalize Whether to used normalized data for training.
   * @param {boolean} includeDateTime Whether to include date and time features
   *   in training.
   * @param {number} lookBack Number of look-back time steps.
   * @param {number} step Step size used to generate the input features.
   * @param {number} delay How many steps in the future to make the prediction
   *   for.
   * @returns {number} The mean absolute error of the commonsense baseline
   *   prediction.
   */
  async getBaselineMeanAbsoluteError(
    WeatherData,
    normalize,
    includeDateTime,
    lookBack,
    step,
    delay,
  ) {
    const batchSize = 128;
    this.dataset = tf.data.generator(() =>
      WeatherData.getNextBatchFunction(
        false,
        lookBack,
        delay,
        batchSize,
        step,
        VAL_MIN_ROW,
        VAL_MAX_ROW,
        normalize,
        includeDateTime,
      ),
    );

    const batchMeanAbsoluteErrors = [];
    const batchSizes = [];
    /*await dataset.forEachAsync(dataItem => {
    const features = dataItem?.xs;
    const targets = dataItem?.ys || 0;
    const timeSteps = features.shape[1];
    batchSizes.push(features.shape[0]);
    batchMeanAbsoluteErrors.push(tf.tidy(
        () => tf.losses.absoluteDifference(
            targets,
            features.gather([timeSteps - 1], 1).gather([1], 2).squeeze([2]))));
  });*/

    const meanAbsoluteError = tf.tidy(() => {
      const batchSizesTensor = tf.tensor1d(batchSizes);
      const batchMeanAbsoluteErrorsTensor = tf.stack(batchMeanAbsoluteErrors);
      return batchMeanAbsoluteErrorsTensor
        .mul(batchSizesTensor)
        .sum()
        .div(batchSizesTensor.sum());
    });
    tf.dispose(batchMeanAbsoluteErrors);
    return meanAbsoluteError.dataSync()[0];
  }

  /**
   * Build a linear-regression model for the temperature-prediction problem.
   *
   * @param {tf.Shape} inputShape Input shape (without the batch dimenson).
   * @returns {tf.LayersModel} A TensorFlow.js tf.LayersModel instance.
   */
  buildLinearRegressionModel(inputShape) {
    const model = tf.sequential();
    model.add(tf.layers.flatten({ inputShape }));
    model.add(tf.layers.dense({ units: 1 }));
    return model;
  }

  /**
   * Build a GRU model for the temperature-prediction problem.
   *
   * @param {tf.Shape} inputShape Input shape (without the batch dimenson).
   * @param {tf.regularizer.Regularizer | null} kernelRegularizer An optional
   *   regularizer for the kernel of the first (hdiden) dense layer of the MLP.
   *   If not specified, no weight regularization will be included in the MLP.
   * @param {number | null} dropoutRate Dropout rate of an optional dropout layer
   *   inserted between the two dense layers of the MLP. Optional. If not
   *   specified, no dropout layers will be included in the MLP.
   * @returns {tf.LayersModel} A TensorFlow.js tf.LayersModel instance.
   */
  buildMLPModel(inputShape, kernelRegularizer = null, dropoutRate = null) {
    const model = tf.sequential();
    model.add(tf.layers.flatten({ inputShape }));
    model.add(
      tf.layers.dense({ units: 32, kernelRegularizer, activation: 'relu' }),
    );
    if (dropoutRate > 0) {
      model.add(tf.layers.dropout({ rate: dropoutRate }));
    }
    model.add(tf.layers.dense({ units: 1 }));
    return model;
  }

  /**
   * Build a simpleRNN-based model for the temperature-prediction problem.
   *
   * @param {tf.Shape} inputShape Input shape (without the batch dimenson).
   * @returns {tf.LayersModel} A TensorFlow.js model consisting of a simpleRNN
   *   layer.
   */
  buildSimpleRNNModel(inputShape) {
    const model = tf.sequential();
    const rnnUnits = 32;
    model.add(tf.layers.simpleRNN({ units: rnnUnits, inputShape }));
    model.add(tf.layers.dense({ units: 1 }));
    return model;
  }

  /**
   * Build a GRU model for the temperature-prediction problem.
   *
   * @param {tf.Shape} inputShape Input shape (without the batch dimenson).
   * @param {number} dropout Optional input dropout rate
   * @param {number} recurrentDropout Optional recurrent dropout rate.
   * @returns {tf.LayersModel} A TensorFlow.js GRU model.
   */
  buildGRUModel(inputShape, dropout = null, recurrentDropout = null) {
    // TODO(cais): Recurrent dropout is currently not fully working.
    //   Make it work and add a flag to train-rnn.js.
    const model = tf.sequential();
    const rnnUnits = 32;
    model.add(
      tf.layers.gru({
        units: rnnUnits,
        inputShape,
        dropout: dropout || 0,
        recurrentDropout: recurrentDropout || 0,
      }),
    );
    model.add(tf.layers.dense({ units: 1 }));
    return model;
  }

  /**
   * Build a model for the temperature-prediction problem.
   *
   * @param {string} modelType Model type.
   * @param {number} numTimeSteps Number of time steps in each input.
   *   exapmle
   * @param {number} numFeatures Number of features (for each time step).
   * @returns A compiled instance of `tf.LayersModel`.
   */
  buildModel(modelType, numTimeSteps, numFeatures) {
    const inputShape = [numTimeSteps, numFeatures];

    this.logger.log(`modelType = ${modelType}`);
    let model;
    if (modelType === 'mlp') {
      model = this.buildMLPModel(inputShape);
    } else if (modelType === 'mlp-l2') {
      model = this.buildMLPModel(inputShape, tf.regularizers.l2());
    } else if (modelType === 'linear-regression') {
      model = this.buildLinearRegressionModel(inputShape);
    } else if (modelType === 'mlp-dropout') {
      const regularizer = null;
      const dropoutRate = 0.25;
      model = this.buildMLPModel(inputShape, regularizer, dropoutRate);
    } else if (modelType === 'simpleRNN') {
      model = this.buildSimpleRNNModel(inputShape);
    } else if (modelType === 'gru') {
      model = this.buildGRUModel(inputShape);
      // TODO(cais): Add gru-dropout with recurrentDropout.
    } else {
      throw new Error(`Unsupported model type: ${modelType}`);
    }

    model.compile({ loss: 'meanAbsoluteError', optimizer: 'rmsprop' });
    model.summary();
    return model;
  }

  async createModel(train: TrainArguments, numFeatures: number): Promise<any> {
    this.logger.log(` train  ${JSON.stringify(train)}`);
    this.logger.log(` train model ${train.modelType}`);
    this.trainArguments = { ...train };

    if (this.trainArguments.gpu) {
      this.tfn = tfnGPU;
    } else {
      this.tfn = tfnNode;
    }

    this.logger.log(` build model ${train.lookBack}`);
    this.model = this.buildModel(
      train.modelType,
      Math.floor(train.lookBack / train.step),
      numFeatures,
    );

    const callback = [];
    if (this.trainArguments.logDir !== null) {
      this.logger.log(
        `Logging to tensorboard. ` +
          `Use the command below to bring up tensorboard server:\n` +
          `  tensorboard --logdir ${this.trainArguments.logDir}`,
      );
      callback.push(
        this.tfn.node.tensorBoard(this.trainArguments.logDir, {
          updateFreq: this.trainArguments.logUpdateFreq,
        }),
      );
    }
    if (this.trainArguments.earlyStoppingPatience !== null) {
      this.logger.log(
        `Using earlyStoppingCallback with patience ` +
          `${this.trainArguments.earlyStoppingPatience}.`,
      );
      callback.push(
        this.tfn.callbacks.earlyStopping({
          patience: this.trainArguments.earlyStoppingPatience,
        }),
      );
    }

    return this.model;
  }

  getColumnData(
    columnName, includeTime = null, normalize = null, beginIndex = 0, length = 0, stride = 0) {
      const numRows = this.data.length;

      // this.logger.log('columnName:', columnName);

      if (!beginIndex) {
        beginIndex = 0;
      }
      if (!length) {
        length = numRows - beginIndex;
      }
      if (!stride) {
        stride = 1;
      }
      const out = [];
      /* this.logger.log('beginIndex:', beginIndex);
      this.logger.log('length:', length);
      this.logger.log('stride:', stride); */ 
      for (let i = beginIndex; i < beginIndex + length && i < numRows;
          i += stride) {
        let value = this.data[i][columnName];
        if (includeTime) {
          value = {x: this.dateTime[i].getTime(), y: value};
        }
        out.push(value);
      }
      // this.logger.log('out:', out);
      return out;
  }

  /**
   * Calculate the means and standard deviations of every column.
   *
   * TensorFlow.js is used for acceleration.
   */
  async calculateMeansAndStddevs_() {
    tf.tidy(() => {
        this.means = [];
        this.stddevs = [];
        
        for (const columnName of this.columns) {
          const data = tf.tensor1d(this.getColumnData(columnName).slice(0, 6 * 24 * 365));
          // this.logger.log('tf.tensor1d data:', data);
          const moments = tf.moments(data);
          this.means.push(moments.mean.dataSync());
          // this.logger.log('tf.moments:', moments);
          this.stddevs.push(...moments.variance.dataSync().map((val) => Math.sqrt(val)));
        }
        this.logger.log('means:', this.means);
        this.logger.log('stddevs:', this.stddevs);
      });
      const numRows = this.data.length;

      // Cache normalized values.
      this.normalizedData = [];
      for (let i = 0; i < numRows; ++i) {
        const row = [];
        for (let j = 0; j < this.columns.length; ++j) {
          const columnIndex = this.columns.indexOf(this.columns[j]);
          const columnName = this.columns[j];
          row.push((this.data[i][columnName] - this.means[columnIndex]) / this.stddevs[columnIndex]);
        }
        this.normalizedData.push(row);
      }
      // isDataLoaded.value = true;
      this.logger.log('normalizedData:', this.normalizedData);
  }

  async loadData({ data }) {
    this.columns = (data && Array.isArray(data) && data.length) ? Object.keys(data[0])
        .filter((name) => !['id', 'date'].includes(name)) : [];
    this.dateTime = [];
    this.data = data;  // Unnormalized data.
    // Day of the year data, normalized between 0 and 1.
    this.normalizedDayOfYear = [];
    // Time of the day, normalized between 0 and 1.
    this.normalizedTimeOfDay = [];
    
    this.numRows = this.data.length;
    this.numColumns = this.data[0].length;
    this.numColumnsExcludingTarget = this.data[0].length - 1;

    await this.calculateMeansAndStddevs_();

    return this.normalizedData;
  }

  async getNextBatchFunction(shuffle, lookBack, delay, batchSize, step, minIndex, maxIndex, normalize,
    includeDateTime) {
      let startIndex = minIndex + lookBack;
      const lookBackSlices = Math.floor(lookBack / step);

      return {
        next: () => {
          const rowIndices = [];
          let done = false;  // Indicates whether the dataset has ended.
          if (shuffle) {
            // If `shuffle` is `true`, start from randomly chosen rows.
            const range = maxIndex - (minIndex + lookBack);
            for (let i = 0; i < batchSize; ++i) {
              const row = minIndex + lookBack + Math.floor(Math.random() * range);
              rowIndices.push(row);
            }
          } else {
            // If `shuffle` is `false`, the starting row indices will be sequential.
            let r = startIndex;
            for (; r < startIndex + batchSize && r < maxIndex; ++r) {
              rowIndices.push(r);
            }
            if (r >= maxIndex) {
              done = true;
            }
          }

          const numExamples = rowIndices.length;
          startIndex += numExamples;

          const featureLength =
              includeDateTime ? this.numColumns + 2 : this.numColumns;
          const samples = tf.buffer([numExamples, lookBackSlices, featureLength]);
          const targets = tf.buffer([numExamples, 1]);
          // Iterate over examples. Each example contains a number of rows.
          for (let j = 0; j < numExamples; ++j) {
            const rowIndex = rowIndices[j];
            let exampleRow = 0;
            // Iterate over rows in the example.
            for (let r = rowIndex - lookBack; r < rowIndex; r += step) {
              let exampleCol = 0;
              // Iterate over features in the row.
              for (let n = 0; n < featureLength; ++n) {
                let value;
                if (n < this.numColumns) {
                  value = normalize ? this.normalizedData[r][n] : this.data[r][n];
                } else if (n === this.numColumns) {
                  // Normalized day-of-the-year feature.
                  value = this.normalizedDayOfYear[r];
                } else {
                  // Normalized time-of-the-day feature.
                  value = this.normalizedTimeOfDay[r];
                }
                samples.set(value, j, exampleRow, exampleCol++);
              }

              const value = normalize ?
                  this.normalizedData[r + delay][this.tempCol] :
                  this.data[r + delay][this.tempCol];
              targets.set(value, j, 0);
              exampleRow++;
            }
          }
          return {
            value: {xs: samples.toTensor(), ys: targets.toTensor()},
            done
          };
        }
      };
  }

  async customCallback() {
    return tf.Callback;
  }

  async trainModel() {
    if (!this.normalizedData && !this.model) {
      throw new Error('No model to train or nomalized data');
    }

    const { lookBack, delay, batchSize, step, normalize, includeDateTime, epochs } = this.trainArguments;

    const trainShuffle = true;
    const trainDataset =
        tf.data
            .generator(
                () => this.getNextBatchFunction(
                    trainShuffle, lookBack, delay, batchSize, step, TRAIN_MIN_ROW,
                    TRAIN_MAX_ROW, normalize, includeDateTime))
            .prefetch(8);
    const evalShuffle = false;
    const valDataset = tf.data.generator(
        () => this.getNextBatchFunction(
            evalShuffle, lookBack, delay, batchSize, step, VAL_MIN_ROW,
            VAL_MAX_ROW, normalize, includeDateTime));

    await this.model.fitDataset(trainDataset, {
      batchesPerEpoch: NUM_BATCHES_PER_EPOCH,
      epochs,
      callbacks: this.customCallback,
      validationData: valDataset
    });
  }
}
