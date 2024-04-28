import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import 'bulma/css/bulma.css';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { socket, emit, on } from './services/socket.service';
import store from './store';
import HomePage from './pages/HomePage.vue';
import ForecastForm from './components/ForecastForm.vue';
import ForecastTable from './components/ForecastTable.vue';
import ForecastRemoveForm from './components/ForecastRemoveForm.vue';
import ManageSettings from './components/ManageSettings.vue';
import ForecastDataSummary from './components/ForecastDataSummary.vue';

const routes = [
    { path: '/', component: HomePage },
    { path: '/forecast', component: ForecastForm },
    { path: '/results', component: ForecastTable }, 
    { path: '/settings', component: ManageSettings }, 
    { path: '/remove', component: ForecastRemoveForm },
    { path: '/summary', component: ForecastDataSummary },
  ];
  
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

const app = createApp(App);
app.use(vuetify);
app.use(router); 
app.use(store);
app.provide('socket', socket);
app.provide('socketEmit', emit);
app.provide('socketOn', on);
app.mount('#app');