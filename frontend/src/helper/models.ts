/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * Creating and training `tf.LayersModel`s for the temperature prediction
 * problem.
 *
 * This file is used to create models for both
 * - the browser: see [index.js](./index.js), and
 * - the Node.js backend environment: see [train-rnn.js](./train-rnn.js).
 */

import * as tf from '@tensorflow/tfjs';

import {WeatherData} from './weatherData.ts';

// Row ranges of the training and validation data subsets.
const TRAIN_MIN_ROW = 0;
const TRAIN_MAX_ROW = 200000;
const VAL_MIN_ROW = 200001;
const VAL_MAX_ROW = 300000;

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
export async function getBaselineMeanAbsoluteError(
    WeatherData, normalize, includeDateTime, lookBack, step, delay) {
  const batchSize = 128;
  const dataset = tf.data.generator(
      () => WeatherData.getNextBatchFunction(
          false, lookBack, delay, batchSize, step, VAL_MIN_ROW, VAL_MAX_ROW,
          normalize, includeDateTime));

  const batchMeanAbsoluteErrors = [];
  const batchSizes = [];
  await dataset.forEachAsync(dataItem => {
    const features = dataItem?.xs;
    const targets = dataItem?.ys;
    const timeSteps = features.shape[1];
    batchSizes.push(features.shape[0]);
    batchMeanAbsoluteErrors.push(tf.tidy(
        () => tf.losses.absoluteDifference(
            targets,
            features.gather([timeSteps - 1], 1).gather([1], 2).squeeze([2]))));
  });

  const meanAbsoluteError = tf.tidy(() => {
    const batchSizesTensor = tf.tensor1d(batchSizes);
    const batchMeanAbsoluteErrorsTensor = tf.stack(batchMeanAbsoluteErrors);
    return batchMeanAbsoluteErrorsTensor.mul(batchSizesTensor)
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
function buildLinearRegressionModel(inputShape) {
  const model = tf.sequential();
  model.add(tf.layers.flatten({inputShape}));
  model.add(tf.layers.dense({units: 1}));
  return model;
}

/**
 * Build a GRU model for the temperature-prediction problem.
 *
 * @param {tf.Shape} inputShape Input shape (without the batch dimenson).
 * @param {tf.regularizer.Regularizer} kernelRegularizer An optional
 *   regularizer for the kernel of the first (hdiden) dense layer of the MLP.
 *   If not specified, no weight regularization will be included in the MLP.
 * @param {number} dropoutRate Dropout rate of an optional dropout layer
 *   inserted between the two dense layers of the MLP. Optional. If not
 *   specified, no dropout layers will be included in the MLP.
 * @returns {tf.LayersModel} A TensorFlow.js tf.LayersModel instance.
 */
export function buildMLPModel(inputShape, kernelRegularizer = null, dropoutRate = null) {
  const model = tf.sequential();
  model.add(tf.layers.flatten({inputShape}));
  model.add(
      tf.layers.dense({units: 32, kernelRegularizer, activation: 'relu'}));
  if (dropoutRate > 0) {
    model.add(tf.layers.dropout({rate: dropoutRate}));
  }
  model.add(tf.layers.dense({units: 1}));
  return model;
}

/**
 * Build a simpleRNN-based model for the temperature-prediction problem.
 *
 * @param {tf.Shape} inputShape Input shape (without the batch dimenson).
 * @returns {tf.LayersModel} A TensorFlow.js model consisting of a simpleRNN
 *   layer.
 */
export function buildSimpleRNNModel(inputShape) {
  const model = tf.sequential();
  const rnnUnits = 32;
  model.add(tf.layers.simpleRNN({units: rnnUnits, inputShape}));
  model.add(tf.layers.dense({units: 1}));
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
export function buildGRUModel(inputShape, dropout = null, recurrentDropout = null) {
  // TODO(cais): Recurrent dropout is currently not fully working.
  //   Make it work and add a flag to train-rnn.js.
  const model = tf.sequential();
  const rnnUnits = 32;
  model.add(tf.layers.gru({
    units: rnnUnits,
    inputShape,
    dropout: dropout || 0,
    recurrentDropout: recurrentDropout || 0
  }));
  model.add(tf.layers.dense({units: 1}));
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
export function buildModel(modelType, numTimeSteps, numFeatures) {
  const inputShape = [numTimeSteps, numFeatures];

  console.log(`modelType = ${modelType}`);
  let model;
  if (modelType === 'mlp') {
    model = buildMLPModel(inputShape);
  } else if (modelType === 'mlp-l2') {
    model = buildMLPModel(inputShape, tf.regularizers.l2());
  } else if (modelType === 'linear-regression') {
    model = buildLinearRegressionModel(inputShape);
  } else if (modelType === 'mlp-dropout') {
    const regularizer = null;
    const dropoutRate = 0.25;
    model = buildMLPModel(inputShape, regularizer, dropoutRate);
  } else if (modelType === 'simpleRNN') {
    model = buildSimpleRNNModel(inputShape);
  } else if (modelType === 'gru') {
    model = buildGRUModel(inputShape);
    // TODO(cais): Add gru-dropout with recurrentDropout.
  } else {
    throw new Error(`Unsupported model type: ${modelType}`);
  }

  model.compile({loss: 'meanAbsoluteError', optimizer: 'rmsprop'});
  model.summary();
  return model;
}

/**
   * Get a data iterator function.
   *
   * @param {boolean} shuffle Whether the data is to be shuffled. If `false`,
   *   the examples generated by repeated calling of the returned iterator
   *   function will scan through range specified by `minIndex` and `maxIndex`
   *   (or the entire range of the CSV file if those are not specified) in a
   *   sequential fashion. If `true`, the examples generated by the returned
   *   iterator function will start from random rows.
   * @param {number} lookBack Number of look-back time steps. This is how many
   *   steps to look back back when making a prediction. Typical value: 10 days
   *   (i.e., 6 * 24 * 10 = 1440).
   * @param {number} delay Number of time steps from the last time point in the
   *   input features to the time of prediction. Typical value: 1 day (i.e.,
   *   6 * 24 = 144).
   * @param {number} batchSize Batch size.
   * @param {number} step Number of steps between consecutive time points in the
   *   input features. This is a downsampling factor for the input features.
   *   Typical value: 1 hour (i.e., 6).
   * @param {number} minIndex Optional minimum index to draw from the original
   *   data set. Together with `maxIndex`, this can be used to reserve a chunk
   *   of the original data for validation or evaluation.
   * @param {number} maxIndex Optional maximum index to draw from the original
   *   data set. Together with `minIndex`, this can be used to reserve a chunk
   *   of the original data for validation or evaluation.
   * @param {boolean} normalize Whether the iterator function will return
   *   normalized data.
   * @param {boolean} includeDateTime Include the date-time features, including
   *   normalized day-of-the-year and normalized time-of-the-day.
   * @return {Function} An iterator Function, which returns a batch of features
   *   and targets when invoked. The features and targets are arranged in a
   *   length-2 array, in the said order.
   *   The features are represented as a float32-type `tf.Tensor` of shape
   *     `[batchSize, Math.floor(lookBack / step), featureLength]`
   *   The targets are represented as a float32-type `tf.Tensor` of shape
   *     `[batchSize, 1]`.
   */
  function getNextBatchFunction(
    shuffle, lookBack, delay, batchSize, step, minIndex, maxIndex, normalize,
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

/**
 * Train a model on the Jena weather data.
 *
 * @param {tf.LayersModel} model A compiled tf.LayersModel object. It is
 *   expected to have a 3D input shape `[numExamples, timeSteps, numFeatures].`
 *   and an output shape `[numExamples, 1]` for predicting the temperature
 * value.
 * @param {JenaWeatherData} jenaWeatherData A JenaWeatherData object.
 * @param {boolean} normalize Whether to used normalized data for training.
 * @param {boolean} includeDateTime Whether to include date and time features
 *   in training.
 * @param {number} lookBack Number of look-back time steps.
 * @param {number} step Step size used to generate the input features.
 * @param {number} delay How many steps in the future to make the prediction
 *   for.
 * @param {number} batchSize batchSize for training.
 * @param {number} epochs Number of training epochs.
 * @param {tf.Callback | tf.CustomCallbackArgs} customCallback Optional callback
 *   to invoke at the end of every epoch. Can optionally have `onBatchEnd` and
 *   `onEpochEnd` fields.
 */
export async function trainModel(
    model, jenaWeatherData, normalize, includeDateTime, lookBack, step, delay,
    batchSize, epochs, customCallback) {
  const trainShuffle = true;
  const trainDataset =
      tf.data
          .generator(
              () => jenaWeatherData.getNextBatchFunction(
                  trainShuffle, lookBack, delay, batchSize, step, TRAIN_MIN_ROW,
                  TRAIN_MAX_ROW, normalize, includeDateTime))
          .prefetch(8);
  const evalShuffle = false;
  const valDataset = tf.data.generator(
      () => jenaWeatherData.getNextBatchFunction(
          evalShuffle, lookBack, delay, batchSize, step, VAL_MIN_ROW,
          VAL_MAX_ROW, normalize, includeDateTime));

  await model.fitDataset(trainDataset, {
    batchesPerEpoch: 500,
    epochs,
    callbacks: customCallback,
    validationData: valDataset
  });
}