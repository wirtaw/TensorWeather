<template>
    <Bar
      :id="chartId"
      :data="data" 
      :options="options"
    >Chart couldn't be loaded.</Bar>
</template>
  
<script>
  import { Bar } from 'vue-chartjs'
  import 'chartjs-adapter-luxon'
  import { Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale } from 'chart.js'
  
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
  
  export default {
    name: 'BarChart',
    components: { Bar },
    props: {
        chartId: {
            type: String,
            default: `chart-id-${(new Date()).getTime()}`
        },
        data: {
                type: Object,
                required: true,
        },
        options: {
            type: Object,
            default: () => {}
        }
    }
  }
  </script>