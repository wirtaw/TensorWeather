<template>
    <div>
        <h2>Forecast Remove Form</h2>

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
        
                <v-btn color="primary" @click="submitRemoveForecast">Generate Forecast</v-btn> 
            </v-form>
        </v-container>
    </div>
  </template>
  
  <script>
  import { inject, ref } from 'vue';
  
  export default {
    setup() {
      const formData = ref({ 
        latitude: '',
        longitude: '',
        startDate: null,
        endDate: null,
      });
  
      const emit = inject('socketEmit');
  
      function submitRemoveForecast() {
        const { latitude, longitude, startDate, endDate } = formData.value;
        emit('forecast_remove_request', {
          latitude: !Number.isNaN(Number.parseFloat(latitude)) ? Number.parseFloat(latitude) : null,
          longitude: !Number.isNaN(Number.parseFloat(longitude)) ? Number.parseFloat(longitude) : null,
          startDate: (new Date(startDate)).getTime(),
          endDate: (new Date(endDate)).getTime()
        }); 
      }
  
      return { submitRemoveForecast, formData };
    }
  };
  </script>