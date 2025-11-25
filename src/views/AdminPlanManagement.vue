<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AdminServices from '../services/adminServices.js';
import ExerciseServices from '../services/exerciseServices.js';

const router = useRouter();
const user = ref({});
const plans = ref([]);
const exercises = ref([]);
const loading = ref(false);
const error = ref(null);

// Dialog controls
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showPlanDetails = ref(false);
const showDeleteConfirm = ref(false);
const selectedPlan = ref(null);
const planToDelete = ref(null);

// New plan form
const newPlan = ref({
  name: '',
  description: '',
  duration: 4,
  exercises: [],
  days: [] // Array of selected day names
});

const daysOfWeekCheckbox = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const daysOfWeek = [
  { value: 1, text: 'Monday' },
  { value: 2, text: 'Tuesday' },
  { value: 3, text: 'Wednesday' },
  { value: 4, text: 'Thursday' },
  { value: 5, text: 'Friday' },
  { value: 6, text: 'Saturday' },
  { value: 7, text: 'Sunday' }
];

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }
  await loadData();
});

const loadData = async () => {
  try {
    loading.value = true;
    const [plansResponse, exercisesResponse] = await Promise.all([
      AdminServices.getAllPlans(),
      ExerciseServices.getAllExercises()
    ]);
    
    plans.value = plansResponse.data.data || [];
    // Handle both direct array and nested data structure
    exercises.value = exercisesResponse.data.data || exercisesResponse.data || [];
    console.log('Loaded exercises:', exercises.value); // Debug log
  } catch (err) {
    error.value = err.message;
    console.error('Error loading data:', err);
  } finally {
    loading.value = false;
  }
};

