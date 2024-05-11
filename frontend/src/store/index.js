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
  },
});