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
                </v-row>
            </v-form>
            </v-container>
        <div v-if="forecastCleanData">
            <table class="table">
                <thead>
                <tr>
                    <th>Id</th>
                    <th>Date</th>
                    <th>Temp min</th>
                    <th>Temp max</th>
                    <th>Humidity</th>
                    <th>Precipitation</th>
                    <th>Pressure</th>
                    <th>Wind</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in forecastCleanData" :key="item.id"> 
                    <td>{{ item.id }}</td>
                    <td>{{ item.date }}</td>
                    <td>{{ item.temperature_min }}</td>
                    <td>{{ item.temperature_max }}</td>
                    <td>{{ item.humidity }}</td>
                    <td>{{ item.precipitation }}</td>
                    <td>{{ item.pressure }}</td>
                    <td>{{ item.wind }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
    
</template>
  
<script>
  import { inject, ref } from 'vue';
  import { mapState, useStore } from 'vuex';
  
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

        const on = inject('socketOn');
        const emit = inject('socketEmit');

        on('forecast_summary_request_done', (data) => {
            forecastRangeData.value = data;
        });

        on('forecast_processing_data_request_done', (data) => {
            forecastCleanData.value = data;
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

        return { forecastRangeData, forecastCleanData, formData, submitForecastProcessing };
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