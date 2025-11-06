<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const todayWorkout = ref(null);
const activeGoals = ref([]);
const recentProgress = ref({
  workoutsThisWeek: 0,
  personalRecords: 0
});
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  // Fetch athlete's workout, goals, and progress
  try {
    loading.value = true;
    const [workoutResponse, goalsResponse, statsResponse] = await Promise.all([
      AthleteServices.getTodayWorkout(),
      AthleteServices.getAthleteGoals(),
      AthleteServices.getWeeklyStats()
    ]);

    if (workoutResponse.data && workoutResponse.data.data) {
      todayWorkout.value = workoutResponse.data.data;
    }
    if (goalsResponse.data && goalsResponse.data.data) {
      activeGoals.value = goalsResponse.data.data;
    }
    if (statsResponse.data && statsResponse.data.data) {
      recentProgress.value = statsResponse.data.data;
    }
  } catch (err) {
    console.error('Error fetching athlete data:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
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
        <strong>OC</strong> Exercise Tracker
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Athlete)
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>

    <v-row class="mt-5">
      <v-col cols="12">
        <h1>Welcome {{ user.fName }}!</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon left color="#800020">mdi-calendar-today</v-icon>
            Today's Workout
          </v-card-title>
          <v-card-text>
            <v-alert v-if="!todayWorkout" color="grey-lighten-3" variant="flat">
              <v-icon color="#800020">mdi-information</v-icon>
              No workout scheduled for today. You can still record a free training session!
            </v-alert>
            <v-list v-else>
              <v-list-item v-for="exercise in todayWorkout" :key="exercise.id">
                <v-list-item-title>{{ exercise.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ exercise.sets }} sets × {{ exercise.reps }} reps
                  <span v-if="exercise.weight">@ {{ exercise.weight }} lbs</span>
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-checkbox v-model="exercise.completed"></v-checkbox>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn color="#800020" variant="elevated" class="text-white">
              <v-icon left>mdi-play</v-icon>
              Start Workout
            </v-btn>
            <v-btn color="#800020" variant="text">
              <v-icon left>mdi-pencil</v-icon>
              Record Exercise
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-3">
          <v-card-title>This Week's Progress</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" class="text-center">
                <div class="text-h3" style="color: #800020">{{ recentProgress.workoutsThisWeek }}</div>
                <div class="text-caption">Workouts</div>
              </v-col>
              <v-col cols="6" class="text-center">
                <div class="text-h3" style="color: #800020">{{ recentProgress.personalRecords }}</div>
                <div class="text-caption">New PRs</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Active Goals</v-card-title>
          <v-card-text>
            <v-list v-if="activeGoals.length > 0">
              <v-list-item v-for="goal in activeGoals" :key="goal.id">
                <v-list-item-title>{{ goal.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  <v-progress-linear
                    :value="goal.progress"
                    color="success"
                    height="20"
                    rounded
                  >
                    {{ goal.progress }}%
                  </v-progress-linear>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-alert v-else color="grey-lighten-3" variant="flat">
              <v-icon color="#800020">mdi-information</v-icon>
              No active goals. Talk to your coach about setting some!
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-3">
      <v-col cols="12">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-btn color="#800020" variant="elevated" class="mr-2 mb-2 text-white" @click="$router.push({ name: 'athlete-progress' })">
              <v-icon left>mdi-chart-line</v-icon>
              View Progress
            </v-btn>
            <v-btn color="#800020" variant="tonal" class="mr-2 mb-2" @click="$router.push({ name: 'record-workout' })">
              <v-icon left>mdi-pencil</v-icon>
              Record Workout
            </v-btn>
            <v-btn color="#800020" variant="outlined" class="mr-2 mb-2" @click="$router.push({ name: 'workout-schedule' })">
              <v-icon left>mdi-calendar</v-icon>
              Workout Schedule
            </v-btn>
            <v-btn color="#800020" variant="outlined" class="mb-2" @click="$router.push({ name: 'my-coaches' })">
              <v-icon left>mdi-account-tie</v-icon>
              My Coaches
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
  </v-container>
</template>