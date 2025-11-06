<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const assignedPlans = ref([]);
const loading = ref(true);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    const response = await AthleteServices.getAssignedPlans();
    if (response.data && response.data.data) {
      assignedPlans.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching assigned plans:', err);
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.push({ name: 'athlete-dashboard' });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Workout Schedule
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Athlete)
      </v-chip>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1>Workout Schedule</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-calendar-month</v-icon>
              My Training Plans
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-list v-else-if="assignedPlans.length > 0">
                <v-list-item v-for="plan in assignedPlans" :key="plan.id">
                  <v-list-item-title>{{ plan.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ plan.description || 'No description' }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip color="#800020" text-color="white" size="small">
                      {{ plan.duration || 'Ongoing' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else color="grey-lighten-3" variant="flat">
                <v-icon color="#800020">mdi-information</v-icon>
                No workout plans assigned yet. Contact your coach to get started!
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>