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
  import { ref, onMounted } from 'vue';
  import { useSocket } from './../helper/useSocket'; 
  
  export default {
    setup() {
      const forecastData = ref([]);
  
      const { on } = useSocket();
  
      on('forecast_response', (data) => {
        forecastData.value = data;
      });

      onMounted(() => {
        const { socket } = useSocket();
        socket.on('forecast_response', (data) => { 
            forecastData.value = data;
        });
      });
  
      return { forecastData };
    },
  };
  </script>