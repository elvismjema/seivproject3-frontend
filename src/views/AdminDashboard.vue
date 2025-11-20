<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AdminServices from '../services/adminServices.js';

const router = useRouter();
const user = ref({});
const stats = ref({
  totalUsers: 0,
  totalExercises: 0,
  totalCoaches: 0,
  totalAthletes: 0,
  totalPlans: 0,
  totalStandardPlans: 0
});

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }

  // Fetch admin statistics
  try {
    const response = await AdminServices.getDashboardStats();
    if (response.data) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error);
  }
});

const logout = () => {
  Utils.removeItem("user");
  router.push({ name: "login" });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- OC Branded Header -->
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Admin
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Admin)
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>

    <v-row class="mt-5">
      <v-col cols="12">
        <h1>Welcome Admin, {{ user.fName }}!</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon size="48" color="#800020">mdi-account-group</v-icon>
          <h2 class="mt-3">{{ stats.totalUsers }}</h2>
          <p class="text-grey-darken-2">Total Users</p>
          <v-btn color="#800020" variant="text" @click="$router.push({ name: 'user-management' })">Manage Users</v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon size="48" color="#800020">mdi-clipboard-list</v-icon>
          <h2 class="mt-3">{{ stats.totalPlans }}</h2>
          <p class="text-grey-darken-2">Total Plans</p>
          <v-btn color="#800020" variant="text" @click="$router.push({ name: 'admin-plan-management' })">Manage Plans</v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon size="48" color="#800020">mdi-whistle</v-icon>
          <h2 class="mt-3">{{ stats.totalCoaches }}</h2>
          <p class="text-grey-darken-2">Active Coaches</p>
          <v-btn color="#800020" variant="text" @click="$router.push({ name: 'admin-coaches' })">View Coaches</v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon size="48" color="#800020">mdi-run</v-icon>
          <h2 class="mt-3">{{ stats.totalAthletes }}</h2>
          <p class="text-grey-darken-2">Active Athletes</p>
          <v-btn color="#800020" variant="text" @click="$router.push({ name: 'admin-athletes' })">View Athletes</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-5">
      <v-col cols="12">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>
                  <v-btn color="#800020" variant="elevated" class="mr-2 text-white" @click="$router.push({ name: 'user-management' })">
                    <v-icon left>mdi-account-plus</v-icon>
                    Change User Role
                  </v-btn>
                  <v-btn color="#800020" variant="tonal" class="mr-2" @click="$router.push({ name: 'exercise-management' })">
                    <v-icon left>mdi-plus</v-icon>
                    Add Standard Exercise
                  </v-btn>
                  <v-btn color="#800020" variant="outlined" @click="$router.push({ name: 'admin-plan-management' })">
                    <v-icon left>mdi-clipboard-list</v-icon>
                    Manage Plans
                  </v-btn>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
  </v-container>
</template>