import { createStore } from 'vuex';

export default createStore({
  state: {
    formData: null,
    locationSettings: {
        latitude: null,
        longitude: null 
    }
  },
  mutations: {
    setFormData(state, data) {
        state.formData = data;
    },
    updateLocationSettings(state, settings) {
        state.locationSettings = settings;
    }
  },
  actions: {
    async saveFormData({ commit }, formData) {
      commit('setFormData', formData);
    },
    async updateLocationSettings({ commit }, settings) {
      commit('updateLocationSettings', settings);
    },
  },
});