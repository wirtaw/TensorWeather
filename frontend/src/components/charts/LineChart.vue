<template>
    <Line
      id="my-chart-id"
      :chart-options="chartOptions"
      :chart-data="chartData"
    >Chart couldn't be loaded.</Line>
  </template>
  
  <script>
  import { Line } from 'vue-chartjs'
  import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale } from 'chart.js'
  
  ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale)
  
  export default {
    name: 'LineChart',
    components: { Line },
    props: {
        chartData: {
                type: Object,
                required: true,
        },
        chartOptions: {
            type: Object,
            default: () => {}
        }
    }
  }
  </script>