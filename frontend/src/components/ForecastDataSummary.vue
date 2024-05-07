<template>
    <div v-if="forecastSummary">
      <h2>Forecast Summary</h2>
      <LineChart :data="forecastSummaryChart" :options="chartOptions" aria-describedby="summary-table" :id="chartId"/>
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
  import { generateRandomColors, prepareDataForChart } from '../helper/chart.ts'
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
            chartId: 'forecast-data-summary',
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
                  text: 'Forecast data summary Chart'
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
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
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
        const colors = generateRandomColors(labelsNames.length);
        
        const forecastSummary = ref(null);
        const forecastSummaryChart = ref(null);

        const on = inject('socketOn');

        on('forecast_summary_request_done', (data) => {
            forecastSummary.value = data;
            forecastSummaryChart.value = {
              ...prepareDataForChart({ labelsNames, labelsBasic, colors, data })
            }
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
    },
  };
</script>