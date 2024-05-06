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
  
  export default {
    setup() {
      const forecastResult = ref(null);
      const on = inject('socketOn');

      on('forecast_request_done', (data) => {
        forecastResult.value = data;
      });
  
      return { forecastResult };
    },
  };
</script>