<template>
    <div>
      <ForecastForm/>
      <ForecastDataPrepare />
      <ForecastRemoveForm/>
    </div>
</template>

<script>
  import ForecastForm from './../components/ForecastForm.vue'
  import ForecastDataPrepare from './../components/ForecastDataPrepare.vue'
  import ForecastRemoveForm from './../components/ForecastRemoveForm.vue'
  export default {
    components: {
        ForecastForm,
        ForecastDataPrepare,
        ForecastRemoveForm
    }
  };
</script>