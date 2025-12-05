<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const assignedPlans = ref([]);
const workoutHistory = ref([]);
const loading = ref(true);
const currentMonth = ref(new Date());
const selectedDate = ref(null);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    const [plansResponse, historyResponse] = await Promise.all([
      AthleteServices.getAssignedPlans(),
      AthleteServices.getWorkoutHistory()
    ]);
    
    if (plansResponse.data && plansResponse.data.data) {
      assignedPlans.value = plansResponse.data.data;
    }
    if (historyResponse.data && historyResponse.data.data) {
      workoutHistory.value = historyResponse.data.data;
    }
  } catch (err) {
    console.error('Error fetching schedule data:', err);
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.push({ name: 'athlete-dashboard' });
};

// Calendar navigation
const previousMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1);
};

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1);
};

const goToToday = () => {
  currentMonth.value = new Date();
};

// Calendar data
const monthName = computed(() => {
  return currentMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Previous month's days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    });
  }
  
  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      isCurrentMonth: true
    });
  }
  
  // Next month's days to fill the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false
    });
  }
  
  return days;
});

const getWorkoutsForDate = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  return workoutHistory.value.filter(workout => {
    const workoutDate = new Date(workout.performedDate).toISOString().split('T')[0];
    return workoutDate === dateStr;
  });
};

