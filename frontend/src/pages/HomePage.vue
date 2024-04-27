<template>
    <div>
      <ForecastForm/>
      <ForecastTable />
      <ForecastRemoveForm/>
    </div>
</template>

<script>
  import ForecastForm from './../components/ForecastForm.vue'
  import ForecastTable from './../components/ForecastTable.vue'
  import ForecastRemoveForm from './../components/ForecastRemoveForm.vue'
  export default {
    components: {
        ForecastForm,
        ForecastTable,
        ForecastRemoveForm
    }
  };
</script>