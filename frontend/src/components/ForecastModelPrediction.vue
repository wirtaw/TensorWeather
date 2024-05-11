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
            <v-container class="form-container" v-if="isDataPrepared">
              <v-form>
                <v-row class="flex-direction is-align-self-center">
                  <v-btn color="primary" @click="trainModel">train</v-btn>
                </v-row>
              </v-form>
            </v-container>
            <router-link class="button" to="/prepare" v-if="!isDataPrepared">Prepare data</router-link>
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

      const predictionSettings = ref({ 
          latitude: locationSettings.latitude || '',
          longitude: locationSettings.longitude || '',
          startDate: learnDateRange.startDate,
          endDate: learnDateRange.endDate,
      });

      const forecastResult = ref(null);
      const isDataPrepared = ref(false);
      const on = inject('socketOn');

      if (preparedData && Array.isArray(preparedData) > 0) {
        isDataPrepared.value = true;
      }

      on('forecast_request_done', (data) => {
        forecastResult.value = data;
      });

      function trainModel() {
        return 'done';
      }
  
      return { forecastResult, predictionSettings, isDataPrepared, trainModel };
    },

  };
</script>