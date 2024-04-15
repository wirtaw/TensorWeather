import { createApp } from 'vue';
import App from './App.vue';
import { socket, emit, on } from './socket.service'; 

const app = createApp(App);
app.provide('socket', socket);
app.provide('socketEmit', emit);
app.provide('socketOn', on);
app.mount('#app');