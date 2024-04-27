<template>
    <div v-if="forecastResult">
      <h2>Forecast Result</h2>
      <table class="table">
        <thead>
          <th>
            <td>Id</td>
            <td>Date</td>
            <td>Temp</td>
            <td>Humidity</td>
            <td>Precipitation</td>
            <td>Pressure</td>
          </th>
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