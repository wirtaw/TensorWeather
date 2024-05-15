import { createStore } from 'vuex';

export default createStore({
  state: {
    formData: null,
    locationSettings: {
        latitude: null,
        longitude: null 
    },
    preparedData: null,
    predictDateRange: {
      startDate: null,
      endDate: null 
    },
    learnDateRange: {
      startDate: null,
      endDate: null 
    },
    trainArguments: {
      modelType: null,
      gpu: false,
      lookBack: 10 * 24 * 6,
      step: 6,
      delay: 144,
      normalize: true,
      includeDateTime: false,
      batchSize: 128,
      epochs: 20,
      earlyStoppingPatience: 2,
      logDir: '',
      logUpdateFreq: null
    }
  },
  mutations: {
    setFormData(state, data) {
        state.formData = data;
    },
    updateLocationSettings(state, settings) {
        state.locationSettings = settings;
    },
    updateProcessedData(state, data) {
      state.preparedData = data;
    },
    setPredictDateRange(state, data) {
      state.predictDateRange = data;
    },
    setLearnDateRange(state, data) {
      state.learnDateRange = data;
    },
    setArguments(state, data) {
      state.trainArguments = data;
    },
  },
  actions: {
    async saveFormData({ commit }, formData) {
      commit('setFormData', formData);
    },
    async updateLocationSettings({ commit }, settings) {
      commit('updateLocationSettings', settings);
    },
    async updateProcessedData({ commit }, data) {
      commit('updateProcessedData', data);
    },
    async setPredictDateRange({ commit }, data) {
      commit('setPredictDateRange', data);
    },
    async setLearnDateRange({ commit }, data) {
      commit('setLearnDateRange', data);
    },
    async setArguments({ commit }, data) {
      commit('setArguments', data);
    },
  },
});