<template>
    <div>
      <h2>Settings Form</h2>
      <v-container class="form-container">
        <v-form>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model="latitude"
                label="Latitude"
                type="number"
                placeholder="Latitude"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field 
                v-model="longitude"
                label="Longitude"
                type="number"
                placeholder="Longitude"
              />
            </v-col>
          </v-row>
          <v-btn color="primary" @click="saveSettings">Save</v-btn> 
        </v-form>
      </v-container>
    </div>
</template>
  
<script>
  import { mapActions, mapState } from 'vuex';
  
  export default {
    data() {
        return {
            latitude: null, 
            longitude: null
        }
    },
    computed: {
        ...mapState(['locationSettings'])
    },
    mounted() {
        this.latitude = this.locationSettings.latitude;
        this.longitude = this.locationSettings.longitude;
    },
    methods: {
        ...mapActions(['updateLocationSettings']),
        saveSettings() {
            this.updateLocationSettings({ 
                latitude: this.latitude,
                longitude: this.longitude 
            });
        }
    }
  };
</script>