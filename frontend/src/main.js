import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { socket, emit, on } from './services/socket.service'; 

const app = createApp(App);
app.use(vuetify);
app.provide('socket', socket);
app.provide('socketEmit', emit);
app.provide('socketOn', on);
app.mount('#app');