<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Utils from '../config/utils.js';
import CoachServices from '../services/coachServices.js';

const router = useRouter();
const route = useRoute();
const user = ref({});
const athlete = ref(null);
const workoutHistory = ref([]);
const goals = ref([]);
const stats = ref({
  totalWorkouts: 0,
  weeklyWorkouts: 0,
  personalRecords: 0,
  currentStreak: 0
});
const loading = ref(true);
const error = ref(null);

// Chart data for progress visualization
const chartData = ref({
  labels: [],
  datasets: []
});

const goBack = () => {
  router.push({ name: 'coach-dashboard' });
};

const fetchAthleteProgress = async () => {
  const athleteId = route.params.id;
  
  if (!athleteId) {
    error.value = 'No athlete ID provided';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    
    // Fetch athlete progress data from backend
    const response = await CoachServices.getAthleteProgress(athleteId);
    
    if (response.data && response.data.data) {
      const data = response.data.data;
      
      athlete.value = data.athlete || {};
      workoutHistory.value = data.workoutHistory || [];
      goals.value = data.goals || [];
      stats.value = {
        totalWorkouts: data.totalWorkouts || 0,
        weeklyWorkouts: data.weeklyWorkouts || 0,
        personalRecords: data.personalRecords || 0,
        currentStreak: data.currentStreak || 0
      };
      
      // Prepare chart data if available
      if (data.progressData) {
        prepareChartData(data.progressData);
      }
    }
  } catch (err) {
    console.error('Error fetching athlete progress:', err);
    error.value = err.response?.data?.message || 'Failed to load athlete progress';
  } finally {
    loading.value = false;
  }
};

const prepareChartData = (progressData) => {
  if (!progressData || progressData.length === 0) return;
  
  // Group data by exercise
  const exerciseGroups = {};
  
  progressData.forEach(item => {
    const exerciseName = item.exerciseName || 'Unknown';
    if (!exerciseGroups[exerciseName]) {
      exerciseGroups[exerciseName] = [];
    }
    exerciseGroups[exerciseName].push({
      date: new Date(item.date).toLocaleDateString(),
      weight: item.weight || 0,
      reps: item.reps || 0,
      volume: (item.weight || 0) * (item.reps || 0) * (item.sets || 1)
    });
  });
  
  // Prepare chart datasets
  const colors = ['#800020', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
  const datasets = Object.keys(exerciseGroups).map((exerciseName, index) => ({
    label: exerciseName,
    data: exerciseGroups[exerciseName].map(d => d.volume),
    borderColor: colors[index % colors.length],
    backgroundColor: colors[index % colors.length] + '20',
    tension: 0.4
  }));
  
  chartData.value = {
    labels: exerciseGroups[Object.keys(exerciseGroups)[0]].map(d => d.date),
    datasets
  };
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getGoalProgress = (goal) => {
  if (!goal.targetValue || !goal.currentValue) return 0;
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
};

const getGoalColor = (progress) => {
  if (progress >= 75) return 'success';
  if (progress >= 50) return 'warning';
  return 'error';
};

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'coach') {
    router.push({ name: 'login' });
    return;
  }
  
  await fetchAthleteProgress();
});
</script>

