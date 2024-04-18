<template>
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

      <v-btn color="primary" @click="submitForecast">Generate Forecast</v-btn> 
    </v-form>
  </v-container>
  <div v-if="forecastResult">
    <h2>Forecast Result</h2>
    <p>{{ forecastResult }}</p> </div>
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
    const forecastResult = ref(null);

    const emit = inject('socketEmit');
    const on = inject('socketOn');

    function submitForecast() {
      const { latitude, longitude, startDate, endDate } = formData.value;
      emit('forecast_request', {
        latitude: !Number.isNaN(Number.parseFloat(latitude)) ? Number.parseFloat(latitude) : null,
        longitude: !Number.isNaN(Number.parseFloat(longitude)) ? Number.parseFloat(longitude) : null,
        startDate: (new Date(startDate)).getTime(),
        endDate: (new Date(endDate)).getTime()
      }); 
    }

    on('forecast_request_done', (data) => {
      forecastResult.value = data;
    });

    return { submitForecast, formData, forecastResult };
  }
};
</script>