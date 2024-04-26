<template>
    <div v-if="forecastResult">
      <h2>Forecast Result</h2>
      <table>
        <thead>
          </thead>
        <tbody>
          <tr v-for="item in forecastResult" :key="item.id"> 
            <td>{{ item.id }}</td><td>{{ item.date }}</td>
          </tr>
        </tbody>
      </table>
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