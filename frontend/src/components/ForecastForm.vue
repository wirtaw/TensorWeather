<template>
  <form @submit.prevent="submitForecastRequest">
    <button type="submit">Generate Forecast</button>
  </form>
</template>

<script>
import { ref } from 'vue';
import { useSocket } from './../helper/useSocket';

export default {
  setup() {
    const formData = ref({}); // Holds form input data

    const { emit } = useSocket(); 

    const submitForecastRequest = () => {
      emit('forecast_request', formData.value); 
    };

    return { formData, submitForecastRequest };
  },
};
</script>