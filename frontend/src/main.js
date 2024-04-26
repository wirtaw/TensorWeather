import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { socket, emit, on } from './services/socket.service';
import HomePage from './pages/HomePage.vue'
import ForecastForm from './components/ForecastForm.vue'
import ForecastTable from './components/ForecastTable.vue'
import ForecastRemoveForm from './components/ForecastRemoveForm.vue' 

const routes = [
    { path: '/', component: HomePage },
    { path: '/forecast', component: ForecastForm },
    { path: '/clean', component: ForecastRemoveForm },
    { path: '/results', component: ForecastTable }, 
  ];
  
  const router = createRouter({
    history: createWebHistory(), // Or your preferred history mode 
    routes,
  });

const app = createApp(App);
app.use(vuetify);
app.use(router); 
app.provide('socket', socket);
app.provide('socketEmit', emit);
app.provide('socketOn', on);
app.mount('#app');