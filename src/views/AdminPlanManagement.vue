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
  isStandard: true
});

// New exercise to add to plan
const newExercise = ref({
  exerciseId: null,
  dayOfWeek: 1,
  sets: 3,
  reps: 10,
  duration: null,
  restTime: 60
});

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
      ExerciseServices.getExercises()
    ]);
    
    plans.value = plansResponse.data.data || [];
    exercises.value = exercisesResponse.data.data || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const addExerciseToPlan = () => {
  const exercise = exercises.value.find(e => e.id === newExercise.value.exerciseId);
  if (!exercise) return;

  newPlan.value.exercises.push({
    ...newExercise.value,
    exerciseName: exercise.name
  });

  // Reset form
  newExercise.value = {
    exerciseId: null,
    dayOfWeek: 1,
    sets: 3,
    reps: 10,
    duration: null,
    restTime: 60
  };
};

const removeExerciseFromPlan = (index) => {
  newPlan.value.exercises.splice(index, 1);
};

const createPlan = async () => {
  try {
    loading.value = true;
    await AdminServices.createStandardPlan(newPlan.value);
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
    isStandard: plan.isStandard,
    exercises: plan.planExercises?.map(pe => ({
      exerciseId: pe.exerciseId,
      dayOfWeek: pe.dayOfWeek,
      sets: pe.sets,
      reps: pe.reps,
      duration: pe.duration,
      restTime: pe.restTime,
      exerciseName: pe.exercise?.name
    })) || []
  };
  showEditDialog.value = true;
};

const updatePlan = async () => {
  try {
    loading.value = true;
    await AdminServices.updatePlan(selectedPlan.value.id, newPlan.value);
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
    isStandard: true
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
    <!-- Admin Header -->
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Admin Plan Management
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$router.push({ name: 'admin-dashboard' })" class="text-white">
        <v-icon left>mdi-view-dashboard</v-icon>
        Dashboard
      </v-btn>
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

      <!-- Plans Table -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-data-table
              :headers="[
                { title: 'Name', value: 'name' },
                { title: 'Duration', value: 'duration' },
                { title: 'Type', value: 'isStandard' },
                { title: 'Created By', value: 'creator' },
                { title: 'Exercises', value: 'exerciseCount' },
                { title: 'Actions', value: 'actions', sortable: false }
              ]"
              :items="plans"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.duration="{ item }">
                {{ item.duration }} weeks
              </template>
              <template v-slot:item.isStandard="{ item }">
                <v-chip :color="item.isStandard ? 'primary' : 'secondary'" size="small">
                  {{ item.isStandard ? 'Standard' : 'Custom' }}
                </v-chip>
              </template>
              <template v-slot:item.creator="{ item }">
                {{ formatCreatorName(item.creator) }}
              </template>
              <template v-slot:item.exerciseCount="{ item }">
                {{ item.planExercises?.length || 0 }}
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon size="small" @click="viewPlanDetails(item)">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon size="small" @click="editPlan(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" @click="confirmDelete(item)" color="error">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

      <!-- Error Alert -->
      <v-row v-if="error">
        <v-col cols="12">
          <v-alert type="error" dismissible @click="error = null">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create/Edit Plan Dialog -->
    <v-dialog :model-value="showCreateDialog || showEditDialog" max-width="800" @update:model-value="val => { if (!val) { showCreateDialog = false; showEditDialog = false; } }">
      <v-card>
        <v-card-title>{{ showEditDialog ? 'Edit' : 'Create' }} Training Plan</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="newPlan.name"
              label="Plan Name"
              required
              variant="outlined"
            ></v-text-field>
            
            <v-textarea
              v-model="newPlan.description"
              label="Description"
              rows="3"
              variant="outlined"
            ></v-textarea>
            
            <v-select
              v-model="newPlan.duration"
              :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
              label="Duration (weeks)"
              variant="outlined"
            ></v-select>

            <v-checkbox
              v-model="newPlan.isStandard"
              label="Standard Plan (available to all coaches)"
            ></v-checkbox>

            <v-divider class="my-4"></v-divider>
            
            <h3 class="text-h6 mb-3">Add Exercises</h3>
            
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="newExercise.exerciseId"
                  :items="exercises"
                  item-title="name"
                  item-value="id"
                  label="Exercise"
                  variant="outlined"
                  dense
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="newExercise.dayOfWeek"
                  :items="daysOfWeek"
                  item-title="text"
                  item-value="value"
                  label="Day"
                  variant="outlined"
                  dense
                ></v-select>
              </v-col>
              <v-col cols="6" md="2">
                <v-text-field
                  v-model.number="newExercise.sets"
                  label="Sets"
                  type="number"
                  variant="outlined"
                  dense
                ></v-text-field>
              </v-col>
              <v-col cols="6" md="2">
                <v-text-field
                  v-model.number="newExercise.reps"
                  label="Reps"
                  type="number"
                  variant="outlined"
                  dense
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="1">
                <v-btn
                  color="#800020"
                  icon
                  @click="addExerciseToPlan"
                  :disabled="!newExercise.exerciseId"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </v-col>
            </v-row>

            <!-- Added Exercises List -->
            <v-list v-if="newPlan.exercises.length > 0" class="mt-4">
              <v-list-item v-for="(ex, index) in newPlan.exercises" :key="index">
                <v-list-item-content>
                  <v-list-item-title>
                    {{ ex.exerciseName }} - {{ daysOfWeek.find(d => d.value === ex.dayOfWeek)?.text }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ ex.sets }} sets × {{ ex.reps }} reps
                  </v-list-item-subtitle>
                </v-list-item-content>
                <template v-slot:append>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="removeExerciseFromPlan(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showCreateDialog = false; showEditDialog = false; resetNewPlan()">Cancel</v-btn>
          <v-btn 
            color="#800020" 
            variant="elevated"
            @click="showEditDialog ? updatePlan() : createPlan()"
            :disabled="!newPlan.name || newPlan.exercises.length === 0"
            :loading="loading"
            class="text-white"
          >
            {{ showEditDialog ? 'Update' : 'Create' }} Plan
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