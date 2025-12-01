<script setup>
import { ref, computed, onMounted } from 'vue';
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

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success';
  if (progress >= 67) return 'success';
  if (progress >= 34) return 'warning';
  return 'error';
};

const filteredGoals = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return activeGoals.value.filter(goal => {
    // Show all incomplete goals
    if (goal.progress < 100 || goal.status !== 'completed') return true;
    // For completed goals, only show if completed within last week
    if (goal.completedAt) {
      const completedDate = new Date(goal.completedAt);
      return completedDate > oneWeekAgo;
    }
    // If no completedAt date but marked complete, hide after a week from deadline
    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      return deadline > oneWeekAgo;
    }
    return true;
  });
});

const formatDeadline = (deadline) => {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isDeadlineApproaching = (deadline) => {
  if (!deadline) return false;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  return daysUntil <= 7 && daysUntil > 0;
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
            <v-btn 
              color="#800020" 
              variant="elevated" 
              class="text-white"
              @click="$router.push({ name: 'workout-session' })"
            >
              <v-icon left>mdi-play</v-icon>
              Start Workout
            </v-btn>
            <v-btn 
              color="#800020" 
              variant="text"
              @click="$router.push({ name: 'record-workout' })"
            >
              <v-icon left>mdi-pencil</v-icon>
              Record Workout
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
          <v-card-title class="d-flex align-center">
            <v-icon color="#800020" class="mr-2">mdi-bullseye-arrow</v-icon>
            Active Goals
            <v-spacer></v-spacer>
            <v-chip size="small" color="#800020" variant="flat" class="text-white">
              {{ filteredGoals.length }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-list v-if="filteredGoals.length > 0">
              <v-list-item v-for="goal in filteredGoals" :key="goal.id" class="mb-3">
                <div class="w-100">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <v-list-item-title class="font-weight-bold">{{ goal.name }}</v-list-item-title>
                    <v-chip
                      v-if="goal.progress >= 100"
                      size="x-small"
                      color="success"
                      variant="flat"
                      class="text-white"
                    >
                      <v-icon size="x-small" left>mdi-check</v-icon>
                      Complete
                    </v-chip>
                  </div>
                  <v-progress-linear
                    :model-value="goal.progress"
                    :color="goal.progress >= 100 ? 'success' : getProgressColor(goal.progress)"
                    height="25"
                    rounded
                    class="mb-1"
                  >
                    <strong class="text-white">{{ Math.round(goal.progress) }}%</strong>
                  </v-progress-linear>
                  <div class="d-flex justify-space-between text-caption text-grey-darken-1">
                    <span>
                      <v-icon size="x-small" :color="isDeadlineApproaching(goal.deadline) ? 'error' : '#800020'">mdi-calendar-clock</v-icon>
                      Deadline: {{ formatDeadline(goal.deadline) }}
                    </span>
                    <span v-if="goal.targetValue">
                      {{ goal.currentValue || 0 }} / {{ goal.targetValue }} {{ goal.unit || '' }}
                    </span>
                  </div>
                </div>
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