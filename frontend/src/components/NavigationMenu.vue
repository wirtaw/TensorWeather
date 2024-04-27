<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <router-link class="navbar-item" to="/"> Weather App 
        </router-link>
      </div>
      
      <div class="navbar-menu">
        <div class="navbar-end">
          <router-link class="navbar-item" to="/forecast">Generate Forecast</router-link>
          <router-link class="navbar-item" to="/remove">Remove</router-link>
          <router-link class="navbar-item" to="/results">View Results</router-link>
          <router-link class="navbar-item" to="/settings">Settings</router-link>
        </div>
      </div>
    </nav>
</template>
  