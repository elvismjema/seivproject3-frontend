<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import CoachServices from '../services/coachServices.js';

const router = useRouter();
const user = ref({});
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000
});

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout: 3000
  };
};
const activeTab = ref('overview');
const athletes = ref([]);
const customExercises = ref([]);
const activeGoals = ref(0);
const weeklyResults = ref(0);
const recentResults = ref([]);
const plans = ref([]);
const goals = ref([]);
const loading = ref(true);
const error = ref(null);
const dialog = ref({
  addAthlete: false,
  createPlan: false,
  setGoal: false,
  recordResult: false,
  assignPlan: false
});

const selectedAthleteForPlan = ref(null);

// Form data
const newAthleteEmail = ref('');
const newPlan = ref({
  name: '',
  description: '',
  exercises: [],
  durationWeeks: 4,
  days: [],
  isPublic: false
});

const daysOfWeek = [
  { title: 'Monday', value: 'Monday' },
  { title: 'Tuesday', value: 'Tuesday' },
  { title: 'Wednesday', value: 'Wednesday' },
  { title: 'Thursday', value: 'Thursday' },
  { title: 'Friday', value: 'Friday' },
  { title: 'Saturday', value: 'Saturday' },
  { title: 'Sunday', value: 'Sunday' }
];

const newGoal = ref({
  athleteId: '',
  exerciseId: '',
  targetDate: '',
  targetValue: '',
  targetUnit: 'reps' // must match backend enum
});

const workoutResult = ref({
  athleteId: '',
  exerciseId: '',
  date: new Date().toISOString().substr(0, 10),
  sets: 1,
  reps: 10,
  weight: 0,
  duration: null,
  notes: ''
});

// Available exercises for selection
const availableExercises = ref([]);
const availableAthletes = ref([]);

const isAddingAthlete = ref(false);
const isSavingPlan = ref(false);
const isSavingGoal = ref(false);
const isSavingResult = ref(false);

const addAthleteForm = ref(null);

const fetchCoachData = async () => {
  if (!user.value || user.value.role !== 'coach') return;
  
  try {
    loading.value = true;
    const [
      athletesResponse,
      resultsResponse,
      exercisesResponse,
      goalsCountResponse,
      weeklyResultsResponse,
      athletesListResponse,
      exercisesListResponse,
      plansResponse,
      goalsResponse
    ] = await Promise.all([
      CoachServices.getCoachAthletes(),
      CoachServices.getCoachRecentResults(),
      CoachServices.getExercises(),
      CoachServices.getActiveGoalsCount(),
      CoachServices.getWeeklyResultsCount(),
      CoachServices.getCoachAthletes(),
      CoachServices.getExercises(), // Load exercises for the plan creation form
      CoachServices.getCoachPlans(),
      CoachServices.getCoachGoals()
    ]);
    
    // Store available exercises for the plan creation form
    if (exercisesListResponse?.data?.data) {
      availableExercises.value = exercisesListResponse.data.data.map(ex => ({
        title: ex.name,
        value: ex.id,
        ...ex
      }));
    }

    if (athletesListResponse.data && athletesListResponse.data.data) {
      availableAthletes.value = athletesListResponse.data.data;
    }

    if (athletesResponse.data && athletesResponse.data.data) {
      athletes.value = athletesResponse.data.data;
    }
    if (resultsResponse.data && resultsResponse.data.data) {
      recentResults.value = resultsResponse.data.data;
    }
    if (exercisesResponse.data && exercisesResponse.data.data) {
      customExercises.value = exercisesResponse.data.data;
    }
    if (goalsCountResponse.data && goalsCountResponse.data.count !== undefined) {
      activeGoals.value = goalsCountResponse.data.count;
    }
    if (weeklyResultsResponse.data && weeklyResultsResponse.data.count !== undefined) {
      weeklyResults.value = weeklyResultsResponse.data.count;
    }
    if (plansResponse.data && plansResponse.data.data) {
      plans.value = plansResponse.data.data;
    }
    if (goalsResponse.data && goalsResponse.data.data) {
      goals.value = goalsResponse.data.data;
    }
  } catch (err) {
    console.error('Error fetching coach data:', err);
    error.value = err.message;
    showSnackbar('Error loading coach data. Please try again.', 'error');
  } finally {
    loading.value = false;
  }
};

