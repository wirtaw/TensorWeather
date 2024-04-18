<template>
    <table>
      <thead>
        </thead>
      <tbody>
        <tr v-for="item in forecastData" :key="item.id"> 
        </tr>
      </tbody>
    </table>
  </template>
  
  <script>
  import { ref, onMounted, inject } from 'vue';
  
  export default {
    setup() {
      const forecastData = ref([]);
      const on = inject('socketOn');
  
      on('forecast_response', (data) => {
        forecastData.value = data;
      });

      onMounted(() => {
        on('forecast_response', (data) => { 
            forecastData.value = data;
        });
      });
  
      return { forecastData };
    },
  };
  </script>