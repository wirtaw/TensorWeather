<template>
  <form @submit.prevent="submitForecastRequest">
    <button type="submit">Generate Forecast</button>
  </form>
</template>

<script>
import { ref, inject } from 'vue';

export default {
  setup() {
    const formData = ref({});

    const emit = inject('socketEmit');

    const submitForecastRequest = () => {
      emit('forecast_request', formData.value); 
    };

    return { formData, submitForecastRequest };
  },
};
</script>