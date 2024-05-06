<template>
    <Line
      id="my-chart-id"
      :data="data" 
      :options="options"
    >Chart couldn't be loaded.</Line>
  </template>
  
  <script>
  import { Line } from 'vue-chartjs'
  import 'chartjs-adapter-luxon'
  import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale, TimeScale, TimeSeriesScale, LineController } from 'chart.js'
  
  ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale, TimeScale, TimeSeriesScale, LineController)
  
  export default {
    name: 'LineChart',
    components: { Line },
    props: {
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