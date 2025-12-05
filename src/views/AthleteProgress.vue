<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const progressData = ref(null);
const loading = ref(true);
const selectedWeeks = ref(4);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    // Use the athlete progress endpoint that matches coach's view
    const response = await AthleteServices.getAthleteProgress({ days: 30 });
    
    if (response.data && response.data.data) {
      progressData.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching athlete progress:', err);
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.push({ name: 'athlete-dashboard' });
};

// Computed properties based on progressData
const workoutHistory = computed(() => {
  return progressData.value?.workoutHistory || [];
});

const activeGoals = computed(() => {
  return progressData.value?.goals || [];
});

const activePlanProgress = computed(() => {
  return progressData.value?.activePlan || null;
});

const totalWorkouts = computed(() => {
  return progressData.value?.totalWorkouts || 0;
});

const weeklyWorkouts = computed(() => {
  return progressData.value?.weeklyWorkouts || 0;
});

const currentStreak = computed(() => {
  return progressData.value?.currentStreak || 0;
});

// Calculate workout frequency for the chart based on selected weeks
const workoutsByWeek = computed(() => {
  const weeks = {};
  workoutHistory.value.forEach(workout => {
    const date = new Date(workout.performedDate);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });
  return Object.entries(weeks).slice(-selectedWeeks.value).map(([week, count]) => ({
    week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count
  }));
});

const maxWorkoutsPerWeek = computed(() => {
  return Math.max(...workoutsByWeek.value.map(w => w.count), 5);
});

const formatDeadline = (deadline) => {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' (Past due)';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success';
  if (progress >= 67) return 'success';
  if (progress >= 34) return 'warning';
  return 'error';
};
</script>

<style scoped>
.workout-table tbody tr.workout-row {
  transition: all 0.2s ease;
}

.workout-table tbody tr.workout-row:hover {
  background-color: #fff3f3 !important;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(128, 0, 32, 0.1);
}

