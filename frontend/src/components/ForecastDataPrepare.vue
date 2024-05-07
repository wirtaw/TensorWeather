<template>
    <div>
        <h2>Forecast data processing</h2>
        <hr/>
        <v-container class="form-container">
            <v-form>
                <v-row>
                <v-col cols="12" md="6">
                    <v-text-field 
                    v-model="formData.latitude"
                    label="Latitude"
                    type="number"
                    />
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field 
                    v-model="formData.longitude"
                    label="Longitude"
                    type="number"
                    />
                </v-col>
                </v-row>

                <v-row>
                <v-col cols="12" md="6">
                    <v-date-picker
                    v-model="formData.startDate"
                    label="Start Date" 
                    ></v-date-picker>
                </v-col>

                <v-col cols="12" md="6">
                    <v-date-picker
                    v-model="formData.endDate"
                    label="End Date" 
                    ></v-date-picker>
                </v-col>
                </v-row>
                <v-row class="flex-direction is-align-self-center">
                <v-btn color="primary" @click="submitForecastProcessing">Process Forecast Data</v-btn> 
                <v-btn color="primary" v-if="isDataPrepared" @click="acceptForecastProcessing">Accept Forecast Data</v-btn> 
                </v-row>
            </v-form>
            </v-container>
        <div v-if="forecastCleanData">
            <LineChart :data="forecastProcessingDataChart" :options="chartOptions" aria-describedby="prepared-forecast-table" :id="chartId"/>
            <table class="table" id="prepared-forecast-table">
                <thead>
                <tr>
                    <th>Id</th>
                    <th>Date</th>
                    <th>Temp min (C)</th>
                    <th>Temp max (C)</th>
                    <th>Temp morning</th>
                    <th>Temp afternoon</th>
                    <th>Temp evening</th>
                    <th>Temp night</th>
                    <th>Humidity</th>
                    <th>Precipitation</th>
                    <th>Pressure</th>
                    <th>Wind</th>
                    <th>Cloud cover</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in forecastCleanData" :key="item.id"> 
                    <td>{{ item.id }}</td>
                    <td>{{ item.date }}</td>
                    <td>{{ item.temperature_min }}</td>
                    <td>{{ item.temperature_max }}</td>
                    <td>{{ item.temperature_1 }}</td>
                    <td>{{ item.temperature_2 }}</td>
                    <td>{{ item.temperature_3 }}</td>
                    <td>{{ item.temperature_4 }}</td>
                    <td>{{ item.humidity }}</td>
                    <td>{{ item.precipitation }}</td>
                    <td>{{ item.pressure }}</td>
                    <td>{{ item.wind }}</td>
                    <td>{{ item.cloud_cover }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
    
</template>
  
<script>
  import { generateRandomColors, prepareDataForChart } from '../helper/chart.ts'
  import LineChart from '../components/charts/LineChart.vue';
  import { inject, ref } from 'vue';
  import { mapState, useStore, mapActions } from 'vuex';
  
  export default {
    components: {
      LineChart
    },
    data() {
        return {
            latitude: null, 
            longitude: null,
            chartId: 'forecast-data-prepare',
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
                  text: 'Forecast data prepare Chart'
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
        const labelsBasic = ['wind', 'precipitation', 'pressure', 'humidity', 'temperature_min', 'temperature_max', 'temperature_1', 'temperature_2', 'temperature_3', 'temperature_4', 'cloud_cover'];
        const colors = generateRandomColors(labelsNames.length);

        const store = useStore(); 
        const locationSettings = store.state.locationSettings;

        const formData = ref({ 
            latitude: locationSettings.latitude || '',
            longitude: locationSettings.longitude || '',
            startDate: null,
            endDate: null,
        });
        const forecastRangeData = ref(null);
        const forecastCleanData = ref(null);
        const isDataPrepared = ref(false);
        const forecastProcessingDataChart = ref(null);

        const on = inject('socketOn');
        const emit = inject('socketEmit');

        on('forecast_summary_request_done', (data) => {
            isDataPrepared.value = true;
            forecastRangeData.value = data;
        });

        on('forecast_processing_data_request_done', (data) => {
            isDataPrepared.value = true;
            forecastCleanData.value = data;
            forecastProcessingDataChart.value = {
                ...prepareDataForChart({ labelsNames, labelsBasic, colors, data })
            };
        });

        function submitForecastProcessing() {
            const { latitude, longitude, startDate, endDate } = formData.value;
            
            emit('forecast_processing_data_request', {
                latitude: !Number.isNaN(Number.parseFloat(latitude)) ? Number.parseFloat(latitude) : null,
                longitude: !Number.isNaN(Number.parseFloat(longitude)) ? Number.parseFloat(longitude) : null,
                startDate: (new Date(startDate)).getTime(),
                endDate: (new Date(endDate)).getTime()
            });
        }

        return { forecastRangeData, forecastCleanData, formData, submitForecastProcessing, isDataPrepared, forecastProcessingDataChart };
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
    },
    methods: {
        ...mapActions(['updateProcessedData', 'updateLocationSettings']),
        acceptForecastProcessing() {
            this.updateProcessedData(this.forecastCleanData);
        },
        updateLocation() {
            this.updateLocationSettings({ 
                latitude: this.latitude,
                longitude: this.longitude 
            });
        }
    }
  };
</script>