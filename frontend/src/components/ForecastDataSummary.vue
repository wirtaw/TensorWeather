<template>
    <div>
      <h2>Forecast Summary</h2>
      <hr/>
      <div class="container" v-if="isError">
        <WarningArticle :title="'Problem with summary'" :message="errorMessage"/>
      </div>
      <div v-if="forecastSummary">
        <LineChart :data="forecastSummaryChart" :options="chartOptions" aria-describedby="summary-table" :id="chartId"/>
        <BarChart :data="forecastSummaryBarChart" :options="chartOptionsBar" aria-describedby="summary-table" :id="chartBarId"/>
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
    </div>
</template>

<script>
  import { generateRandomColors, prepareDataForChart, reduceYearByMonths } from '../helper/chart.ts'
  import LineChart from '../components/charts/LineChart.vue';
  import WarningArticle from '../components/articles/WarningArticle.vue';
  import BarChart from '../components/charts/BarChart.vue';
  import { inject, ref } from 'vue';
  import { mapState } from 'vuex';
  
  export default {
    components: {
      LineChart,
      BarChart,
      WarningArticle
    },
    data() {
        return {
            latitude: null, 
            longitude: null,
            chartId: 'forecast-data-summary',
            chartBarId: 'forecast-bar-summary',
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
            },
            chartOptionsBar: {
              responsive: true,
              scales: {
                x: {
                  stacked: true,
                },
                y: {
                  stacked: true
                }
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
        const colorsMonth = generateRandomColors(12);
        
        const forecastSummary = ref(null);
        const forecastSummaryChart = ref(null);
        const forecastSummaryBarChart = ref(null);
        const isError = ref(false);
        const errorMessage = ref('');

        const on = inject('socketOn');

        on('forecast_summary_request_done', (data) => {
            isError.value = false;
            errorMessage.value = '';
            forecastSummary.value = data;
            forecastSummaryChart.value = {
              ...prepareDataForChart({ labelsNames, labelsBasic, colors, data })
            }
            forecastSummaryBarChart.value = {
              ...reduceYearByMonths({ colors: colorsMonth, data })
            };
        });

        on('forecast_summary_request_failed', (data) => {
            isError.value = true;
            forecastSummary.value = null;
            forecastSummaryChart.value = null;
            forecastSummaryBarChart.value = null;
            errorMessage.value = data?.message || 'Unknown message';
        });

        return { 
          forecastSummary, 
          forecastSummaryChart, 
          forecastSummaryBarChart,
          isError,
          errorMessage 
        };
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