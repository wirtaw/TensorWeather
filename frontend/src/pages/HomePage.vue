<template>
    <ForecastForm />
    <ForecastTable />
</template>

<script>
  import ForecastForm from './../components/ForecastForm.vue'
  import ForecastTable from './../components/ForecastTable.vue'
  export default {
    components: {
        ForecastForm,
        ForecastTable
    }
  };
</script>