<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="$router.push({ name: 'admin-dashboard' })" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Coach List
      </v-app-bar-title>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1>Coach List</h1>
          <v-alert type="info" class="mt-4">
            This page is under construction. Coming soon!
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup>
// Placeholder component for Coach List
</script>
