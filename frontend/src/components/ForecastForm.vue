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

    function submitForecast() {
      emit('forecast_request', formData.value); 
    }

    return { submitForecast, formData };
  }
};
</script>