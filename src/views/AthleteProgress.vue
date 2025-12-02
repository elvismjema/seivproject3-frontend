<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const workoutHistory = ref([]);
const activeGoals = ref([]);
const assignedPlans = ref([]);
const loading = ref(true);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    const [historyResponse, goalsResponse, plansResponse] = await Promise.all([
      AthleteServices.getWorkoutHistory(),
      AthleteServices.getAthleteGoals(),
      AthleteServices.getAssignedPlans()
    ]);
    
    if (historyResponse.data && historyResponse.data.data) {
      workoutHistory.value = historyResponse.data.data;
    }
    if (goalsResponse.data && goalsResponse.data.data) {
      activeGoals.value = goalsResponse.data.data;
    }
    if (plansResponse.data && plansResponse.data.data) {
      assignedPlans.value = plansResponse.data.data;
    }
  } catch (err) {
    console.error('Error fetching athlete data:', err);
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.push({ name: 'athlete-dashboard' });
};

// Calculate workout frequency for the chart
const workoutsByWeek = computed(() => {
  const weeks = {};
  workoutHistory.value.forEach(workout => {
    const date = new Date(workout.performedDate);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });
  return Object.entries(weeks).slice(-8).map(([week, count]) => ({
    week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count
  }));
});

const maxWorkoutsPerWeek = computed(() => {
  return Math.max(...workoutsByWeek.value.map(w => w.count), 5);
});

// Calculate plan progress
const activePlanProgress = computed(() => {
  const activePlan = assignedPlans.value.find(plan => {
    const now = new Date();
    const start = new Date(plan.startDate);
    const end = plan.endDate ? new Date(plan.endDate) : null;
    return now >= start && (!end || now <= end);
  });
  
  if (!activePlan) return null;
  
  const now = new Date();
  const start = new Date(activePlan.startDate);
  const end = activePlan.endDate ? new Date(activePlan.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  const progress = Math.min((daysPassed / totalDays) * 100, 100);
  
  return {
    ...activePlan,
    totalDays,
    daysPassed,
    daysRemaining: Math.max(totalDays - daysPassed, 0),
    progress: Math.round(progress)
  };
});

const formatDeadline = (deadline) => {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success';
  if (progress >= 67) return 'success';
  if (progress >= 34) return 'warning';
  return 'error';
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

      <!-- Workout Plan Progress -->
      <v-row v-if="activePlanProgress">
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-clipboard-check</v-icon>
              Current Training Plan
            </v-card-title>
            <v-card-text>
              <h3 class="text-h6 mb-3">{{ activePlanProgress.plan?.name || 'Training Plan' }}</h3>
              <p class="text-body-2 mb-4">{{ activePlanProgress.plan?.description }}</p>
              
              <v-progress-linear
                :model-value="activePlanProgress.progress"
                :color="getProgressColor(activePlanProgress.progress)"
                height="30"
                rounded
                class="mb-3"
              >
                <strong class="text-white">Week {{ Math.ceil(activePlanProgress.daysPassed / 7) }} - {{ activePlanProgress.progress }}% Complete</strong>
              </v-progress-linear>
              
              <v-row class="text-center">
                <v-col cols="4">
                  <div class="text-h5" style="color: #800020">{{ activePlanProgress.daysPassed }}</div>
                  <div class="text-caption">Days Completed</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-h5" style="color: #800020">{{ activePlanProgress.totalDays }}</div>
                  <div class="text-caption">Total Days</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-h5" style="color: #800020">{{ activePlanProgress.daysRemaining }}</div>
                  <div class="text-caption">Days Remaining</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Goals Progress -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-bullseye-arrow</v-icon>
              Goal Progress
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <div v-else-if="activeGoals.length > 0">
                <v-card v-for="goal in activeGoals" :key="goal.id" class="mb-3" variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <h3 class="text-h6">{{ goal.name }}</h3>
                      <v-chip
                        v-if="goal.progress >= 100"
                        size="small"
                        color="success"
                        variant="flat"
                        class="text-white"
                      >
                        <v-icon size="small" left>mdi-check-circle</v-icon>
                        Achieved!
                      </v-chip>
                    </div>
                    
                    <v-progress-linear
                      :model-value="goal.progress"
                      :color="goal.progress >= 100 ? 'success' : getProgressColor(goal.progress)"
                      height="25"
                      rounded
                      class="mb-2"
                    >
                      <strong class="text-white">{{ Math.round(goal.progress) }}%</strong>
                    </v-progress-linear>
                    
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-caption">
                        <v-icon size="small" color="#800020">mdi-calendar-clock</v-icon>
                        Deadline: {{ formatDeadline(goal.deadline) }}
                      </span>
                      <span v-if="goal.targetValue" class="text-caption">
                        {{ goal.currentValue || 0 }} / {{ goal.targetValue }} {{ goal.unit || '' }}
                      </span>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <v-alert v-else color="grey-lighten-3" variant="flat">
                <v-icon color="#800020">mdi-information</v-icon>
                No active goals yet. Talk to your coach about setting goals!
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Workout Frequency Chart -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-chart-bar</v-icon>
              Workout Frequency (Last 8 Weeks)
            </v-card-title>
            <v-card-text>
              <div v-if="workoutsByWeek.length > 0" class="pa-4">
                <div class="d-flex align-end" style="height: 200px; gap: 8px;">
                  <div
                    v-for="(week, index) in workoutsByWeek"
                    :key="index"
                    class="d-flex flex-column align-center"
                    style="flex: 1;"
                  >
                    <div
                      :style="{
                        height: `${(week.count / maxWorkoutsPerWeek) * 100}%`,
                        minHeight: '20px',
                        width: '100%',
                        backgroundColor: '#800020',
                        borderRadius: '4px 4px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }"
                    >
                      {{ week.count }}
                    </div>
                  </div>
                </div>
                <div class="d-flex mt-2" style="gap: 8px;">
                  <div
                    v-for="(week, index) in workoutsByWeek"
                    :key="index"
                    class="text-center text-caption"
                    style="flex: 1;"
                  >
                    {{ week.week }}
                  </div>
                </div>
              </div>
              <v-alert v-else color="grey-lighten-3" variant="flat">
                <v-icon color="#800020">mdi-information</v-icon>
                No workout data available yet for charting.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Workouts -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-history</v-icon>
              Recent Workouts
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-list v-else-if="workoutHistory.length > 0">
                <v-list-item v-for="workout in workoutHistory.slice(0, 10)" :key="workout.id" class="mb-2">
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
                    <span v-if="workout.duration"> • {{ workout.duration }} min</span>
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