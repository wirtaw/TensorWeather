<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <router-link class="navbar-item" to="/"> Weather App 
        </router-link>
      </div>
      
      <div class="navbar-menu">
        <div class="navbar-end">
          <router-link class="navbar-item" to="/forecast">Get Forecast</router-link>
          <router-link class="navbar-item" to="/prepare">Prepare data</router-link>
          <router-link class="navbar-item" to="/remove">Remove</router-link>
          <router-link class="navbar-item" to="/results">Model and Prediction</router-link>
          <router-link class="navbar-item" to="/summary">Summary</router-link>
          <router-link class="navbar-item" to="/settings">Settings</router-link>
        </div>
      </div>
    </nav>
</template>
  