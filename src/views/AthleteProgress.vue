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
      <!-- Progress Overview Cards -->
      <v-row class="mt-4">
        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon left color="#800020">mdi-calendar-check</v-icon>
              Weekly Progress
            </v-card-title>
            <v-card-text>
              <div class="text-h4 mb-2" style="color: #800020">{{ weeklyStats.workoutCount }} / 5</div>
              <div class="text-subtitle-1">Workouts This Week</div>
              <v-progress-linear
                :model-value="weeklyStats.completionRate"
                color="#800020"
                height="10"
                class="mt-2"
              ></v-progress-linear>
              <div class="text-caption text-right mt-1">{{ weeklyStats.completionRate }}% of weekly goal</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon left color="#800020">mdi-bullseye-arrow</v-icon>
              Goals Progress
            </v-card-title>
            <v-card-text>
              <div class="text-h4 mb-2" style="color: #800020">
                {{ completedGoalsCount }} / {{ activeGoals.length }}
              </div>
              <div class="text-subtitle-1">Goals Completed</div>
              <v-progress-linear
                :model-value="goalsCompletionRate"
                color="#800020"
                height="10"
                class="mt-2"
              ></v-progress-linear>
              <div class="text-caption text-right mt-1">{{ goalsCompletionRate }}% of all goals</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon left color="#800020">mdi-trending-up</v-icon>
              Progress Trend
            </v-card-title>
            <v-card-text>
              <div class="text-h4 mb-2" style="color: #800020">
                {{ progressTrend > 0 ? '+' : '' }}{{ progressTrend }}%
              </div>
              <div class="text-subtitle-1">From Last Week</div>
              <div class="mt-2 d-flex align-center">
                <v-icon :color="progressTrend >= 0 ? 'success' : 'error'" class="mr-1">
                  {{ progressTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
                <span :class="progressTrend >= 0 ? 'success--text' : 'error--text'">
                  {{ Math.abs(progressTrend) }}% {{ progressTrend >= 0 ? 'increase' : 'decrease' }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Workout Plan Progress -->
      <v-row v-if="activePlanProgress" class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon left color="#800020">mdi-clipboard-check</v-icon>
              {{ isAdminView ? 'Athlete\'s' : 'My' }} Current Training Plan
              <v-spacer></v-spacer>
              <v-btn
                v-if="isAdminView && activePlanProgress.plan"
                color="error"
                variant="tonal"
                size="small"
                prepend-icon="mdi-delete"
                @click="confirmRemovePlan"
              >
                Remove Plan
              </v-btn>
            </v-card-title>
            <v-card-text>
              <h3 class="text-h6 mb-3">{{ activePlanProgress.plan?.name || 'Training Plan' }}</h3>
              <p class="text-body-2 mb-4">{{ activePlanProgress.plan?.description || 'No description available' }}</p>
              
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

      <!-- Workout Frequency Chart -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h5 d-flex align-center">
              <v-icon left color="#800020">mdi-chart-line</v-icon>
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

      <!-- Goals and Recent Workouts -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card class="h-100" elevation="2">
            <v-card-title class="text-h5 d-flex align-center">
              <v-icon left color="#800020">mdi-bullseye-arrow</v-icon>
              Active Goals
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <div v-else-if="activeGoals.length > 0">
                <v-card
                  v-for="goal in activeGoals"
                  :key="goal.id"
                  class="mb-3"
                  variant="outlined"
                >
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
                        {{ formatDate(goal.deadline) }}
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
              
              <v-btn
                color="#800020"
                variant="text"
                class="mt-2"
                @click="$router.push({ name: 'athlete-goals' })"
              >
                View All Goals
                <v-icon right>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="h-100" elevation="2">
            <v-card-title class="text-h5 d-flex align-center">
              <v-icon left color="#800020">mdi-trophy</v-icon>
              Recent Workouts
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-list v-else class="pa-0">
                <v-list-item
                  v-for="(workout, index) in recentWorkouts"
                  :key="workout.id || index"
                  class="px-4 py-2"
                  :class="{ 'bg-grey-lighten-4': index % 2 === 0 }"
                >
                  <template v-slot:prepend>
                    <v-avatar color="#800020" size="40" class="mr-3">
                      <v-icon color="white" size="small">mdi-dumbbell</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ getWorkoutName(workout) }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="d-flex align-center flex-wrap mt-1">
                    <span class="d-flex align-center mr-3">
                      <v-icon size="small" color="#800020" class="mr-1">mdi-calendar</v-icon>
                      {{ formatDateTime(workout?.performedDate) }}
                    </span>
                    <span v-if="workout?.sets && workout?.reps" class="d-flex align-center mr-3">
                      <v-icon size="small" color="#800020" class="mr-1">mdi-reload</v-icon>
                      {{ workout.sets }} sets × {{ workout.reps }} reps
                    </span>
                    <span v-if="workout?.weight" class="d-flex align-center">
                      <v-icon size="small" color="#800020" class="mr-1">mdi-weight</v-icon>
                      {{ workout.weight }} lbs
                    </span>
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      @click="viewWorkoutDetails(workout)"
                    >
                      <v-icon>mdi-information-outline</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
                <v-list-item class="px-0">
                  <v-btn
                    color="#800020"
                    variant="text"
                    class="mt-2"
                    @click="viewAllWorkouts"
                  >
                    View All Workouts
                    <v-icon right>mdi-arrow-right</v-icon>
                  </v-btn>
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

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AdminServices from '../services/adminServices.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const route = useRoute();
const user = ref({});
const isAdminView = ref(false);
const athleteId = ref(null);
const workoutHistory = ref([]);
const activeGoals = ref([]);
const completedGoals = ref([]);
const assignedPlans = ref([]);
const loading = ref(true);
const activePlanProgress = ref(null);
const workoutsByWeek = ref([]);
const maxWorkoutsPerWeek = ref(0);

// Computed properties
const recentWorkouts = computed(() => {
  try {
    if (!Array.isArray(workoutHistory.value)) {
      console.warn('workoutHistory is not an array:', workoutHistory.value);
      return [];
    }
    
    return [...workoutHistory.value]
      .sort((a, b) => {
        try {
          const dateA = a?.performedDate ? new Date(a.performedDate) : new Date(0);
          const dateB = b?.performedDate ? new Date(b.performedDate) : new Date(0);
          return dateB - dateA;
        } catch (e) {
          console.error('Error sorting workouts:', e);
          return 0;
        }
      })
      .slice(0, 10);
  } catch (e) {
    console.error('Error in recentWorkouts computed property:', e);
    return [];
  }
});

const completedGoalsCount = computed(() => {
  return activeGoals.value.filter(goal => goal.progress >= 100).length;
});

const goalsCompletionRate = computed(() => {
  if (activeGoals.value.length === 0) return 0;
  const totalProgress = activeGoals.value.reduce((sum, goal) => sum + (goal.progress || 0), 0);
  return Math.round(totalProgress / activeGoals.value.length);
});

const weeklyStats = computed(() => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const thisWeekWorkouts = workoutHistory.value.filter(workout => {
    const workoutDate = new Date(workout.performedDate);
    return workoutDate >= startOfWeek;
  });
  
  return {
    workoutCount: thisWeekWorkouts.length,
    completionRate: Math.min(Math.round((thisWeekWorkouts.length / 5) * 100), 100) // Assuming 5 workouts per week goal
  };
});

const progressTrend = computed(() => {
  if (workoutsByWeek.value.length < 2) return 0;
  
  const lastWeek = workoutsByWeek.value[workoutsByWeek.value.length - 1].count;
  const previousWeek = workoutsByWeek.value[workoutsByWeek.value.length - 2].count;
  
  if (previousWeek === 0) return lastWeek > 0 ? 100 : 0;
  
  return Math.round(((lastWeek - previousWeek) / previousWeek) * 100);
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'No date';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

const getWorkoutName = (workout) => {
  if (!workout) return 'Workout';
  if (workout.exercise && workout.exercise.name) return workout.exercise.name;
  if (workout.exerciseName) return workout.exerciseName;
  return 'Workout';
};

const getWeekRange = (dateString) => {
  const date = new Date(dateString);
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(start.getDate() + 6);
  
  return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`;
};

const viewWorkoutDetails = (workout) => {
  // Implement view workout details functionality
  console.log('View workout details:', workout);
};

const viewAllWorkouts = () => {
  router.push({ name: 'workout-history' });
};

const goBack = () => {
  router.push({ name: 'athlete-dashboard' });
};

const getProgressColor = (progress) => {
  if (progress < 30) return 'error';
  if (progress < 70) return 'warning';
  return 'success';
};

const confirmRemovePlan = async () => {
  if (!isAdminView.value || !athleteId.value || !activePlanProgress.value?.plan?.id) return;
  
  const confirmed = confirm('Are you sure you want to remove this plan from the athlete? This action cannot be undone.');
  
  if (confirmed) {
    try {
      await AdminServices.removeAthletePlan(athleteId.value, activePlanProgress.value.plan.id);
      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error removing plan:', error);
      alert('Failed to remove plan. Please try again.');
    }
  }
};

const fetchData = async () => {
  try {
    const targetUserId = isAdminView.value ? athleteId.value : user.value.id;
    
    // Fetch all necessary data in parallel
    const [progressResponse, goalsResponse, weeklyStatsResponse] = await Promise.all([
      isAdminView.value 
        ? AdminServices.getAthleteProgress(targetUserId)
        : AthleteServices.getAthleteProgress(targetUserId),
      isAdminView.value 
        ? AdminServices.getAthleteGoals(targetUserId)
        : AthleteServices.getAthleteGoals(targetUserId),
      isAdminView.value 
        ? AdminServices.getWeeklyStats(targetUserId)
        : AthleteServices.getWeeklyStats(targetUserId)
    ]);
    
    // Update the component state with the fetched data
    workoutHistory.value = progressResponse.data.workoutHistory || [];
    activeGoals.value = goalsResponse.data.activeGoals || [];
    completedGoals.value = goalsResponse.data.completedGoals || [];
    activePlanProgress.value = progressResponse.data.activePlanProgress || null;
    workoutsByWeek.value = weeklyStatsResponse.data.workoutsByWeek || [];
    maxWorkoutsPerWeek.value = Math.max(...weeklyStatsResponse.data.workoutsByWeek.map(w => w.count), 5);
    
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Lifecycle hooks
onMounted(async () => {
  user.value = Utils.getStore("user");
  
  // Check if this is an admin view
  if (route.params.athleteId) {
    isAdminView.value = true;
    athleteId.value = route.params.athleteId;
    
    // If admin is viewing another athlete's progress
    if (user.value.role !== 'admin') {
      router.push({ name: 'unauthorized' });
      return;
    }
  } else if (user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }
  
  try {
    loading.value = true;
    await fetchData();
    
    // Get the target user ID based on the view
    const targetUserId = isAdminView.value ? athleteId.value : user.value.id;
    
    // Fetch assigned plans
    const plansResponse = isAdminView.value 
      ? await AdminServices.getAssignedPlans(targetUserId)
      : await AthleteServices.getAssignedPlans(targetUserId);
      
    const activePlan = (plansResponse.data || []).find(plan => plan.status === 'active');
    
    if (activePlan) {
      const startDate = new Date(activePlan.startDate);
      const endDate = new Date(activePlan.endDate);
      const today = new Date();
      
      // Calculate plan progress
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const daysPassed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const daysRemaining = Math.max(0, totalDays - daysPassed);
      const progress = Math.min(Math.round((daysPassed / totalDays) * 100), 100);
      
      activePlanProgress.value = {
        plan: activePlan,
        totalDays,
        daysPassed: Math.min(daysPassed, totalDays),
        daysRemaining,
        progress
      };
    }
    
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.border-left {
  border-left: 4px solid;
}

.chart-bar {
  position: relative;
  transition: height 0.5s ease;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-value {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.v-progress-circular {
  transition: all 0.5s ease;
}

.v-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}
</style>
