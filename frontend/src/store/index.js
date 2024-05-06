import { createStore } from 'vuex';

export default createStore({
  state: {
    formData: null,
    locationSettings: {
        latitude: null,
        longitude: null 
    },
    preparedData: null,
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
  },
});