<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Athlete Progress
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Coach)
      </v-chip>
    </v-app-bar>

    <v-container>
      <!-- Loading State -->
      <v-row v-if="loading" class="mt-5">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="#800020" size="64"></v-progress-circular>
          <p class="mt-4">Loading athlete progress...</p>
        </v-col>
      </v-row>

      <!-- Error State -->
      <v-row v-else-if="error" class="mt-5">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">
            <v-icon>mdi-alert-circle</v-icon>
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <!-- Main Content -->
      <template v-else>
        <!-- Athlete Header -->
        <v-row class="mt-5">
          <v-col cols="12">
            <v-card class="pa-4">
              <v-row align="center">
                <v-col cols="auto">
                  <v-avatar size="80" color="#800020">
                    <v-icon size="50" color="white">mdi-account</v-icon>
                  </v-avatar>
                </v-col>
                <v-col>
                  <h1 class="text-h4">{{ athlete?.name || 'Athlete' }}</h1>
                  <p class="text-subtitle-1 text-grey-darken-1">
                    <v-icon size="small">mdi-email</v-icon>
                    {{ athlete?.email || 'No email' }}
                  </p>
                  <v-chip v-if="athlete?.currentPlan" color="#800020" size="small" class="mt-2">
                    <v-icon left size="small">mdi-clipboard-list</v-icon>
                    {{ athlete.currentPlan }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>

        <!-- Statistics Cards -->
        <v-row class="mt-4">
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="40" color="#800020">mdi-calendar-check</v-icon>
                <div class="text-h4 font-weight-bold mt-2">{{ stats.totalWorkouts }}</div>
                <div class="text-subtitle-1">Total Workouts</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="40" color="#800020">mdi-calendar-week</v-icon>
                <div class="text-h4 font-weight-bold mt-2">{{ stats.weeklyWorkouts }}</div>
                <div class="text-subtitle-1">This Week</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="40" color="#800020">mdi-trophy</v-icon>
                <div class="text-h4 font-weight-bold mt-2">{{ stats.personalRecords }}</div>
                <div class="text-subtitle-1">Personal Records</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="40" color="#800020">mdi-fire</v-icon>
                <div class="text-h4 font-weight-bold mt-2">{{ stats.currentStreak }}</div>
                <div class="text-subtitle-1">Day Streak</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Goals Section -->
        <v-row class="mt-4" v-if="goals.length > 0">
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-h5">
                <v-icon left color="#800020">mdi-target</v-icon>
                Active Goals
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item v-for="goal in goals" :key="goal.id" class="mb-3">
                    <v-list-item-title class="font-weight-bold">
                      {{ goal.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="mt-1">
                      {{ goal.description }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle class="mt-2">
                      <v-progress-linear
                        :model-value="getGoalProgress(goal)"
                        :color="getGoalColor(getGoalProgress(goal))"
                        height="20"
                        rounded
                      >
                        <strong>{{ getGoalProgress(goal) }}%</strong>
                      </v-progress-linear>
                      <div class="d-flex justify-space-between mt-1 text-caption">
                        <span>Current: {{ goal.currentValue || 0 }} {{ goal.metric }}</span>
                        <span>Target: {{ goal.targetValue }} {{ goal.metric }}</span>
                        <span v-if="goal.targetDate">Due: {{ formatDate(goal.targetDate) }}</span>
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Progress Chart -->
        <v-row class="mt-4" v-if="chartData.datasets && chartData.datasets.length > 0">
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-h5">
                <v-icon left color="#800020">mdi-chart-line</v-icon>
                Progress Over Time
              </v-card-title>
              <v-card-text>
                <div class="text-center text-grey">
                  <v-icon size="64" color="grey-lighten-1">mdi-chart-line-variant</v-icon>
                  <p class="mt-2">Progress chart visualization would appear here</p>
                  <p class="text-caption">This feature requires chart.js integration</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Workout History -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-h5">
                <v-icon left color="#800020">mdi-history</v-icon>
                Recent Workout History
              </v-card-title>
              <v-card-text>
                <v-list v-if="workoutHistory.length > 0">
                  <v-list-item v-for="workout in workoutHistory" :key="workout.id" class="mb-2">
                    <template v-slot:prepend>
                      <v-avatar color="#800020">
                        <v-icon color="white">mdi-dumbbell</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold">
                      {{ workout.exerciseName || workout.exercise?.name || 'Exercise' }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      <v-icon size="small">mdi-calendar</v-icon>
                      {{ formatDate(workout.performedDate || workout.date) }} - 
                      <v-icon size="small" class="ml-2">mdi-weight-lifter</v-icon>
                      {{ workout.sets }} sets × {{ workout.reps }} reps
                      <span v-if="workout.weight">
                        <v-icon size="small" class="ml-2">mdi-weight</v-icon>
                        {{ workout.weight }} lbs
                      </span>
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="workout.notes" class="mt-1">
                      <v-chip size="small" variant="tonal">
                        <v-icon size="small" left>mdi-note-text</v-icon>
                        {{ workout.notes }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
                <v-alert v-else color="grey-lighten-3" variant="flat">
                  <v-icon color="#800020">mdi-information</v-icon>
                  No workout history available for this athlete yet.
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </v-container>
  </v-container>
</template>

<style scoped>
.v-card {
  border-radius: 8px;
}

.text-h4 {
  color: #800020;
}
</style>