const hasActivePlanOnDate = (date) => {
  return assignedPlans.value.some(plan => {
    const start = new Date(plan.startDate);
    const end = plan.endDate ? new Date(plan.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= start && checkDate <= end;
  });
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const selectDate = (day) => {
  if (day.isCurrentMonth) {
    selectedDate.value = day.date;
  }
};

const selectedDateWorkouts = computed(() => {
  if (!selectedDate.value) return [];
  return getWorkoutsForDate(selectedDate.value);
});

const selectedDateScheduledExercises = computed(() => {
  if (!selectedDate.value) return [];
  return getScheduledExercisesForDate(selectedDate.value);
});

const getScheduledExercisesForDate = (date) => {
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Monday, 7=Sunday
  
  const scheduledExercises = [];
  
  assignedPlans.value.forEach(plan => {
    const start = new Date(plan.startDate);
    const end = plan.endDate ? new Date(plan.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check if date is within plan range
    if (checkDate >= start && checkDate <= end) {
      if (plan.plan && plan.plan.planExercises) {
        const dayExercises = plan.plan.planExercises.filter(pe => pe.dayOfWeek === adjustedDayOfWeek);
        dayExercises.forEach(pe => {
          scheduledExercises.push({
            planName: plan.plan.name,
            exercise: pe.exercise,
            sets: pe.sets,
            reps: pe.reps,
            duration: pe.duration,
            order: pe.order || 0
          });
        });
      }
    }
  });
  
  return scheduledExercises.sort((a, b) => a.order - b.order);
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const getStatusColor = (plan) => {
  const now = new Date();
  const start = new Date(plan.startDate);
  const end = plan.endDate ? new Date(plan.endDate) : null;
  
  if (end && now > end) return 'grey';
  if (now >= start && (!end || now <= end)) return 'success';
  return 'info';
};

const getStatusText = (plan) => {
  const now = new Date();
  const start = new Date(plan.startDate);
  const end = plan.endDate ? new Date(plan.endDate) : null;
  
  if (end && now > end) return 'Completed';
  if (now >= start && (!end || now <= end)) return 'Active';
  return 'Upcoming';
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
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="d-flex align-center bg-grey-lighten-4">
              <v-btn icon variant="text" @click="previousMonth">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              <div class="flex-grow-1 text-center">
                <span class="text-h5">{{ monthName }}</span>
              </div>
              <v-btn icon variant="text" @click="nextMonth">
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
              <v-btn variant="outlined" size="small" color="#800020" class="ml-2" @click="goToToday">
                Today
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <div v-else>
                <!-- Calendar Grid -->
                <div class="calendar-grid">
                  <!-- Week day headers -->
                  <div class="calendar-header">
                    <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" 
                         :key="day" 
                         class="calendar-day-header">
                      {{ day }}
                    </div>
                  </div>
                  
                  <!-- Calendar days -->
                  <div class="calendar-body">
                    <div
                      v-for="(day, index) in calendarDays"
                      :key="index"
                      class="calendar-day"
                      :class="{
                        'calendar-day-other-month': !day.isCurrentMonth,
                        'calendar-day-today': isToday(day.date),
                        'calendar-day-has-workout': getWorkoutsForDate(day.date).length > 0,
                        'calendar-day-has-plan': hasActivePlanOnDate(day.date),
                        'calendar-day-selected': selectedDate && selectedDate.toDateString() === day.date.toDateString()
                      }"
                      @click="selectDate(day)"
                    >
                      <div class="calendar-day-number">
                        {{ day.date.getDate() }}
                      </div>
                      <div class="calendar-day-indicators">
                        <v-icon v-if="hasActivePlanOnDate(day.date)" size="x-small" color="#800020">mdi-calendar-check</v-icon>
                        <v-chip 
                          v-if="getWorkoutsForDate(day.date).length > 0"
                          size="x-small" 
                          color="success"
                          class="calendar-workout-badge"
                        >
                          {{ getWorkoutsForDate(day.date).length }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Legend -->
                <v-divider class="my-3"></v-divider>
                <div class="d-flex flex-wrap gap-3 justify-center">
                  <div class="d-flex align-center">
                    <div class="legend-box bg-success"></div>
                    <span class="text-caption ml-1">Completed Workout</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="small" color="#800020">mdi-calendar-check</v-icon>
                    <span class="text-caption ml-1">Active Training Plan</span>
                  </div>
                  <div class="d-flex align-center">
                    <div class="legend-box legend-today"></div>
                    <span class="text-caption ml-1">Today</span>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Selected Date Details -->
        <v-col cols="12" md="4">
          <v-card v-if="selectedDate" class="mb-4">
            <v-card-title class="bg-grey-lighten-4">
              <v-icon color="#800020" class="mr-2">mdi-calendar-today</v-icon>
              {{ formatDate(selectedDate) }}
            </v-card-title>
            <v-card-text>
              <!-- Scheduled Exercises -->
              <div v-if="selectedDateScheduledExercises.length > 0" class="mb-4">
                <h3 class="text-subtitle-1 mb-2 d-flex align-center">
                  <v-icon color="#800020" class="mr-2">mdi-calendar-check</v-icon>
                  Scheduled Exercises
                </h3>
                <v-list density="compact">
                  <v-list-item v-for="(item, index) in selectedDateScheduledExercises" :key="index" class="mb-1">
                    <template v-slot:prepend>
                      <v-icon color="#800020">mdi-dumbbell</v-icon>
                    </template>
                    <v-list-item-title>{{ item.exercise?.name || 'Exercise' }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
              <v-alert v-else-if="selectedDateScheduledExercises.length === 0" type="info" variant="tonal" class="mt-2">
                No exercises scheduled or completed for this date
              </v-alert>
              <v-alert v-else type="info" variant="tonal" class="mt-2">
                Scheduled exercises shown above. No workouts recorded yet.
              </v-alert>st-item>
                </v-list>
                <v-divider class="my-3"></v-divider>
              </div>
              
              <!-- Completed Workouts -->
              <div v-if="selectedDateWorkouts.length > 0">
                <h3 class="text-subtitle-1 mb-2">Completed Workouts</h3>
                <v-list density="compact">
                  <v-list-item v-for="workout in selectedDateWorkouts" :key="workout.id">
                    <template v-slot:prepend>
                      <v-icon color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title>{{ workout.exercise?.name || 'Exercise' }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ workout.sets }} sets × {{ workout.reps }} reps
                      <span v-if="workout.weight"> @ {{ workout.weight }} lbs</span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>
              <v-alert v-else type="info" variant="tonal" class="mt-2">
                No workouts recorded for this date
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- Active Plans Summary -->
          <v-card>
            <v-card-title class="text-h6 bg-grey-lighten-4">
              <v-icon color="#800020" class="mr-2">mdi-clipboard-text</v-icon>
              Active Plans
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <div v-else-if="assignedPlans.filter(p => getStatusText(p) === 'Active').length > 0">
                <v-card 
                  v-for="plan in assignedPlans.filter(p => getStatusText(p) === 'Active')" 
                  :key="plan.id"
                  variant="outlined"
                  class="mb-2"
                >
                  <v-card-text>
                    <div class="font-weight-bold">{{ plan.plan?.name }}</div>
                    <div class="text-caption text-grey-darken-1">
                      {{ new Date(plan.startDate).toLocaleDateString() }} - 
                      {{ plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Ongoing' }}
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <v-alert v-else color="grey-lighten-3" variant="flat" density="compact">
                No active training plans
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style scoped>
.calendar-grid {
  width: 100%;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.calendar-day-header {
  text-align: center;
  font-weight: bold;
  padding: 8px;
  color: #800020;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: white;
}

.calendar-day:hover {
  background-color: #f5f5f5;
  border-color: #800020;
}

.calendar-day-other-month {
  opacity: 0.3;
}

.calendar-day-today {
  background-color: #fff3e0;
  border: 2px solid #ff9800;
  font-weight: bold;
}

.calendar-day-has-workout {
  background-color: #e8f5e9;
}

.calendar-day-has-plan {
  border-left: 3px solid #800020;
}

.calendar-day-selected {
  background-color: #800020 !important;
  color: white;
  border-color: #800020;
}

.calendar-day-selected .calendar-day-number {
  color: white;
}

.calendar-day-number {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.calendar-day-indicators {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.calendar-workout-badge {
  height: 16px !important;
  min-width: 16px;
  padding: 0 4px !important;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.legend-today {
  background-color: #fff3e0;
  border: 2px solid #ff9800;
}
</style>