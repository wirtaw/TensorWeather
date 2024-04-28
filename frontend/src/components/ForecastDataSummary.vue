<template>
    <div v-if="forecastSummary">
      <h2>Forecast Summary</h2>
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
          <tr v-for="item in forecastSummary" :key="item.id"> 
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
  import { inject, ref } from 'vue';
  import { mapState } from 'vuex';
  
  export default {
    data() {
        return {
            latitude: null, 
            longitude: null
        }
    },
    computed: {
        ...mapState(['locationSettings'])
    },
    setup() {
        const forecastSummary = ref(null);

        const on = inject('socketOn');

        on('forecast_summary_request_done', (data) => {
            forecastSummary.value = data;
        });

        return { forecastSummary };
    },
    mounted() {
        const emit = inject('socketEmit');
        
        const { latitude, longitude } = this.locationSettings;
        this.latitude = latitude;
        this.longitude = longitude;

        emit('forecast_summary_request', {
          latitude: !Number.isNaN(Number.parseFloat(latitude)) ? Number.parseFloat(this.latitude) : null,
          longitude: !Number.isNaN(Number.parseFloat(longitude)) ? Number.parseFloat(this.longitude) : null,
          startDate: (new Date('1999-01-01')).getTime(),
          endDate: (new Date('2024-05-01')).getTime()
        });
    }
  };
</script>