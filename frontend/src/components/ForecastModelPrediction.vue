<template>
    <div class="columns">
      <div class="column is-four-fifths">
        <div class="container">
          <h1 class="has-text-light">Forecast Model and Prediction</h1>
          <p class="has-text-primary">

          </p>
          <h2 class="has-text-light">Setup</h2>
          <p class="has-text-primary">
            We'll load our data and train our model from scratch since it trains pretty quickly.
            Set date start - end ranges. Place coordinates.
            Select data types. By default all.
            Press train button. 
            <v-container class="form-container is-flex is-justify-content-center" id="trainForm" v-if="isDataPrepared">
              <v-form>
                <v-row class="flex-direction is-align-self-center">
                  <v-btn color="primary" @click="loadData">load</v-btn>
                  <v-btn color="primary" :disabled="!isDataLoaded" @click="runBuildModel">build</v-btn>
                  <v-btn color="primary" :disabled="!isModelBuilded" @click="runTrainModel">train</v-btn>
                </v-row>
              </v-form>
            </v-container>
            <v-container class="form-container is-flex is-justify-content-center" id="completeForm" v-if="isModelTrained">
              <p class="has-text-primary">Model trained</p>
            </v-container>
            <span class="buttons is-flex is-justify-content-center">
              <router-link class="button" to="/prepare" v-if="!isDataPrepared">Prepare data</router-link>
            </span>
            <v-container class="form-container">
              <v-form>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select 
                    v-model="predictionArguments.modelType" 
                    label="'model type'"
                    :items="modelTypes"
                    >
                      <template v-slot:append>
                        <v-tooltip
                          location="end"
                          activator="parent">
                          Type of the model to train. Use 'baseline' to compute the commonsense baseline prediction error.
                        </v-tooltip>
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-checkbox 
                    :label="`GPU :${predictionArguments.gpu}`"
                    v-model="predictionArguments.gpu"
                    style="display: block;">
                  </v-checkbox>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6">
                    
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-slider 
                    v-model="predictionArguments.lookBack" 
                    label="lookBack"
                    :max="lookBackMax"
                    :min="lookBackMin"
                    class="align-center"
                    show-ticks="always"
                    step="1"
                    tick-size="100"
                    >
                    <template v-slot:append>
                      <v-text-field
                        v-model="predictionArguments.lookBack"
                        density="compact"
                        type="number"
                        hide-details
                        single-line
                      ></v-text-field>
                      <v-tooltip
                        location="end"
                        activator="parent">
                        Look-back period (# of rows) for generating features
                      </v-tooltip>
                    </template>
                    </v-slider>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-slider 
                    v-model="predictionArguments.step" 
                    label="step"
                    :max="stepMax"
                    :min="stepMin"
                    class="align-center"
                    show-ticks="always"
                    step="1"
                    tick-size="1"
                    >
                    <template v-slot:append>
                      <v-text-field
                        v-model="predictionArguments.step"
                        density="compact"
                        style="width: 70px"
                        type="number"
                        hide-details
                        single-line
                      ></v-text-field>
                      <v-tooltip
                        location="end"
                        activator="parent">
                        Step size (# of rows) used for generating features
                      </v-tooltip>
                    </template>
                    </v-slider>
                  </v-col>
                </v-row>
                <v-row class="flex-direction is-align-self-center">
                  <v-btn color="primary" @click="setArguments">set arguments</v-btn> 
                </v-row>
              </v-form>
            </v-container>
          </p>
          <h2 class="has-text-light">Our model</h2>
          <div v-if="forecastResult">
            <h2 class="has-text-light">Forecast Result</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Date</th>
                  <th>Temp</th>
                  <th>Humidity</th>
                  <th>Precipitation</th>
                  <th>Pressure</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in forecastResult" :key="item.id"> 
                  <td>{{ item.id }}</td>
                  <td>{{ item.date }}</td>
                  <td>{{ item.temperature.min }} / {{ item.temperature.max }}</td>
                  <td>{{ item.humidity.afternoon }}</td>
                  <td>{{ item.precipitation.afternoon }}</td>
                  <td>{{ item.pressure.afternoon }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="column ">
        graph
      </div>
    </div>
</template>
  
<script>
  import { ref, inject } from 'vue';
  import { useStore } from 'vuex';
  import * as tf from '@tensorflow/tfjs';
  import * as tfvis from '@tensorflow/tfjs-vis';
  
  export default {
    data() {
        return {
            latitude: null, 
            longitude: null,
            startDate: null,
            endDate: null
        }
    },
    setup() {
      window.tf = tf;
      window.tfvis = tfvis;

      window.data;
      window.model;

      const store = useStore(); 
      const locationSettings = store.state.locationSettings;
      const trainArguments = store.state.trainArguments;
      const learnDateRange = store.state.learnDateRange;
      const preparedData = store.state.preparedData;
      //const columns = (preparedData && Array.isArray(preparedData) && preparedData.length) ? Object.keys(preparedData[0])
      //  .filter((name) => !['id', 'date'].includes(name)) : [];

      const predictionSettings = ref({ 
          latitude: locationSettings.latitude || '',
          longitude: locationSettings.longitude || '',
          startDate: learnDateRange.startDate,
          endDate: learnDateRange.endDate,
      });
      const predictionArguments = ref({ 
        modelType: trainArguments.modelType || 'gru',
        gpu: trainArguments.gpu || false,
        lookBack: trainArguments.lookBack || 10 * 24 * 6,
        step: trainArguments.step || 5,
        delay: trainArguments.delay || 24 * 6,
        normalize: trainArguments.normalize || true,
        includeDateTime: trainArguments.includeDateTime || false,
        batchSize: trainArguments.batchSize || 128,
        epochs: trainArguments.epochs || 10,
        earlyStoppingPatience: trainArguments.earlyStoppingPatience || 2,
        logDir: trainArguments.logDir || '',
        logUpdateFreq: trainArguments.logUpdateFreq || 'batch'
      });

      const forecastResult = ref(null);
      const isDataPrepared = ref(false);
      const isDataLoaded = ref(false);
      const isModelBuilded = ref(false);
      const isModelTrained = ref(false);
      const normalizedData = ref([]);
      const modelTypes = ref(['baseline', 'gru', 'simpleRNN']);
      const lookBackMax = ref(1000 * 24 * 6);
      const lookBackMin = ref(10 * 24 * 6);
      const stepMax = ref(10);
      const stepMin = ref(1);
      const weatherData = ref(null);
      const on = inject('socketOn');
      const emit = inject('socketEmit');

      if (preparedData && Array.isArray(preparedData) > 0) {
        // console.log('data:', data);
        isDataPrepared.value = true;
        tfvis.visor().surface({name: 'Forecast Surface', tab: 'My Tab'});
      }

      on('forecast_request_done', (data) => {
        forecastResult.value = data;
      });

      function setArguments() {
        const { modelType, 
          gpu, 
          lookBack, 
          step, 
          delay, 
          normalize, 
          includeDateTime, 
          batchSize,
          epochs,
          earlyStoppingPatience,
          logDir,
          logUpdateFreq
        } = predictionArguments.value;

        store.dispatch('setArguments', { 
          modelType, 
          gpu, 
          lookBack,
          step,
          delay,
          normalize,
          includeDateTime,
          batchSize,
          epochs,
          earlyStoppingPatience,
          logDir,
          logUpdateFreq
        });
      }

      async function loadData() {
        if (preparedData && Array.isArray(preparedData) > 0) {
          emit('forecast_prepare_data_load_request', { data: preparedData });
        } 
      }

      on('forecast_prepare_data_load_request_done', (data) => {
        normalizedData.value = data;
        isDataLoaded.value = true;
      });

      async function runBuildModel() {
        let numFeatures = normalizedData.value[0].length;
        const { modelType, 
          lookBack, 
          step, 
          delay, 
          normalize, 
          includeDateTime, 
          batchSize,
          epochs,
          earlyStoppingPatience,
          logDir,
          logUpdateFreq
        } = predictionArguments.value;

        emit('forecast_build_model_request', {
          modelType, 
          lookBack, 
          step, 
          delay, 
          normalize, 
          includeDateTime, 
          batchSize,
          epochs,
          earlyStoppingPatience,
          logDir,
          logUpdateFreq,
          numFeatures
        });

        return true;
      }

      on('forecast_build_model_request_done', () => {
        isModelBuilded.value = true;
      });

      async function runTrainModel() {

        emit('forecast_train_model_request', {});

        return true;
      }

      on('forecast_train_model_request_done', () => {
        isModelTrained.value = true;
      });
  
      return { 
        forecastResult,
        predictionSettings,
        isDataPrepared,
        isDataLoaded,
        isModelBuilded,
        isModelTrained,
        runBuildModel,
        runTrainModel,
        loadData,
        normalizedData,
        predictionArguments, 
        modelTypes,
        setArguments,
        lookBackMax,
        lookBackMin,
        stepMax,
        stepMin,
        weatherData
      };
    },

  };
</script>