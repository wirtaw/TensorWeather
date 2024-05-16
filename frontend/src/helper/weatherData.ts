/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
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
 * Data object for Weather data.
 
 * 
 * This file is used to load the Jena weather data in both
 * - the browser: see [index.js](./index.js), and 
 * - the Node.js backend environment: see [train-rnn.js](./train-rnn.js).
 */

import * as tf from '@tensorflow/tfjs';

/**
 * A class that fetches and processes the weather archive data.
 *
 * It also provides a method to create a function that iterates over
 * batches of training or validation data.
 */
export class WeatherData {
  columns = [];
  dateTime = [];
  data = [];
  normalizedDayOfYear = [];
  normalizedTimeOfDay = [];
  numRows = 0;
  numColumns = 0;
  numColumnsExcludingTarget = 0;
  means = [];
  stddevs = [];
  normalizedData = [];
  tempCol = -1;
  constructor() {}

  /**
   * Load and preprocess data.
   *
   */
  async load(data) {
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
    console.log(
        `this.numColumnsExcludingTarget = ${this.numColumnsExcludingTarget}`);

    await this.calculateMeansAndStddevs_();
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
          // console.log('tf.tensor1d data:', data);
          const moments = tf.moments(data);
          this.means.push(moments.mean.dataSync());
          // console.log('tf.moments:', moments);
          this.stddevs.push(Math.sqrt(moments.variance.dataSync()));
        }
        // console.log('means:', means.value);
        // console.log('stddevs:', stddevs.value);
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
      // console.log('normalizedData:', normalizedData.value);
  }

  getDataColumnNames() {
    return this.columns;
  }

  getTime(index) {
    return this.dateTime[index];
  }

  /** Get the mean and standard deviation of a data column. */
  getMeanAndStddev(dataColumnName) {
    if (this.means === null || this.stddevs === null) {
      throw new Error('means and stddevs have not been calculated yet.');
    }

    const index = this.getDataColumnNames().indexOf(dataColumnName);
    if (index === -1) {
      throw new Error(`Invalid data column name: ${dataColumnName}`);
    }
    return {
      mean: this.means[index], stddev: this.stddevs[index]
    }
  }

  getColumnData(
      columnName, includeTime = null, normalize = null, beginIndex = 0, length = 0, stride = 0) {
        const numRows = this.data.length;

        // console.log('columnName:', columnName);

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
        /* console.log('beginIndex:', beginIndex);
        console.log('length:', length);
        console.log('stride:', stride); */ 
        for (let i = beginIndex; i < beginIndex + length && i < numRows;
            i += stride) {
          let value = this.data[i][columnName];
          if (includeTime) {
            value = {x: this.dateTime[i].getTime(), y: value};
          }
          out.push(value);
        }
        // console.log('out:', out);
        return out;
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
  getNextBatchFunction(
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
}