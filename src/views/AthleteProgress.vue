<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const workoutHistory = ref([]);
const activeGoals = ref([]);
const completedGoals = ref([]);
const assignedPlans = ref([]);
const loading = ref(true);

// Computed properties
const recentWorkouts = computed(() => {
  return workoutHistory.value
    .sort((a, b) => new Date(b.performedDate) - new Date(a.performedDate))
    .slice(0, 10);
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
  if (!dateString) return '';
  const options = { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  };
  return new Date(dateString).toLocaleString('en-US', options);
};

const getWeekRange = (dateString) => {
  const date = new Date(dateString);
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(start.getDate() + 6);
  
  return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - 
          ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`;
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
  if (progress >= 100) return 'success';
  if (progress >= 67) return 'success';
  if (progress >= 34) return 'warning';
  return 'error';
};

// Lifecycle hooks
onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    loading.value = true;
    const [historyResponse, goalsResponse, plansResponse] = await Promise.all([
      AthleteServices.getWorkoutHistory(),
      AthleteServices.getAthleteGoals(),
      AthleteServices.getAssignedPlans()
    ]);
    
    if (historyResponse.data && historyResponse.data.data) {
      workoutHistory.value = historyResponse.data.data;
    }
    
    if (goalsResponse.data && goalsResponse.data.data) {
      const allGoals = goalsResponse.data.data;
      activeGoals.value = allGoals.filter(goal => goal.progress < 100);
      completedGoals.value = allGoals.filter(goal => goal.progress >= 100);
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

// Calculate workout frequency for the chart
const workoutsByWeek = computed(() => {
  const weeks = {};
  const now = new Date();
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(now.getDate() - 56); // 8 weeks ago

  // Initialize all weeks with 0 workouts
  for (let i = 0; i < 8; i++) {
    const date = new Date(eightWeeksAgo);
    date.setDate(date.getDate() + (i * 7));
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    weeks[weekKey] = {
      count: 0,
      weekStart: new Date(weekStart)
    };
  }

  // Count workouts per week
  workoutHistory.value.forEach(workout => {
    const date = new Date(workout.performedDate);
    if (date < eightWeeksAgo) return;
    
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (weeks[weekKey] !== undefined) {
      weeks[weekKey].count += 1;
    }
  });

  // Convert to array and format for display
  return Object.entries(weeks).map(([week, data]) => ({
    week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekStart: data.weekStart,
    count: data.count
  }));
});

const maxWorkoutsPerWeek = computed(() => {
  return Math.max(5, ...workoutsByWeek.value.map(w => w.count)); // Minimum 5 for better visualization
});

// Calculate plan progress
const activePlanProgress = computed(() => {
  const activePlan = assignedPlans.value.find(plan => {
    if (!plan.startDate) return false;
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
      <!-- Progress Overview Cards -->
      <v-row class="mt-4">
        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon left color="#800020">mdi-calendar-check</v-icon>
              This Week
            </v-card-title>
            <v-card-text class="text-center">
              <div class="text-h4 mb-2" style="color: #800020">{{ weeklyStats.workoutCount }}</div>
              <div class="text-caption">Workouts Completed</div>
              <v-progress-linear
                :model-value="weeklyStats.completionRate"
                color="#800020"
                height="8"
                class="mt-2"
                rounded
              ></v-progress-linear>
              <div class="text-caption mt-1">{{ weeklyStats.completionRate }}% of weekly goal</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon left color="#800020">mdi-trending-up</v-icon>
              Progress Trend
            </v-card-title>
            <v-card-text class="text-center">
              <v-icon
                :color="progressTrend >= 0 ? 'success' : 'error'"
                size="40"
              >
                mdi-{{ progressTrend >= 0 ? 'trending-up' : 'trending-down' }}
              </v-icon>
              <div class="text-h5 mt-2" :class="progressTrend >= 0 ? 'success--text' : 'error--text'">
                {{ Math.abs(progressTrend) }}%
              </div>
              <div class="text-caption">
                {{ progressTrend >= 0 ? 'Increase' : 'Decrease' }} from last week
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="h-100" elevation="2">
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon left color="#800020">mdi-medal</v-icon>
              Goals
            </v-card-title>
            <v-card-text class="text-center">
              <div class="text-h4 mb-2" style="color: #800020">
                {{ completedGoalsCount }}/{{ activeGoals.length }}
              </div>
              <div class="text-caption">Goals Completed</div>
              <v-progress-circular
                :model-value="goalsCompletionRate"
                :size="80"
                :width="8"
                color="#800020"
                class="mt-2"
              >
                {{ goalsCompletionRate }}%
              </v-progress-circular>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Training Plan Progress -->
      <v-row v-if="activePlanProgress" class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h5 d-flex align-center">
              <v-icon left color="#800020">mdi-clipboard-check</v-icon>
              Training Plan Progress
              <v-chip color="#800020" text-color="white" small class="ml-2">
                Week {{ Math.ceil(activePlanProgress.daysPassed / 7) }} of {{ Math.ceil(activePlanProgress.totalDays / 7) }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="8">
                  <div class="d-flex align-center mb-3">
                    <div class="text-h6">{{ activePlanProgress.plan?.name || 'Training Plan' }}</div>
                    <v-chip
                      v-if="activePlanProgress.progress >= 100"
                      color="success"
                      text-color="white"
                      small
                      class="ml-2"
                    >
                      <v-icon small left>mdi-check</v-icon>
                      Completed
                    </v-chip>
                  </div>
                  <p class="text-body-2 mb-4">{{ activePlanProgress.plan?.description }}</p>
                  
                  <v-progress-linear
                    :model-value="activePlanProgress.progress"
                    :color="getProgressColor(activePlanProgress.progress)"
                    height="30"
                    rounded
                    class="mb-3"
                  >
                    <strong class="text-white">{{ activePlanProgress.progress }}% Complete</strong>
                  </v-progress-linear>
                  
                  <v-row class="text-center">
                    <v-col cols="4">
                      <div class="text-h5" style="color: #800020">
                        {{ Math.ceil(activePlanProgress.daysPassed / 7) }}
                      </div>
                      <div class="text-caption">Weeks Completed</div>
                    </v-col>
                    <v-col cols="4">
                      <div class="text-h5" style="color: #800020">
                        {{ Math.ceil(activePlanProgress.totalDays / 7) }}
                      </div>
                      <div class="text-caption">Total Weeks</div>
                    </v-col>
                    <v-col cols="4">
                      <div class="text-h5" style="color: #800020">
                        {{ Math.ceil(activePlanProgress.daysRemaining / 7) }}
                      </div>
                      <div class="text-caption">Weeks Remaining</div>
                    </v-col>
                  </v-row>
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center">
                  <div class="text-center w-100">
                    <v-progress-circular
                      :size="150"
                      :width="15"
                      :model-value="activePlanProgress.progress"
                      :color="getProgressColor(activePlanProgress.progress)"
                      class="mb-3"
                    >
                      <div class="text-center">
                        <div class="text-h5">{{ activePlanProgress.progress }}%</div>
                        <div class="text-caption">Complete</div>
                      </div>
                    </v-progress-circular>
                    <div class="text-caption">
                      Started: {{ formatDate(activePlanProgress.startDate) }}
                    </div>
                    <div class="text-caption" v-if="activePlanProgress.endDate">
                      Target: {{ formatDate(activePlanProgress.endDate) }}
                    </div>
                  </div>
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
              Workout Frequency
              <v-chip color="#800020" text-color="white" small class="ml-2">
                Last 8 Weeks
              </v-chip>
            </v-card-title>
            <v-card-text>
              <div v-if="workoutsByWeek.length > 0" class="pa-4">
                <div class="d-flex align-end" style="height: 250px; gap: 12px;">
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
                        background: 'linear-gradient(to top, #800020, #a00030)',
                        borderRadius: '8px 8px 0 0',
                        position: 'relative',
                        transition: 'height 0.5s ease'
                      }"
                      class="chart-bar"
                    >
                      <div class="chart-value">{{ week.count }}</div>
                    </div>
                    <div
                      class="text-center text-caption mt-2"
                      style="min-height: 40px;"
                    >
                      {{ week.week }}
                      <div class="text-caption text-grey">
                        {{ getWeekRange(week.weekStart) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-space-between mt-2 px-2">
                  <div class="text-caption">Weeks Ago</div>
                  <div class="text-caption">This Week</div>
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

      <!-- Goals Progress -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card class="h-100" elevation="2">
            <v-card-title class="text-h5 d-flex align-center">
              <v-icon left color="#800020">mdi-bullseye-arrow</v-icon>
              Active Goals
              <v-chip color="#800020" text-color="white" small class="ml-2">
                {{ activeGoals.length }} Total
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <div v-else-if="activeGoals.length > 0">
                <v-card
                  v-for="goal in activeGoals"
                  :key="goal.id"
                  class="mb-3"
                  elevation="1"
                  :border="true"
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
                      <v-chip
                        v-else
                        size="small"
                        :color="getProgressColor(goal.progress)"
                        variant="outlined"
                      >
                        {{ Math.round(goal.progress) }}%
                      </v-chip>
                    </div>
                    
                    <v-progress-linear
                      :model-value="goal.progress"
                      :color="goal.progress >= 100 ? 'success' : getProgressColor(goal.progress)"
                      height="12"
                      rounded
                      class="mb-2"
                    ></v-progress-linear>
                    
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-caption">
                        <v-icon size="small" color="#800020">mdi-calendar-clock</v-icon>
                        {{ formatDate(goal.deadline) }}
                      </span>
                      <span v-if="goal.targetValue" class="text-caption font-weight-medium">
                        {{ goal.currentValue || 0 }} / {{ goal.targetValue }} {{ goal.unit || '' }}
                        <v-tooltip bottom>
                          <template v-slot:activator="{ props }">
                            <v-icon
                              v-bind="props"
                              size="small"
                              color="grey"
                              class="ml-1"
                            >mdi-information</v-icon>
                          </template>
                          <span>Progress: {{ goal.progress }}%</span>
                        </v-tooltip>
                      </span>
                    </div>
                    
                    <v-expand-transition>
                      <div v-if="goal.notes" class="mt-2">
                        <v-divider class="my-2"></v-divider>
                        <div class="text-caption text-grey">
                          <v-icon size="small" left>mdi-note-text</v-icon>
                          {{ goal.notes }}
                        </div>
                      </div>
                    </v-expand-transition>
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

        <v-col cols="12" md="6">
          <v-card class="h-100" elevation="2">
            <v-card-title class="text-h5 d-flex align-center">
              <v-icon left color="#800020">mdi-trophy</v-icon>
              Achievements
              <v-chip color="#800020" text-color="white" small class="ml-2">
                {{ completedGoals.length }} Completed
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <div v-else-if="completedGoals.length > 0">
                <v-card
                  v-for="goal in completedGoals"
                  :key="'completed-' + goal.id"
                  class="mb-3"
                  variant="outlined"
                >
                  <v-card-text>
                    <div class="d-flex align-center">
                      <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                      <div>
                        <div class="font-weight-medium">{{ goal.name }}</div>
                        <div class="text-caption text-grey">
                          Completed on {{ formatDate(goal.completedDate) }}
                        </div>
                      </div>
                    </div>
                    <div v-if="goal.targetValue" class="mt-2 text-caption">
                      Achieved: {{ goal.targetValue }} {{ goal.unit || '' }}
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <v-alert v-else color="grey-lighten-3" variant="flat">
                <v-icon color="#800020">mdi-information</v-icon>
                No achievements yet. Keep working on your goals!
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Workouts -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h5 d-flex align-center">
              <v-icon left color="#800020">mdi-history</v-icon>
              Recent Workouts
              <v-chip color="#800020" text-color="white" small class="ml-2">
                Last 10 Workouts
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-list v-else-if="workoutHistory.length > 0" class="py-0">
                <v-list-item
                  v-for="workout in recentWorkouts"
                  :key="workout.id"
                  class="mb-2"
                  :class="{'border-left': true, 'border-success': workout.completed, 'border-warning': !workout.completed}"
                  style="border-left-width: 4px !important;"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="workout.completed ? 'success' : 'warning'" size="40">
                      <v-icon color="white">{{ workout.completed ? 'mdi-check' : 'mdi-clock' }}</v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title class="font-weight-bold">
                    {{ workout.exercise?.name || 'Exercise' }}
                    <v-chip
                      v-if="workout.workoutPlanName"
                      size="x-small"
                      color="#800020"
                      text-color="white"
                      class="ml-2"
                    >
                      {{ workout.workoutPlanName }}
                    </v-chip>
                  </v-list-item-title>
                  
                  <v-list-item-subtitle>
                    <div class="d-flex align-center flex-wrap">
                      <span class="mr-2">
                        <v-icon size="small" left>mdi-calendar</v-icon>
                        {{ formatDateTime(workout.performedDate) }}
                      </span>
                      <span class="mr-2">
                        <v-icon size="small" left>mdi-repeat</v-icon>
                        {{ workout.sets }}×{{ workout.reps }}
                      </span>
                      <span v-if="workout.weight" class="mr-2">
                        <v-icon size="small" left>mdi-weight</v-icon>
                        {{ workout.weight }} lbs
                      </span>
                      <span v-if="workout.duration">
                        <v-icon size="small" left>mdi-timer</v-icon>
                        {{ workout.duration }} min
                      </span>
                    </div>
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="viewWorkoutDetails(workout)"
                    >
                      <v-icon>mdi-chevron-right</v-icon>
                    </v-btn>
                  </template>
                  
                  <v-expand-transition>
                    <div v-if="workout.notes" class="w-100 mt-2">
                      <v-divider class="mb-2"></v-divider>
                      <div class="text-caption text-grey">
                        <v-icon size="small" left>mdi-note-text</v-icon>
                        {{ workout.notes }}
                      </div>
                    </div>
                  </v-expand-transition>
                </v-list-item>
                
                <v-list-item v-if="workoutHistory.length > 10" class="text-center">
                  <v-btn
                    variant="text"
                    color="#800020"
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