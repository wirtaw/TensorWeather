<template>
    <div v-if="forecastSummary">
      <h2>Forecast Summary</h2>
      <LineChart :data="forecastSummaryChart" :options="chartOptions" aria-describedby="summary-table"/>
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
  // <LineChart chart-data="forecastSummaryChart" chart-options="chartOptions" aria-describedby="summary-table"/>
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
              interaction: {
                mode: 'index',
                intersect: false,
              },
              stacked: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Chart.js Line Chart'
                }
              },
              scales: {
                x: {
                  type: 'time',
                  time: {
                    tooltipFormat: 'yyyy-MM-dd'
                  },
                  title: {
                    display: true,
                    text: 'Date'
                  }
                },
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                },
              }
            }
        }
    },
    computed: {
        ...mapState(['locationSettings'])
    },
    setup() {
        const labelsNames = ['wind', 'precipitation', 'pressure', 'humidity', 'temperature_min', 'temperature_max', 'temperature_1', 'temperature_2', 'temperature_3', 'temperature_4', 'cloud_cover'];
        const labelsBasic = ['wind', 'precipitation', 'pressure', 'humidity', 'temperature', 'cloud_cover'];
        let labels = [];
        
        const colors = generateRandomColors(labelsNames.length);
        
        const forecastSummary = ref(null);
        const forecastSummaryChart = ref(null);

        const on = inject('socketOn');

        on('forecast_summary_request_done', (data) => {
            forecastSummary.value = data;
            const datasetsLocal = [];
            const maps = new Map();
            labels = [];
 
            for (const item of data) {
              labels.push(item.date);
              for (const key in item) {
                if (labelsBasic.includes(key)) {
                  if ('temperature' === key) {
                    const list = maps.has('temperature_min') ? maps.get('temperature_min') : [];
                    const list2 = maps.has('temperature_max') ? maps.get('temperature_max') : [];
                    const list3 = maps.has('temperature_1') ? maps.get('temperature_1') : [];
                    const list4 = maps.has('temperature_2') ? maps.get('temperature_2') : [];
                    const list5 = maps.has('temperature_3') ? maps.get('temperature_3') : [];
                    const list6 = maps.has('temperature_4') ? maps.get('temperature_4') : [];
                    maps.set('temperature_min', [...list, {x: item.date, y: item.temperature.min}]);
                    maps.set('temperature_max', [...list2, {x: item.date, y: item.temperature.max}]);
                    maps.set('temperature_1', [...list3, {x: item.date, y: item.temperature.morning}]);
                    maps.set('temperature_2', [...list4, {x: item.date, y: item.temperature.afternoon}]);
                    maps.set('temperature_3', [...list5, {x: item.date, y: item.temperature.evening}]);
                    maps.set('temperature_4', [...list6, {x: item.date, y: item.temperature.night}]);
                  } else if ('humidity' === key) {
                    const list = maps.has('humidity') ? maps.get('humidity') : [];
                    maps.set(key, [...list, {x: item.date, y: item.humidity.afternoon}]);
                  } else if ('pressure' === key) {
                    const list = maps.has('pressure') ? maps.get('pressure') : [];
                    maps.set(key, [...list, {x: item.date, y: item.pressure.afternoon}]);
                  } else if ('precipitation' === key) {
                    const list = maps.has('precipitation') ? maps.get('precipitation') : [];
                    maps.set(key, [...list, {x: item.date, y: item.precipitation.total}]);
                  } else if ('wind' === key) {
                    const list = maps.has('wind') ? maps.get('wind') : [];
                    maps.set(key, [...list, {x: item.date, y: item.wind.max.speed}]);
                  } else if ('cloud_cover' === key) {
                    const list = maps.has('cloud_cover') ? maps.get('cloud_cover') : [];
                    maps.set(key, [...list, {x: item.date, y: item.cloud_cover.afternoon}]);
                  }
                }
              }
            }
            let i = 0;
            for (const key of labelsNames) {
              datasetsLocal.push({
                label: key,
                data: maps.get(key),
                fill: false,
                borderColor: colors[i],
                backgroundColor: colors[i],
                tension: 0.1
              });
              i++;
            }
            forecastSummaryChart.value = {
              labels,
              datasets: datasetsLocal,
            }
        });

        function generateRandomColors(numColors) {
          const colors = [];
          for (let i = 0; i < numColors; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            colors.push(`rgb(${r}, ${g}, ${b})`); 
          }
          return colors;
        }

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
    },
  };
</script>