const createPlan = async () => {
  try {
    loading.value = true;
    
    // Format the plan data for backend
    const planData = {
      name: newPlan.value.name,
      description: newPlan.value.description,
      duration: newPlan.value.duration,
      dayCheck: newPlan.value.days.join(','), // Convert array to comma-separated string
      exercises: newPlan.value.exercises.map(exerciseId => ({
        exerciseId: exerciseId,
        sets: 3,
        reps: 10
      })),
      isStandard: true
    };
    
    await AdminServices.createStandardPlan(planData);
    showCreateDialog.value = false;
    resetNewPlan();
    await loadData();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const editPlan = (plan) => {
  selectedPlan.value = { ...plan };
  // Populate the form with existing plan data
  newPlan.value = {
    name: plan.name,
    description: plan.description,
    duration: plan.duration,
    exercises: plan.planExercises?.map(pe => pe.exerciseId) || [],
    days: plan.dayCheck ? plan.dayCheck.split(',') : []
  };
  showEditDialog.value = true;
};

const updatePlan = async () => {
  try {
    loading.value = true;
    
    // Format the plan data for backend
    const planData = {
      name: newPlan.value.name,
      description: newPlan.value.description,
      duration: newPlan.value.duration,
      dayCheck: newPlan.value.days.join(','), // Convert array to comma-separated string
      exercises: newPlan.value.exercises.map(exerciseId => ({
        exerciseId: exerciseId,
        sets: 3,
        reps: 10
      }))
    };
    
    await AdminServices.updatePlan(selectedPlan.value.id, planData);
    showEditDialog.value = false;
    resetNewPlan();
    await loadData();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (plan) => {
  planToDelete.value = plan;
  showDeleteConfirm.value = true;
};

const deletePlan = async () => {
  try {
    loading.value = true;
    await AdminServices.deletePlan(planToDelete.value.id);
    showDeleteConfirm.value = false;
    planToDelete.value = null;
    await loadData();
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    loading.value = false;
  }
};

const resetNewPlan = () => {
  newPlan.value = {
    name: '',
    description: '',
    duration: 4,
    exercises: [],
    days: []
  };
};

const viewPlanDetails = (plan) => {
  selectedPlan.value = plan;
  showPlanDetails.value = true;
};

const logout = () => {
  Utils.removeItem("user");
  router.push({ name: "login" });
};

const formatCreatorName = (creator) => {
  if (!creator) return 'Unknown';
  return `${creator.fName} ${creator.lName} (${creator.role})`;
};
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- OC Branded Header -->
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="$router.push({ name: 'admin-dashboard' })" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Admin Plan Management
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Admin)
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1 class="text-h4 mb-6">All Training Plans</h1>
        </v-col>
      </v-row>

      <!-- Create Plan Button -->
      <v-row>
        <v-col cols="12">
          <v-btn 
            color="#800020" 
            size="large" 
            @click="showCreateDialog = true"
            class="text-white mb-4"
          >
            <v-icon left>mdi-plus</v-icon>
            Create Standard Plan
          </v-btn>
        </v-col>
      </v-row>

      <!-- Plans List -->
      <v-row>
        <v-col v-for="plan in plans" :key="plan.id" cols="12" md="6" lg="4">
          <v-card>
            <v-card-title>{{ plan.name }}</v-card-title>
            <v-card-subtitle>{{ plan.duration }} weeks</v-card-subtitle>
            <v-card-text>
              <p v-if="plan.description">{{ plan.description }}</p>
              <div class="mt-2">
                <v-chip size="small" class="ma-1" :color="plan.isStandard ? 'primary' : 'secondary'">
                  {{ plan.isStandard ? 'Standard' : 'Custom' }}
                </v-chip>
                <v-chip size="small" class="ma-1">
                  {{ plan.planExercises?.length || 0 }} exercises
                </v-chip>
              </div>
              <p class="mt-2 text-caption" v-if="plan.creator">
                Created by: {{ formatCreatorName(plan.creator) }}
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn color="#800020" variant="text" @click="viewPlanDetails(plan)">
                View
              </v-btn>
              <v-btn color="#800020" variant="text" @click="editPlan(plan)">
                Edit
              </v-btn>
              <v-btn color="error" variant="text" @click="confirmDelete(plan)">
                Delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- No Plans Message -->
      <v-row v-if="!loading && plans.length === 0">
        <v-col cols="12">
          <v-alert color="grey-lighten-3" variant="flat">
            <v-icon color="#800020">mdi-information</v-icon>
            No training plans yet. Click "Create Standard Plan" to get started.
          </v-alert>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create Plan Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="800">
      <v-card>
        <v-card-title>Create Training Plan</v-card-title>
        <v-card-text>
          <v-form>
            <!-- Plan Name -->
            <v-text-field
              v-model="newPlan.name"
              label="Plan Name"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <!-- Description -->
            <v-textarea
              v-model="newPlan.description"
              label="Description"
              rows="3"
              variant="outlined"
              class="mb-4"
            ></v-textarea>
            
            <!-- Duration -->
            <v-select
              v-model="newPlan.duration"
              :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
              label="Duration (weeks)"
              variant="outlined"
              class="mb-4"
            ></v-select>

            <!-- Select Exercises -->
            <v-select
              v-model="newPlan.exercises"
              :items="exercises"
              item-title="name"
              item-value="id"
              label="Select Exercises"
              variant="outlined"
              multiple
              chips
              closable-chips
              hint="Select one or more exercises from the library"
              persistent-hint
              class="mb-4"
            >
              <template v-slot:chip="{ item, props }">
                <v-chip v-bind="props" closable>
                  {{ item.title }}
                </v-chip>
              </template>
            </v-select>

            <!-- Days of the Week -->
            <div class="mb-4">
              <label class="text-subtitle-1 mb-2 d-block">Days of the Week</label>
              <v-chip-group
                v-model="newPlan.days"
                column
                multiple
              >
                <v-chip
                  v-for="day in daysOfWeekCheckbox"
                  :key="day"
                  :value="day"
                  filter
                  variant="outlined"
                  color="#800020"
                >
                  {{ day }}
                </v-chip>
              </v-chip-group>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showCreateDialog = false; resetNewPlan()">Cancel</v-btn>
          <v-btn 
            color="#800020" 
            variant="elevated"
            @click="createPlan"
            :disabled="!newPlan.name || newPlan.exercises.length === 0"
            :loading="loading"
            class="text-white"
          >
            Create Plan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Plan Details Dialog -->
    <v-dialog v-model="showPlanDetails" max-width="600">
      <v-card v-if="selectedPlan">
        <v-card-title>{{ selectedPlan.name }}</v-card-title>
        <v-card-text>
          <p v-if="selectedPlan.description" class="mb-4">{{ selectedPlan.description }}</p>
          <p><strong>Duration:</strong> {{ selectedPlan.duration }} weeks</p>
          <p><strong>Type:</strong> {{ selectedPlan.isStandard ? 'Standard' : 'Custom' }}</p>
          <p><strong>Created By:</strong> {{ formatCreatorName(selectedPlan.creator) }}</p>
          
          <h3 class="text-h6 mt-4 mb-2">Exercises</h3>
          <v-list>
            <v-list-item v-for="pe in selectedPlan.planExercises" :key="pe.id">
              <v-list-item-content>
                <v-list-item-title>
                  {{ pe.exercise?.name }} - {{ daysOfWeek.find(d => d.value === pe.dayOfWeek)?.text }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ pe.sets }} sets × {{ pe.reps }} reps
                  <span v-if="pe.restTime">({{ pe.restTime }}s rest)</span>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showPlanDetails = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Plan Dialog -->
    <v-dialog v-model="showEditDialog" max-width="800">
      <v-card>
        <v-card-title>Edit Training Plan</v-card-title>
        <v-card-text>
          <v-form>
            <!-- Plan Name -->
            <v-text-field
              v-model="newPlan.name"
              label="Plan Name"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <!-- Description -->
            <v-textarea
              v-model="newPlan.description"
              label="Description"
              rows="3"
              variant="outlined"
              class="mb-4"
            ></v-textarea>
            
            <!-- Duration -->
            <v-select
              v-model="newPlan.duration"
              :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
              label="Duration (weeks)"
              variant="outlined"
              class="mb-4"
            ></v-select>

            <!-- Select Exercises -->
            <v-select
              v-model="newPlan.exercises"
              :items="exercises"
              item-title="name"
              item-value="id"
              label="Select Exercises"
              variant="outlined"
              multiple
              chips
              closable-chips
              hint="Select one or more exercises from the library"
              persistent-hint
              class="mb-4"
            >
              <template v-slot:chip="{ item, props }">
                <v-chip v-bind="props" closable>
                  {{ item.title }}
                </v-chip>
              </template>
            </v-select>

            <!-- Days of the Week -->
            <div class="mb-4">
              <label class="text-subtitle-1 mb-2 d-block">Days of the Week</label>
              <v-chip-group
                v-model="newPlan.days"
                column
                multiple
              >
                <v-chip
                  v-for="day in daysOfWeekCheckbox"
                  :key="day"
                  :value="day"
                  filter
                  variant="outlined"
                  color="#800020"
                >
                  {{ day }}
                </v-chip>
              </v-chip-group>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showEditDialog = false; resetNewPlan()">Cancel</v-btn>
          <v-btn 
            color="#800020" 
            variant="elevated"
            @click="updatePlan"
            :disabled="!newPlan.name || newPlan.exercises.length === 0"
            :loading="loading"
            class="text-white"
          >
            Update Plan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete Plan?</v-card-title>
        <v-card-text>
          Are you sure you want to delete the plan "{{ planToDelete?.name }}"? This action cannot be undone.
          <v-alert v-if="error" type="error" class="mt-3">
            {{ error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteConfirm = false; planToDelete = null; error = null">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="deletePlan" :loading="loading">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>