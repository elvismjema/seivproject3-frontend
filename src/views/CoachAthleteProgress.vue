<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Utils from '../config/utils.js';
import CoachServices from '../services/coachServices.js';

const router = useRouter();
const route = useRoute();
const user = ref({});
const athlete = ref(null);
const workouts = ref([]);
const goals = ref([]);
const plans = ref([]);
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
    error.value = null;
    
    // Fetch athlete progress data from backend
    const response = await CoachServices.getAthleteProgress(athleteId);
    
    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data;
      
      // Update athlete info
      athlete.value = data.athlete || {};
      
      // Update workouts, goals, and plans
      workouts.value = data.workouts || [];
      goals.value = data.goals || [];
      plans.value = data.plans || [];
      
      // Update stats
      if (data.stats) {
        stats.value = {
          totalWorkouts: data.stats.totalWorkouts || 0,
          weeklyWorkouts: data.stats.weeklyWorkouts || 0,
          personalRecords: data.stats.personalRecords || 0,
          currentStreak: data.stats.currentStreak || 0
        };
      }
      
      // Prepare chart data if we have workouts
      if (workouts.value.length > 0) {
        prepareChartData(workouts.value);
      }
    } else {
      // Handle case where API returns success: false
      error.value = response.data?.message || 'Failed to load athlete progress';
    }
  } catch (err) {
    console.error('Error fetching athlete progress:', err);
    // Only show error for server errors (500+), not for empty data
    if (err.response?.status >= 500) {
      error.value = err.response?.data?.message || 'Failed to load athlete progress. Please try again later.';
    } else {
      // For 404 or other client errors, set empty data
      workouts.value = [];
      goals.value = [];
      plans.value = [];
      stats.value = {
        totalWorkouts: 0,
        weeklyWorkouts: 0,
        personalRecords: 0,
        currentStreak: 0
      };
    }
  } finally {
    loading.value = false;
  }
};

