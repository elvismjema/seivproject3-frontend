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
const loading = ref(true);
const error = ref(null);
const dialog = ref({
  addAthlete: false,
  createPlan: false,
  setGoal: false,
  recordResult: false
});

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
  title: '',
  description: '',
  targetDate: '',
  targetValue: '',
  metric: 'reps' // or 'weight', 'time', etc.
});

const workoutResult = ref({
  athleteId: '',
  exerciseId: '',
  date: new Date().toISOString().substr(0, 10),
  sets: 1,
  reps: 10,
  weight: 0,
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
      exercisesListResponse
    ] = await Promise.all([
      CoachServices.getCoachAthletes(),
      CoachServices.getCoachRecentResults(),
      CoachServices.getExercises(),
      CoachServices.getActiveGoalsCount(),
      CoachServices.getWeeklyResultsCount(),
      CoachServices.getCoachAthletes(),
      CoachServices.getExercises() // Load exercises for the plan creation form
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
        sets: 3,
        reps: 10
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

const assignPlanToAthlete = async (athleteId) => {
  try {
    // Fetch available plans
    const response = await CoachServices.getCoachPlans();
    const plans = response.data?.data || [];
    
    if (plans.length === 0) {
      showSnackbar('No plans available. Please create a plan first.', 'warning');
      return;
    }
    
    // Here you would typically open a dialog to select a plan
    // For now, we'll just assign the first available plan
    await CoachServices.assignPlan({
      planId: plans[0].id,
      athleteId: athleteId,
      startDate: new Date().toISOString().split('T')[0]
    });
    
    showSnackbar('Plan assigned successfully', 'success');
    await fetchCoachData();
  } catch (error) {
    console.error('Error assigning plan:', error);
    showSnackbar('Failed to assign plan', 'error');
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

const handleTabChange = (tab) => {
  activeTab.value = tab;
  // You could add logic here to load tab-specific data
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
                    @click="assignPlanToAthlete(athlete.id)"
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
                  @click="dialog.createPlan = true"
                >
                  <v-icon left>mdi-clipboard-list</v-icon>
                  Create Plan
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
          
          <v-text-field
            v-model="newGoal.title"
            label="Goal Title"
            required
            class="mb-4"
          ></v-text-field>
          
          <v-textarea
            v-model="newGoal.description"
            label="Description"
            rows="2"
            class="mb-4"
          ></v-textarea>
          
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
                v-model="newGoal.metric"
                :items="['reps', 'weight (lbs)', 'time (min)', 'distance (mi)']"
                label="Metric"
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
</template>