.workout-table th {
  padding: 16px 12px !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.workout-table td {
  padding: 12px !important;
}
</style>

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

    <v-container class="py-6">

      <!-- Summary Stats -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card elevation="2" class="pa-4">
            <v-row>
              <v-col cols="12" md="4">
                <div class="d-flex align-center">
                  <v-avatar size="50" color="#800020" class="mr-3">
                    <v-icon color="white" size="28">mdi-dumbbell</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold" style="color: #800020">
                      {{ totalWorkouts }}
                    </div>
                    <div class="text-caption text-grey-darken-1">Total Workouts</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="d-flex align-center">
                  <v-avatar size="50" color="#1976D2" class="mr-3">
                    <v-icon color="white" size="28">mdi-calendar-week</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold" style="color: #1976D2">
                      {{ weeklyWorkouts }}
                    </div>
                    <div class="text-caption text-grey-darken-1">This Week</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="d-flex align-center">
                  <v-avatar size="50" color="#4CAF50" class="mr-3">
                    <v-icon color="white" size="28">mdi-fire</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold" style="color: #4CAF50">
                      {{ currentStreak }}
                    </div>
                    <div class="text-caption text-grey-darken-1">Day Streak</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- Current Training Plan -->
      <v-row v-if="activePlanProgress" class="mb-4">
        <v-col cols="12">
          <v-card elevation="3">
            <v-card-title class="text-h5 pa-4" style="background-color: #f5f5f5;">
              <v-icon left color="#800020" size="28">mdi-clipboard-check</v-icon>
              Current Training Plan
            </v-card-title>
            <v-card-text class="pa-6">
              <div class="d-flex align-center mb-4">
                <v-avatar size="50" color="#800020" class="mr-4">
                  <v-icon color="white" size="30">mdi-run</v-icon>
                </v-avatar>
                <div>
                  <h3 class="text-h6 font-weight-bold">{{ activePlanProgress.plan?.name || 'Training Plan' }}</h3>
                  <p class="text-body-2 text-grey-darken-1 ma-0">{{ activePlanProgress.plan?.description }}</p>
                </div>
              </div>
              
              <v-progress-linear
                :model-value="activePlanProgress.progress"
                :color="getProgressColor(activePlanProgress.progress)"
                height="30"
                rounded
                class="mb-4"
              >
                <strong class="text-white">{{ activePlanProgress.progress }}% Complete</strong>
              </v-progress-linear>
              
              <v-row class="text-center">
                <v-col cols="4">
                  <v-card variant="outlined" class="pa-3">
                    <div class="text-h5 font-weight-bold" style="color: #800020">{{ activePlanProgress.daysPassed }}</div>
                    <div class="text-caption text-grey">Days Done</div>
                  </v-card>
                </v-col>
                <v-col cols="4">
                  <v-card variant="outlined" class="pa-3">
                    <div class="text-h5 font-weight-bold" style="color: #800020">{{ activePlanProgress.totalDays }}</div>
                    <div class="text-caption text-grey">Total Days</div>
                  </v-card>
                </v-col>
                <v-col cols="4">
                  <v-card variant="outlined" class="pa-3">
                    <div class="text-h5 font-weight-bold" style="color: #800020">{{ activePlanProgress.daysRemaining }}</div>
                    <div class="text-caption text-grey">Remaining</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Goals Progress -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card elevation="3">
            <v-card-title class="text-h5 pa-4" style="background-color: #f5f5f5;">
              <v-icon left color="#800020" size="28">mdi-bullseye-arrow</v-icon>
              My Goals
              <v-spacer></v-spacer>
              <v-btn 
                color="#800020" 
                variant="outlined" 
                size="small"
                @click="$router.push({ name: 'my-goals' })"
              >
                View All
                <v-icon right>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text class="pa-4">
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <div v-else-if="activeGoals.length > 0">
                <v-card v-for="goal in activeGoals" :key="goal.id" class="mb-3" elevation="1">
                  <v-card-text class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div>
                        <h3 class="text-subtitle-1 font-weight-bold">{{ goal.exercise?.name || 'Goal' }}</h3>
                        <span class="text-caption text-grey">Target: {{ goal.targetValue }} {{ goal.targetUnit }}</span>
                      </div>
                      <v-chip
                        v-if="goal.progress >= 100"
                        size="small"
                        color="success"
                        variant="flat"
                      >
                        <v-icon size="small" start>mdi-check-circle</v-icon>
                        Complete
                      </v-chip>
                      <v-chip
                        v-else
                        size="small"
                        :color="goal.status === 'incomplete' ? 'error' : 'primary'"
                        variant="flat"
                      >
                        {{ goal.status }}
                      </v-chip>
                    </div>
                    
                    <v-progress-linear
                      :model-value="goal.progress"
                      :color="goal.progress >= 100 ? 'success' : getProgressColor(goal.progress)"
                      height="20"
                      rounded
                      class="mb-2"
                    >
                      <strong class="text-white text-caption">{{ Math.round(goal.progress) }}%</strong>
                    </v-progress-linear>
                    
                    <div class="text-caption text-grey">
                      <v-icon size="small" color="#800020">mdi-calendar</v-icon>
                      Target Date: {{ formatDeadline(goal.targetDate) }}
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <v-alert v-else color="info" variant="tonal" class="mt-4">
                <div class="d-flex align-center">
                  <v-icon color="#800020" size="large" class="mr-2">mdi-information</v-icon>
                  <div>
                    <div class="font-weight-bold">No goals yet</div>
                    <div class="text-caption">Talk to your coach about setting goals!</div>
                  </div>
                </div>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Workout Frequency Chart -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card elevation="3">
            <v-card-title class="text-h5 pa-4" style="background-color: #f5f5f5;">
              <v-icon left color="#800020" size="28">mdi-chart-bar</v-icon>
              Workout Activity
              <v-spacer></v-spacer>
              <v-btn-toggle
                v-model="selectedWeeks"
                color="#800020"
                mandatory
                variant="outlined"
                divided
              >
                <v-btn :value="2" size="small">2 Weeks</v-btn>
                <v-btn :value="4" size="small">4 Weeks</v-btn>
                <v-btn :value="5" size="small">5 Weeks</v-btn>
                <v-btn :value="8" size="small">8 Weeks</v-btn>
              </v-btn-toggle>
            </v-card-title>
            <v-card-text class="pa-6">
              <div v-if="workoutsByWeek.length > 0" class="pa-2">
                <div class="d-flex align-end justify-center" style="height: 180px; gap: 12px;">
                  <div
                    v-for="(week, index) in workoutsByWeek"
                    :key="index"
                    class="d-flex flex-column align-center"
                    style="flex: 1; max-width: 60px;"
                  >
                    <div
                      :style="{
                        height: `${Math.max((week.count / maxWorkoutsPerWeek) * 100, 10)}%`,
                        width: '100%',
                        backgroundColor: '#800020',
                        borderRadius: '6px 6px 0 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '4px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }"
                    >
                      {{ week.count }}
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-center mt-3" style="gap: 12px;">
                  <div
                    v-for="(week, index) in workoutsByWeek"
                    :key="index"
                    class="text-center text-caption text-grey"
                    style="flex: 1; max-width: 60px;"
                  >
                    {{ week.week }}
                  </div>
                </div>
              </div>
              <v-alert v-else color="info" variant="tonal" class="mt-4">
                <div class="d-flex align-center">
                  <v-icon color="#800020" size="large" class="mr-2">mdi-chart-line</v-icon>
                  <div>
                    <div class="font-weight-bold">No workout data yet</div>
                    <div class="text-caption">Start recording workouts to see your activity chart!</div>
                  </div>
                </div>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Workouts -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card elevation="3">
            <v-card-title class="text-h5 pa-4" style="background-color: #f5f5f5;">
              <v-icon left color="#800020" size="28">mdi-history</v-icon>
              Recent Workouts
              <v-spacer></v-spacer>
              <v-chip color="#800020" variant="flat" class="text-white">
                Last {{ workoutHistory.slice(0, 8).length }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-table v-else-if="workoutHistory.length > 0" class="workout-table">
                <thead>
                  <tr style="background-color: #fafafa;">
                    <th class="text-left font-weight-bold" style="color: #800020;">Exercise</th>
                    <th class="text-center font-weight-bold" style="color: #800020;">Date</th>
                    <th class="text-center font-weight-bold" style="color: #800020;">Sets</th>
                    <th class="text-center font-weight-bold" style="color: #800020;">Reps</th>
                    <th class="text-center font-weight-bold" style="color: #800020;">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(workout, index) in workoutHistory.slice(0, 8)" 
                    :key="workout.id"
                    :style="index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9f9f9;'"
                    class="workout-row"
                  >
                    <td class="py-3">
                      <div class="d-flex align-center">
                        <v-icon color="#800020" size="20" class="mr-2">mdi-dumbbell</v-icon>
                        <span class="font-weight-medium">{{ workout.exercise?.name || 'Exercise' }}</span>
                      </div>
                    </td>
                    <td class="text-center py-3">
                      <v-chip size="small" variant="outlined" color="grey">
                        <v-icon size="small" start>mdi-calendar</v-icon>
                        {{ new Date(workout.performedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
                      </v-chip>
                    </td>
                    <td class="text-center py-3">
                      <v-chip size="small" color="#800020" variant="flat" class="text-white">
                        {{ workout.sets }}
                      </v-chip>
                    </td>
                    <td class="text-center py-3">
                      <v-chip size="small" color="blue" variant="flat" class="text-white">
                        {{ workout.reps }}
                      </v-chip>
                    </td>
                    <td class="text-center py-3">
                      <v-chip 
                        v-if="workout.weight" 
                        size="small" 
                        color="green" 
                        variant="flat" 
                        class="text-white"
                      >
                        {{ workout.weight }} lbs
                      </v-chip>
                      <span v-else class="text-grey">—</span>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <v-alert v-else color="info" variant="tonal" class="ma-4">
                <div class="d-flex align-center">
                  <v-icon color="#800020" size="large" class="mr-2">mdi-dumbbell</v-icon>
                  <div>
                    <div class="font-weight-bold">No workouts yet</div>
                    <div class="text-caption">Start your fitness journey by recording your first workout!</div>
                  </div>
                </div>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>