const prepareChartData = (workouts) => {
  if (!workouts || workouts.length === 0) return;
  
  // Group data by exercise
  const exerciseGroups = {};
  
  workouts.forEach(workout => {
    const exerciseName = workout.exercise?.name || 'Unknown';
    if (!exerciseGroups[exerciseName]) {
      exerciseGroups[exerciseName] = [];
    }
    
    // Calculate volume (weight * reps * sets) or use duration if it's a cardio exercise
    const volume = workout.weight && workout.reps && workout.sets 
      ? workout.weight * workout.reps * workout.sets 
      : workout.duration || 0;
      
    exerciseGroups[exerciseName].push({
      date: new Date(workout.performedDate).toLocaleDateString(),
      weight: workout.weight || 0,
      reps: workout.reps || 0,
      sets: workout.sets || 1,
      volume: volume
    });
  });
  
  // If we have data, prepare the chart
  if (Object.keys(exerciseGroups).length > 0) {
    // Prepare chart datasets
    const colors = ['#800020', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
    const datasets = Object.keys(exerciseGroups).map((exerciseName, index) => ({
      label: exerciseName,
      data: exerciseGroups[exerciseName].map(d => d.volume),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      tension: 0.4,
      fill: true
    }));
    
    // Use the dates from the first exercise as labels
    const firstExercise = exerciseGroups[Object.keys(exerciseGroups)[0]];
    const dates = firstExercise.map(d => d.date);
    
    chartData.value = {
      labels: dates,
      datasets
    };
  } else {
    // Clear chart data if no valid data
    chartData.value = {
      labels: [],
      datasets: []
    };
  }
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

      <!-- Error State (only show for server errors) -->
      <v-row v-if="error && !loading" class="mt-5">
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
          <v-col cols="12" sm="6" md="3" v-for="(stat, index) in [
            { title: 'Total Workouts', value: stats.totalWorkouts, icon: 'mdi-dumbbell', color: 'primary' },
            { title: 'This Week', value: stats.weeklyWorkouts, icon: 'mdi-calendar-week', color: 'success' },
            { title: 'Personal Records', value: stats.personalRecords, icon: 'mdi-trophy', color: 'warning' },
            { title: 'Current Streak', value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`, icon: 'mdi-fire', color: 'error' }
          ]" :key="index">
            <v-card class="pa-4 text-center" height="100%">
              <v-icon :color="stat.color" size="48">{{ stat.icon }}</v-icon>
              <h3 class="text-h4 mt-2">{{ stat.value || 0 }}</h3>
              <p class="text-subtitle-1 text-grey">{{ stat.title }}</p>
            </v-card>
          </v-col>
        </v-row>

        <!-- Goals -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-h5">
                <v-icon left color="#800020">mdi-flag-checkered</v-icon>
                Active Goals
                <v-spacer></v-spacer>
                <v-chip color="primary" size="small" class="mr-2">
                  {{ goals.length }} active
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-list v-if="goals.length > 0" class="pa-0">
                  <v-list-item 
                    v-for="(goal, index) in goals" 
                    :key="index" 
                    class="px-0"
                  >
                    <v-list-item-avatar>
                      <v-progress-circular
                        :model-value="getGoalProgress(goal)"
                        :color="getGoalColor(getGoalProgress(goal))"
                        :size="48"
                        :width="4"
                        class="mr-2"
                      >
                        {{ getGoalProgress(goal) }}%
                      </v-progress-circular>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <div class="d-flex align-center">
                        <v-list-item-title class="text-h6">
                          {{ goal.title }}
                        </v-list-item-title>
                        <v-chip 
                          v-if="goal.status" 
                          :color="goal.status === 'completed' ? 'success' : 'primary'" 
                          size="x-small" 
                          class="ml-2"
                          density="compact"
                        >
                          {{ goal.status }}
                        </v-chip>
                      </div>
                      <v-list-item-subtitle class="mt-1">
                        {{ goal.description }}
                      </v-list-item-subtitle>
                      <div v-if="goal.targetDate" class="text-caption text-grey">
                        <v-icon x-small>mdi-calendar</v-icon> 
                        Target: {{ formatDate(goal.targetDate) }}
                      </div>
                      <v-progress-linear
                        :model-value="getGoalProgress(goal)"
                        :color="getGoalColor(getGoalProgress(goal))"
                        height="8"
                        class="mt-2"
                        rounded
                      ></v-progress-linear>
                      <div class="d-flex justify-space-between mt-1">
                        <span class="text-caption">{{ goal.currentValue || 0 }} / {{ goal.targetValue }} {{ goal.metric || '' }}</span>
                        <span class="text-caption">{{ getGoalProgress(goal) }}%</span>
                      </div>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
                <v-alert v-else type="info" variant="tonal" class="ma-2">
                  <v-icon left>mdi-information</v-icon>
                  No active goals for this athlete.
                </v-alert>
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
                Recent Workouts
                <v-spacer></v-spacer>
                <v-chip color="primary" size="small" class="mr-2">
                  {{ workouts.length }} total
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-list v-if="workouts.length > 0" class="pa-0">
                  <v-list-item 
                    v-for="(workout, index) in workouts.slice(0, 5)" 
                    :key="index" 
                    class="px-0"
                  >
                    <v-list-item-avatar>
                      <v-icon color="#800020">mdi-dumbbell</v-icon>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title>{{ workout.exercise?.name || 'Unknown Exercise' }}</v-list-item-title>
                      <v-list-item-subtitle class="d-flex flex-wrap">
                        <span class="mr-2">{{ formatDate(workout.performedDate) }}</span>
                        <template v-if="workout.sets && workout.reps">
                          <span class="mr-2">• {{ workout.sets }}x{{ workout.reps }}</span>
                        </template>
                        <template v-if="workout.weight">
                          <span class="mr-2">• {{ workout.weight }} lbs</span>
                        </template>
                        <template v-if="workout.duration">
                          <span class="mr-2">• {{ Math.floor(workout.duration / 60) }}m {{ workout.duration % 60 }}s</span>
                        </template>
                        <template v-if="workout.distance">
                          <span class="mr-2">• {{ workout.distance }} mi</span>
                        </template>
                      </v-list-item-subtitle>
                      <v-list-item-subtitle v-if="workout.notes" class="text-caption text-grey mt-1">
                        <v-icon x-small>mdi-note-text</v-icon> {{ workout.notes }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
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