const addAthlete = async () => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!newAthleteEmail.value || !emailRegex.test(newAthleteEmail.value)) {
    showSnackbar('Please enter a valid email address', 'warning');
    return;
  }

  try {
    isAddingAthlete.value = true;
    // Show loading state
    showSnackbar('Adding athlete...', 'info');
    
    // Call the API to add athlete
    await CoachServices.addAthlete({ athleteEmail: newAthleteEmail.value });
    
    // Show success message
    showSnackbar('Athlete added successfully!', 'success');
    
    // Reset form and close dialog
    closeAddAthleteDialog();
    
    // Refresh the athlete list
    await fetchCoachData();
  } catch (error) {
    console.error('Error adding athlete:', error);
    const errorMessage = error.response?.data?.message || 'Failed to add athlete';
    showSnackbar(`Error: ${errorMessage}`, 'error');
  } finally {
    isAddingAthlete.value = false;
  }
};

const closeAddAthleteDialog = () => {
  dialog.value.addAthlete = false;
  newAthleteEmail.value = '';
  if (addAthleteForm.value) {
    addAthleteForm.value.resetValidation();
  }
};

const savePlan = async () => {
  // Basic validation
  if (!newPlan.value.name?.trim()) {
    showSnackbar('Please enter a plan name', 'warning');
    return;
  }
  
  if (newPlan.value.exercises.length === 0) {
    showSnackbar('Please select at least one exercise', 'warning');
    return;
  }
  
  if (newPlan.value.durationWeeks < 1 || newPlan.value.durationWeeks > 12) {
    showSnackbar('Duration must be between 1 and 12 weeks', 'warning');
    return;
  }

  try {
    isSavingPlan.value = true;
    showSnackbar('Saving plan...', 'info');
    
    // Prepare plan data
    const planData = {
      name: newPlan.value.name.trim(),
      description: newPlan.value.description.trim(),
      duration: newPlan.value.durationWeeks,
      dayCheck: newPlan.value.days.join(','),
      exercises: newPlan.value.exercises.map(exerciseId => ({
        exerciseId: exerciseId,
        dayOfWeek: 1, // Default to Monday, you can enhance this to let coaches select
        sets: 3,
        reps: 10,
        duration: null,
        restTime: 60
      })),
      isPublic: newPlan.value.isPublic
    };
    
    console.log('Sending plan data to backend:', planData);
    
    // Call the API to create the plan
    const response = await CoachServices.createPlan(planData);
    console.log('Plan created successfully:', response);
    
    // Show success message
    showSnackbar('Training plan created successfully!', 'success');
    
    // Reset form and close dialog
    dialog.value.createPlan = false;
    newPlan.value = {
      name: '',
      description: '',
      exercises: [],
      durationWeeks: 4,
      days: [],
      isPublic: false
    };
    
    // Refresh any relevant data
    await fetchCoachData();
  } catch (error) {
    console.error('Error saving plan:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    console.error('Error message:', error.message);
    const errorMessage = error.response?.data?.message || 'Failed to create plan';
    showSnackbar(`Error: ${errorMessage}`, 'error');
  } finally {
    isSavingPlan.value = false;
  }
};

const navigateTo = (routeName, params = {}) => {
  router.push({ name: routeName, params });
};

const openSetGoalDialog = () => {
  if (availableAthletes.value.length === 0) {
    showSnackbar('No athletes available. Please add an athlete first.', 'warning');
    return;
  }
  dialog.value.setGoal = true;
};

const openRecordResultDialog = () => {
  if (availableAthletes.value.length === 0) {
    showSnackbar('No athletes available. Please add an athlete first.', 'warning');
    return;
  }
  dialog.value.recordResult = true;
};

const viewAthleteProgress = (athleteId) => {
  router.push({ 
    name: 'coach-athlete-progress',
    params: { id: athleteId }
  });
};

const assignPlanToAthlete = (athlete) => {
  if (plans.value.length === 0) {
    showSnackbar('No plans available. Please create a plan first.', 'warning');
    return;
  }
  selectedAthleteForPlan.value = athlete;
  dialog.value.assignPlan = true;
};

const confirmAssignPlan = async (planId) => {
  try {
    await CoachServices.assignPlan({
      planId: planId,
      athleteId: selectedAthleteForPlan.value.id,
      startDate: new Date().toISOString().split('T')[0]
    });
    
    showSnackbar('Plan assigned successfully', 'success');
    dialog.value.assignPlan = false;
    selectedAthleteForPlan.value = null;
    await fetchCoachData();
  } catch (error) {
    console.error('Error assigning plan:', error);
    const errorMessage = error.response?.data?.message || 'Failed to assign plan';
    showSnackbar(errorMessage, 'error');
  }
};

const unassignPlan = async (athleteId, planName, planId) => {
  if (!confirm(`Remove plan "${planName}" from this athlete?`)) return;
  
  try {
    if (!planId) {
      showSnackbar('Plan ID not found', 'error');
      return;
    }
    
    await CoachServices.unassignPlan({
      athleteId: athleteId,
      planId: planId
    });
    
    showSnackbar('Plan removed successfully', 'success');
    await fetchCoachData();
  } catch (error) {
    console.error('Error removing plan:', error);
    const errorMessage = error.response?.data?.message || 'Failed to remove plan';
    showSnackbar(errorMessage, 'error');
  }
};

const removeAthlete = async (athleteId, athleteName) => {
  if (!confirm(`Are you sure you want to remove ${athleteName}?`)) return;
  
  try {
    await CoachServices.removeAthlete(athleteId);
    showSnackbar('Athlete removed successfully', 'success');
    await fetchCoachData();
  } catch (error) {
    console.error('Error removing athlete:', error);
    showSnackbar('Failed to remove athlete', 'error');
  }
};

const saveGoal = async () => {
  // Validation
  if (!newGoal.value.athleteId) {
    showSnackbar('Please select an athlete', 'warning');
    return;
  }
  if (!newGoal.value.exerciseId) {
    showSnackbar('Please select an exercise', 'warning');
    return;
  }
  if (!newGoal.value.targetValue || newGoal.value.targetValue <= 0) {
    showSnackbar('Please enter a valid target value', 'warning');
    return;
  }
  if (!newGoal.value.targetDate) {
    showSnackbar('Please select a target date', 'warning');
    return;
  }

  try {
    isSavingGoal.value = true;
    showSnackbar('Setting goal...', 'info');
    
    // Prepare goal data according to backend expectations
    const goalData = {
      athleteId: newGoal.value.athleteId,
      exerciseId: newGoal.value.exerciseId,
      targetValue: parseFloat(newGoal.value.targetValue),
      targetUnit: newGoal.value.targetUnit,
      targetDate: newGoal.value.targetDate
    };
    
    console.log('Sending goal data:', goalData);
    
    // Call the API
    await CoachServices.createGoal(goalData);
    
    showSnackbar('Goal set successfully!', 'success');
    
    // Reset form and close dialog
    dialog.value.setGoal = false;
    newGoal.value = {
      athleteId: '',
      exerciseId: '',
      targetDate: '',
      targetValue: '',
      targetUnit: 'reps'
    };
    
    // Refresh data
    await fetchCoachData();
  } catch (error) {
    console.error('Error setting goal:', error);
    const errorMessage = error.response?.data?.message || 'Failed to set goal';
    showSnackbar(`Error: ${errorMessage}`, 'error');
  } finally {
    isSavingGoal.value = false;
  }
};

const saveWorkoutResult = async () => {
  // Validation
  if (!workoutResult.value.athleteId) {
    showSnackbar('Please select an athlete', 'warning');
    return;
  }
  if (!workoutResult.value.exerciseId) {
    showSnackbar('Please select an exercise', 'warning');
    return;
  }
  if (!workoutResult.value.date) {
    showSnackbar('Please select a date', 'warning');
    return;
  }
  if (!workoutResult.value.sets || workoutResult.value.sets < 1) {
    showSnackbar('Please enter valid number of sets', 'warning');
    return;
  }
  if (!workoutResult.value.reps || workoutResult.value.reps < 1) {
    showSnackbar('Please enter valid number of reps', 'warning');
    return;
  }

  try {
    isSavingResult.value = true;
    showSnackbar('Recording result...', 'info');
    
    // Prepare result data
    const resultData = {
      athleteId: workoutResult.value.athleteId,
      exerciseId: workoutResult.value.exerciseId,
      performedDate: workoutResult.value.date,
      sets: parseInt(workoutResult.value.sets),
      reps: parseInt(workoutResult.value.reps),
      weight: parseFloat(workoutResult.value.weight) || 0,
      duration: workoutResult.value.duration ? parseInt(workoutResult.value.duration) : null,
      notes: workoutResult.value.notes || ''
    };
    
    console.log('Sending workout result:', resultData);
    
    // Call the API
    await CoachServices.recordWorkoutResult(resultData);
    
    showSnackbar('Workout result recorded successfully!', 'success');
    
    // Reset form and close dialog
    dialog.value.recordResult = false;
    workoutResult.value = {
      athleteId: '',
      exerciseId: '',
      date: new Date().toISOString().substr(0, 10),
      sets: 1,
      reps: 10,
      weight: 0,
      duration: null,
      notes: ''
    };
    
    // Refresh data
    await fetchCoachData();
  } catch (error) {
    console.error('Error recording result:', error);
    const errorMessage = error.response?.data?.message || 'Failed to record result';
    showSnackbar(`Error: ${errorMessage}`, 'error');
  } finally {
    isSavingResult.value = false;
  }
};

const handleTabChange = (tab) => {
  activeTab.value = tab;
  // Navigate to specific pages for certain tabs
  if (tab === 'plans') {
    router.push({ name: 'manage-plans' });
  } else if (tab === 'exercises') {
    router.push({ name: 'exercise-management' });
  }
};

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'coach') {
    router.push({ name: 'login' });
    return;
  }
  
  await fetchCoachData();
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
        <strong>OC</strong> Exercise Tracker - Coach
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Coach)
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
    <v-row class="mt-5">
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Welcome Coach {{ user.fName }}!</h1>
        <v-tabs
          v-model="activeTab"
          color="#800020"
          align-tabs="start"
          class="mb-6"
          @update:modelValue="handleTabChange"
        >
          <v-tab value="overview">Overview</v-tab>
          <v-tab value="athletes">Athletes</v-tab>
          <v-tab value="exercises">Exercises</v-tab>
          <v-tab value="plans">Plans</v-tab>
          <v-tab value="goals">Goals</v-tab>
          <v-tab value="results">Results</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Overview Tab Content -->
    <div v-show="activeTab === 'overview'">
    <!-- Metrics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ athletes.length }}</div>
            <div class="text-subtitle-1">My Athletes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ customExercises.length }}</div>
            <div class="text-subtitle-1">Custom Exercises</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ activeGoals }}</div>
            <div class="text-subtitle-1">Active Goals</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ weeklyResults }}</div>
            <div class="text-subtitle-1">Results This Week</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>My Athletes</span>
            <v-spacer></v-spacer>
            <v-btn 
              color="#800020" 
              size="small" 
              variant="elevated" 
              class="text-white"
              @click="dialog.addAthlete = true"
              :loading="isAddingAthlete"
            >
              <v-icon left>mdi-plus</v-icon>
              Add Athlete
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list v-if="athletes.length > 0" class="py-0">
              <v-list-item 
                v-for="athlete in athletes" 
                :key="athlete.id"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-avatar color="grey-lighten-2" size="40">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ athlete.name || 'Unnamed Athlete' }}
                </v-list-item-title>
                <v-list-item-subtitle class="d-flex align-center">
                  <v-icon :color="athlete.currentPlan ? 'success' : 'grey'" size="small" class="mr-1">
                    {{ athlete.currentPlan ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                  {{ athlete.currentPlan || 'No plan assigned' }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn 
                    size="small" 
                    color="primary" 
                    variant="text"
                    @click="viewAthleteProgress(athlete.id)"
                    class="mr-2"
                  >
                    <v-icon left size="small">mdi-chart-line</v-icon>
                    Progress
                  </v-btn>
                  <v-btn 
                    size="small" 
                    color="#800020" 
                    variant="outlined"
                    @click="assignPlanToAthlete(athlete)"
                    class="mr-2"
                  >
                    <v-icon left size="small">mdi-clipboard-list</v-icon>
                    Plan
                  </v-btn>
                  <v-btn 
                    icon 
                    size="small" 
                    color="error" 
                    variant="text"
                    @click="removeAthlete(athlete.id, athlete.name)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else color="grey-lighten-3" variant="flat">
              <v-icon color="#800020">mdi-information</v-icon>
              No athletes yet. Click "Add Athlete" to connect with athletes.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list class="py-0">
              <v-list-item class="px-0">
                <v-btn 
                  color="#800020" 
                  block 
                  class="mb-2 text-white" 
                  variant="elevated" 
                  @click="navigateTo('exercise-management')"
                >
                  <v-icon left>mdi-dumbbell</v-icon>
                  Manage Exercises
                </v-btn>
              </v-list-item>
              <v-list-item class="px-0">
                <v-btn 
                  color="#800020" 
                  block 
                  class="mb-2 text-white" 
                  variant="elevated" 
                  @click="navigateTo('manage-plans')"
                >
                  <v-icon left>mdi-clipboard-list</v-icon>
                  Manage Plans
                </v-btn>
              </v-list-item>
              <v-list-item class="px-0">
                <v-btn 
                  color="#800020" 
                  block 
                  class="mb-2 text-white" 
                  variant="elevated" 
                  @click="openSetGoalDialog()"
                >
                  <v-icon left>mdi-target</v-icon>
                  Set Goal
                </v-btn>
              </v-list-item>
              <v-list-item class="px-0">
                <v-btn 
                  color="#800020" 
                  block 
                  class="mb-2 text-white" 
                  variant="elevated"
                  @click="dialog.recordResult = true"
                >
                  <v-icon left>mdi-pencil</v-icon>
                  Record Result
                </v-btn>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-3">
      <v-col cols="12">
        <v-card>
          <v-card-title>Recent Athlete Results</v-card-title>
          <v-card-text>
            <v-table v-if="recentResults.length > 0">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Exercise</th>
                  <th>Performance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in recentResults" :key="result.id">
                  <td>{{ result.athleteName }}</td>
                  <td>{{ result.exercise }}</td>
                  <td>{{ result.performance }}</td>
                  <td>{{ result.date }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-alert v-else color="grey-lighten-3" variant="flat">
              <v-icon color="#800020">mdi-information</v-icon>
              No recent results to display.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </div>
    <!-- End Overview Tab -->

    <!-- Athletes Tab Content -->
    <div v-show="activeTab === 'athletes'">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>My Athletes</span>
              <v-spacer></v-spacer>
              <v-btn color="#800020" @click="dialog.addAthlete = true">Add Athlete</v-btn>
            </v-card-title>
            <v-card-text>
              <v-table v-if="athletes.length > 0">
                <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr v-for="athlete in athletes" :key="athlete.id">
                    <td>{{ athlete.name }}</td>
                    <td>{{ athlete.email }}</td>
                    <td>
                      {{ athlete.currentPlan || 'No plan' }}
                      <v-btn
                        v-if="athlete.currentPlan"
                        icon
                        size="x-small"
                        variant="text"
                        color="error"
                        @click="unassignPlan(athlete.id, athlete.currentPlan, athlete.currentPlanId)"
                        class="ml-2"
                      >
                        <v-icon size="small">mdi-close-circle</v-icon>
                      </v-btn>
                    </td>
                    <td>
                      <v-btn size="small" @click="viewAthleteProgress(athlete.id)">Progress</v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <v-alert v-else>No athletes yet</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Exercises Tab -->
    <div v-show="activeTab === 'exercises'">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Exercises</span>
              <v-spacer></v-spacer>
              <v-btn color="#800020" @click="navigateTo('exercise-management')">Manage Exercises</v-btn>
            </v-card-title>
            <v-card-text>
              <v-table v-if="customExercises.length > 0">
                <thead><tr><th>Name</th><th>Category</th><th>Description</th></tr></thead>
                <tbody>
                  <tr v-for="ex in customExercises" :key="ex.id">
                    <td>{{ ex.name }}</td>
                    <td>{{ ex.category }}</td>
                    <td>{{ ex.description || 'N/A' }}</td>
                  </tr>
                </tbody>
              </v-table>
              <v-alert v-else>No custom exercises</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Plans Tab -->
    <div v-show="activeTab === 'plans'">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Training Plans</span>
              <v-spacer></v-spacer>
              <v-btn color="#800020" @click="dialog.createPlan = true">Create Plan</v-btn>
            </v-card-title>
            <v-card-text>
              <v-row v-if="plans.length > 0">
                <v-col cols="12" md="6" v-for="plan in plans" :key="plan.id">
                  <v-card variant="outlined">
                    <v-card-title>{{ plan.name }}</v-card-title>
                    <v-card-text>
                      <p>{{ plan.description }}</p>
                      <p class="text-caption">Duration: {{ plan.duration }} weeks</p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <v-alert v-else>No plans yet</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Goals Tab -->
    <div v-show="activeTab === 'goals'">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Athlete Goals</span>
              <v-spacer></v-spacer>
              <v-btn color="#800020" @click="openSetGoalDialog()">Set Goal</v-btn>
            </v-card-title>
            <v-card-text>
              <v-table v-if="goals.length > 0">
                <thead><tr><th>Athlete</th><th>Exercise</th><th>Target</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  <tr v-for="goal in goals" :key="goal.id">
                    <td>{{ goal.athleteName }}</td>
                    <td>{{ goal.exerciseName }}</td>
                    <td>{{ goal.targetValue }} {{ goal.targetUnit }}</td>
                    <td>{{ new Date(goal.targetDate).toLocaleDateString() }}</td>
                    <td><v-chip :color="goal.status === 'active' ? 'success' : 'grey'" size="small">{{ goal.status }}</v-chip></td>
                  </tr>
                </tbody>
              </v-table>
              <v-alert v-else>No goals set yet</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Results Tab -->
    <div v-show="activeTab === 'results'">
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Workout Results</span>
              <v-spacer></v-spacer>
              <v-btn color="#800020" @click="dialog.recordResult = true">Record Result</v-btn>
            </v-card-title>
            <v-card-text>
              <v-table v-if="recentResults.length > 0">
                <thead><tr><th>Athlete</th><th>Exercise</th><th>Performance</th><th>Date</th></tr></thead>
                <tbody>
                  <tr v-for="result in recentResults" :key="result.id">
                    <td>{{ result.athleteName }}</td>
                    <td>{{ result.exercise }}</td>
                    <td>{{ result.performance }}</td>
                    <td>{{ result.date }}</td>
                  </tr>
                </tbody>
              </v-table>
              <v-alert v-else>No results yet</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    </v-container>
  </v-container>

  <!-- Add Athlete Dialog -->
  <v-dialog v-model="dialog.addAthlete" max-width="500px" @click:outside="closeAddAthleteDialog">
    <v-form @submit.prevent="addAthlete" ref="addAthleteForm">
      <v-card>
        <v-card-title>Add New Athlete</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.trim="newAthleteEmail"
            label="Athlete's Email"
            type="email"
            required
            :rules="[
              v => !!v || 'Email is required',
              v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email address'
            ]"
            autofocus
            @keyup.enter="addAthlete"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="closeAddAthleteDialog" :disabled="isAddingAthlete">
            Cancel
          </v-btn>
          <v-btn 
            color="#800020" 
            type="submit"
            :loading="isAddingAthlete"
            :disabled="!newAthleteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAthleteEmail)"
          >
            Add Athlete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>

  <!-- Create Plan Dialog -->
  <v-dialog v-model="dialog.createPlan" max-width="800px">
    <v-card>
      <v-card-title>Create New Training Plan</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="savePlan">
          <v-text-field
            v-model="newPlan.name"
            label="Plan Name"
            required
            class="mb-4"
          ></v-text-field>
          
          <v-textarea
            v-model="newPlan.description"
            label="Description"
            rows="2"
            class="mb-4"
          ></v-textarea>
          
          <v-select
            v-model="newPlan.exercises"
            :items="availableExercises"
            item-title="name"
            item-value="id"
            label="Select Exercises"
            multiple
            chips
            class="mb-4"
          ></v-select>
          
          <v-select
            v-model="newPlan.days"
            :items="daysOfWeek"
            item-title="title"
            item-value="value"
            label="Workout Days"
            multiple
            chips
            hint="Select the days athletes should follow this plan"
            persistent-hint
            class="mb-4"
          ></v-select>
          
          <v-slider
            v-model="newPlan.durationWeeks"
            label="Duration (weeks)"
            min="1"
            max="12"
            thumb-label
            class="mb-4"
          ></v-slider>
          
          <v-switch
            v-model="newPlan.isPublic"
            label="Make this plan available to other coaches"
            color="primary"
          ></v-switch>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="dialog.createPlan = false">Cancel</v-btn>
        <v-btn 
          color="#800020" 
          @click="savePlan"
          :loading="isSavingPlan"
        >
          Create Plan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Set Goal Dialog -->
  <v-dialog v-model="dialog.setGoal" max-width="800px">
    <v-card>
      <v-card-title>Set New Goal</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveGoal">
          <v-select
            v-model="newGoal.athleteId"
            :items="availableAthletes"
            item-title="name"
            item-value="id"
            label="Select Athlete"
            required
            class="mb-4"
          ></v-select>
          
          <v-select
            v-model="newGoal.exerciseId"
            :items="availableExercises"
            item-title="name"
            item-value="id"
            label="Select Exercise"
            required
            class="mb-4"
          ></v-select>
          
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="newGoal.targetValue"
                label="Target Value"
                type="number"
                required
                class="mb-4"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="newGoal.targetUnit"
                :items=" [
                  {title: 'Reps', value: 'reps'},
                  {title: 'Weight (lbs)', value: 'weight_lbs'},
                  {title: 'Weight (kg)', value: 'weight_kg'},
                  {title: 'Time (seconds)', value: 'time_seconds'},
                  {title: 'Distance (meters)', value: 'distance_meters'}
                ]"
                item-title="title"
                item-value="value"
                label="Unit"
                required
                class="mb-4"
              ></v-select>
            </v-col>
          </v-row>
          
          <v-text-field
            v-model="newGoal.targetDate"
            label="Target Date"
            type="date"
            :min="new Date().toISOString().substr(0, 10)"
            required
            class="mb-4"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="dialog.setGoal = false">Cancel</v-btn>
        <v-btn 
          color="#800020" 
          @click="saveGoal"
          :loading="isSavingGoal"
        >
          Set Goal
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Record Result Dialog -->
  <v-dialog v-model="dialog.recordResult" max-width="800px">
    <v-card>
      <v-card-title>Record Workout Result</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveWorkoutResult">
          <v-select
            v-model="workoutResult.athleteId"
            :items="availableAthletes"
            item-title="name"
            item-value="id"
            label="Athlete"
            required
            class="mb-4"
          ></v-select>
          
          <v-select
            v-model="workoutResult.exerciseId"
            :items="availableExercises"
            item-title="name"
            item-value="id"
            label="Exercise"
            required
            class="mb-4"
          ></v-select>
          
          <v-text-field
            v-model="workoutResult.date"
            label="Date"
            type="date"
            required
            class="mb-4"
          ></v-text-field>
          
          <v-row>
            <v-col cols="4">
              <v-text-field
                v-model.number="workoutResult.sets"
                label="Sets"
                type="number"
                min="1"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="workoutResult.reps"
                label="Reps"
                type="number"
                min="1"
                required
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="workoutResult.weight"
                label="Weight (lbs)"
                type="number"
                min="0"
                step="0.5"
                suffix="lbs"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model.number="workoutResult.duration"
                label="Time (seconds)"
                type="number"
                min="0"
                hint="Optional - for timed exercises like running, swimming, or batting practice"
                persistent-hint
                suffix="seconds"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-textarea
            v-model="workoutResult.notes"
            label="Notes"
            rows="2"
            class="mb-4"
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="dialog.recordResult = false">Cancel</v-btn>
        <v-btn 
          color="#800020" 
          @click="saveWorkoutResult"
          :loading="isSavingResult"
        >
          Save Result
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar for notifications -->
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
  >
    {{ snackbar.message }}
    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="snackbar.show = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>

  <!-- Assign Plan Dialog -->
  <v-dialog v-model="dialog.assignPlan" max-width="600px">
    <v-card>
      <v-card-title>Assign Plan to {{ selectedAthleteForPlan?.name }}</v-card-title>
      <v-card-text>
        <v-alert v-if="plans.length === 0" type="info" class="mb-4">
          No training plans available. Create a plan first.
        </v-alert>
        
        <v-list v-if="plans.length > 0">
          <v-list-item
            v-for="plan in plans"
            :key="plan.id"
            @click="confirmAssignPlan(plan.id)"
            class="plan-item"
          >
            <v-list-item-title class="font-weight-bold">{{ plan.name }}</v-list-item-title>
            <v-list-item-subtitle>
              <div>{{ plan.description || 'No description' }}</div>
              <div class="text-caption mt-1">
                Duration: {{ plan.duration }} weeks • {{ plan.planExercises?.length || 0 }} exercises
              </div>
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn 
                color="#800020" 
                variant="outlined" 
                size="small"
              >
                Assign
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="dialog.assignPlan = false; selectedAthleteForPlan = null">
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.plan-item {
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 8px;
}

.plan-item:hover {
  background-color: rgba(128, 0, 32, 0.05);
}
</style>