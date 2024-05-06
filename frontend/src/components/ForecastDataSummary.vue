<template>
    <div v-if="forecastSummary">
      <h2>Forecast Summary</h2>
      <LineChart chart-data="forecastSummaryChart" chart-options="chartOptions" aria-describedby="summary-table"/>
      <table class="table" id="summary-table">
        <caption>Forecast for location {{ latitude }} / {{ longitude }} the years 1999-01-01 to 2024-05-30.</caption>
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
  import LineChart from '../components/charts/LineChart.vue';
  import { inject, ref } from 'vue';
  import { mapState } from 'vuex';
  
  export default {
    components: {
      LineChart
    },
    data() {
        return {
            latitude: null, 
            longitude: null,
            chartOptions: {
              responsive: true,
            }
        }
    },
    computed: {
        ...mapState(['locationSettings'])
    },
    setup() {
        const forecastSummary = ref(null);
        const forecastSummaryChart = ref({
          labels: [],
          datasets: []
        });

        const on = inject('socketOn');

        on('forecast_summary_request_done', (data) => {
            forecastSummary.value = data;
            const labels = ['wind', 'precipitation', 'pressure', 'humidity', 'temperature_min', 'temperature_max', 'temperature_1', 'temperature_2', 'temperature_3', 'temperature_4', 'cloud_cover'];
            const labelsBasic = ['wind', 'precipitation', 'pressure', 'humidity', 'temperature', 'cloud_cover'];
            const datasets = [];
            const maps = new Map();
 
            for (const item of data) {
              for (const key in item) {
                if (labelsBasic.includes(key)) {
                  if ('temperature' === key) {
                    const list = maps.has('temperature_min') ? maps.get('temperature_min') : [];
                    const list2 = maps.has('temperature_max') ? maps.get('temperature_max') : [];
                    const list3 = maps.has('temperature_1') ? maps.get('temperature_1') : [];
                    const list4 = maps.has('temperature_2') ? maps.get('temperature_2') : [];
                    const list5 = maps.has('temperature_3') ? maps.get('temperature_3') : [];
                    const list6 = maps.has('temperature_4') ? maps.get('temperature_4') : [];
                    maps.set('temperature_min', [...list, item.temperature.min]);
                    maps.set('temperature_max', [...list2, item.temperature.max]);
                    maps.set('temperature_1', [...list3, item.temperature.morning]);
                    maps.set('temperature_2', [...list4, item.temperature.afternoon]);
                    maps.set('temperature_3', [...list5, item.temperature.evening]);
                    maps.set('temperature_4', [...list6, item.temperature.night]);
                  } else if ('humidity' === key) {
                    const list = maps.has('humidity') ? maps.get('humidity') : [];
                    maps.set(key, [...list, item.humidity.afternoon]);
                  } else if ('pressure' === key) {
                    const list = maps.has('pressure') ? maps.get('pressure') : [];
                    maps.set(key, [...list, item.pressure.afternoon]);
                  } else if ('precipitation' === key) {
                    const list = maps.has('precipitation') ? maps.get('precipitation') : [];
                    maps.set(key, [...list, item.precipitation.total]);
                  } else if ('wind' === key) {
                    const list = maps.has('wind') ? maps.get('wind') : [];
                    maps.set(key, [...list, item.wind.max.speed]);
                  } else if ('cloud_cover' === key) {
                    const list = maps.has('cloud_cover') ? maps.get('cloud_cover') : [];
                    maps.set(key, [...list, item.cloud_cover.afternoon]);
                  }
                }
              }
            }
            for (const key of labels) {
              datasets.push({
                label: key,
                data: maps.get(key),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              });
            }
            console.dir({
              labels,
              datasets,
            }, {depth: 2});
            forecastSummaryChart.value.labels = labels;
            /*forecastSummaryChart.value = {
              labels,
              datasets,
            }*/
        });

        return { forecastSummary, forecastSummaryChart };
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
          endDate: (new Date('2024-05-30')).getTime()
        });
    }
  };
</script>