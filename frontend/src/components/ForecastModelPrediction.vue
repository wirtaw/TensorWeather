<template>
    <div class="columns">
      <div class="column is-four-fifths">
        <div class="container">
          <h1 class="has-text-light">Forecast Model and Prediction</h1>
          <p class="has-text-primary">

          </p>
          <h2 class="has-text-light">Setup</h2>
          <p class="has-text-primary">
            We'll load our data and train our model from scratch since it trains pretty quickly.
            Set date start - end ranges. Place coordinates.
            Select data types. By default all.
            Press train button. 
            <v-container class="form-container is-flex is-justify-content-center" v-if="isDataPrepared">
              <v-form>
                <v-row class="flex-direction is-align-self-center">
                  <v-btn color="primary" @click="trainModel">train</v-btn>
                </v-row>
              </v-form>
            </v-container>
            <span class="buttons is-flex is-justify-content-center">
              <router-link class="button" to="/prepare" v-if="!isDataPrepared">Prepare data</router-link>
            </span>
            </p>
          <h2 class="has-text-light">Our model</h2>
          <div v-if="forecastResult">
            <h2 class="has-text-light">Forecast Result</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Date</th>
                  <th>Temp</th>
                  <th>Humidity</th>
                  <th>Precipitation</th>
                  <th>Pressure</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in forecastResult" :key="item.id"> 
                  <td>{{ item.id }}</td>
                  <td>{{ item.date }}</td>
                  <td>{{ item.temperature.min }} / {{ item.temperature.max }}</td>
                  <td>{{ item.humidity.afternoon }}</td>
                  <td>{{ item.precipitation.afternoon }}</td>
                  <td>{{ item.pressure.afternoon }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="column ">
        graph
      </div>
    </div>
</template>
  
<script>
  import { ref, inject } from 'vue';
  import { useStore } from 'vuex';
  import * as tf from '@tensorflow/tfjs';
  import * as tfvis from '@tensorflow/tfjs-vis';

  window.tf = tf;
  window.tfvis = tfvis;

  window.data;
  window.model;
  
  export default {
    data() {
        return {
            latitude: null, 
            longitude: null,
            startDate: null,
            endDate: null
        }
    },
    setup() {
      const store = useStore(); 
      const locationSettings = store.state.locationSettings;
      const learnDateRange = store.state.learnDateRange;
      const preparedData = store.state.preparedData;
      const columns = Object.keys(preparedData[0])
        .filter((name) => !['id'].includes(name));

      const predictionSettings = ref({ 
          latitude: locationSettings.latitude || '',
          longitude: locationSettings.longitude || '',
          startDate: learnDateRange.startDate,
          endDate: learnDateRange.endDate,
      });

      const forecastResult = ref(null);
      const isDataPrepared = ref(false);
      const means = ref([]);
      const stddevs = ref([]);
      const on = inject('socketOn');

      if (preparedData && Array.isArray(preparedData) > 0) {
        isDataPrepared.value = true;
      }

      on('forecast_request_done', (data) => {
        forecastResult.value = data;
      });

      async function trainModel() {
        tf.tidy(() => {
          means.value = [];
          stddevs.value = [];
          
          for (const columnName of columns) {
            const data = tf.tensor1d(getColumnData(columnName).slice(0, 6 * 24 * 365));
            //console.log('tf.tensor1d data:', data);
            const moments = tf.moments(data);
            means.value.push(moments.mean.dataSync());
            //console.log('tf.moments:', moments);
            stddevs.value.push(Math.sqrt(moments.variance.dataSync()));
          }
          console.log('means:', means.value);
          console.log('stddevs:', stddevs.value);
        });
      }

      function getColumnData(columnName, includeTime, beginIndex, length, stride) {
        const columnIndex = columns.indexOf(columnName);
        const numRows = preparedData.length;

        console.log('columnIndex:', columnIndex);
        console.log('columnName:', columnName);

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
        for (let i = beginIndex; i < beginIndex + length && i < numRows;
            i += stride) {
          let value = preparedData[i][columnIndex];
          if (includeTime) {
            value = {x: this.dateTime[i].getTime(), y: value};
          }
          out.push(value);
        }
        console.log('out:', out.length);
        return out;
      }
  
      return { forecastResult, predictionSettings, isDataPrepared, trainModel, getColumnData };
    },

  };
</script>