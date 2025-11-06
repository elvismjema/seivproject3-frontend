<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const workoutHistory = ref([]);
const loading = ref(true);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    const response = await AthleteServices.getWorkoutHistory();
    if (response.data && response.data.data) {
      workoutHistory.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching workout history:', err);
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
        <strong>OC</strong> Exercise Tracker - My Progress
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Athlete)
      </v-chip>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1>My Progress</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-history</v-icon>
              Workout History
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-list v-else-if="workoutHistory.length > 0">
                <v-list-item v-for="workout in workoutHistory" :key="workout.id" class="mb-2">
                  <template v-slot:prepend>
                    <v-avatar color="#800020">
                      <v-icon color="white">mdi-dumbbell</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold">
                    {{ workout.exercise?.name || 'Exercise' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ new Date(workout.performedDate).toLocaleDateString() }} - 
                    {{ workout.sets }} sets × {{ workout.reps }} reps
                    <span v-if="workout.weight"> @ {{ workout.weight }} lbs</span>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle v-if="workout.notes" class="mt-1">
                    <v-icon size="small">mdi-note-text</v-icon>
                    {{ workout.notes }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <v-alert v-else color="grey-lighten-3" variant="flat">
                <v-icon color="#800020">mdi-information</v-icon>
                No workout history yet. Start recording your workouts!
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>