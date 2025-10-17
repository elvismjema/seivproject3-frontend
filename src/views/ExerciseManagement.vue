<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import exerciseServices from '../services/exerciseServices.js';

const router = useRouter();
const user = ref({});
const exercises = ref([]);
const loading = ref(false);
const search = ref('');
const selectedCategory = ref('all');

// Dialog states
const createDialog = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const selectedExercise = ref(null);

// Form data
const newExercise = ref({
  name: '',
  description: '',
  category: 'strength',
  equipment: '',
  muscleGroups: []
});

const categories = [
  { text: 'All Categories', value: 'all' },
  { text: 'Strength', value: 'strength' },
  { text: 'Cardio', value: 'cardio' },
  { text: 'Flexibility', value: 'flexibility' },
  { text: 'Balance', value: 'balance' },
  { text: 'Sport-Specific', value: 'sport-specific' }
];

const muscleGroupOptions = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Abs', 'Legs', 'Glutes', 'Calves', 'Full Body'
];

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || (user.value.role !== 'coach' && user.value.role !== 'admin')) {
    router.push({ name: 'login' });
    return;
  }
  fetchExercises();
});

const fetchExercises = async () => {
  loading.value = true;
  try {
    const response = await exerciseServices.getAllExercises();
    if (response.data) {
      exercises.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
  } finally {
    loading.value = false;
  }
};

const filteredExercises = computed(() => {
  let filtered = exercises.value;

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(ex => ex.category === selectedCategory.value);
  }

  // Filter by search
  if (search.value) {
    filtered = filtered.filter(ex =>
      ex.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (ex.description && ex.description.toLowerCase().includes(search.value.toLowerCase()))
    );
  }

  return filtered;
});

const openCreateDialog = () => {
  newExercise.value = {
    name: '',
    description: '',
    category: 'strength',
    equipment: '',
    muscleGroups: []
  };
  createDialog.value = true;
};

const createExercise = async () => {
  if (!newExercise.value.name || !newExercise.value.category) {
    alert('Please provide exercise name and category');
    return;
  }

  try {
    // If admin, allow creating standard exercises
    if (user.value.role === 'admin') {
      newExercise.value.isStandard = true;
    }

    await exerciseServices.createExercise(newExercise.value);
    createDialog.value = false;
    fetchExercises();
  } catch (error) {
    console.error('Error creating exercise:', error);
    alert('Failed to create exercise');
  }
};

const openEditDialog = (exercise) => {
  selectedExercise.value = { ...exercise };
  editDialog.value = true;
};

const updateExercise = async () => {
  if (!selectedExercise.value.name || !selectedExercise.value.category) {
    alert('Please provide exercise name and category');
    return;
  }

  try {
    await exerciseServices.updateExercise(selectedExercise.value.id, selectedExercise.value);
    editDialog.value = false;
    fetchExercises();
  } catch (error) {
    console.error('Error updating exercise:', error);
    alert('Failed to update exercise');
  }
};

const openDeleteDialog = (exercise) => {
  selectedExercise.value = exercise;
  deleteDialog.value = true;
};

const deleteExercise = async () => {
  try {
    await exerciseServices.deleteExercise(selectedExercise.value.id);
    deleteDialog.value = false;
    fetchExercises();
  } catch (error) {
    console.error('Error deleting exercise:', error);
    alert('Failed to delete exercise. It may be used in workout plans.');
  }
};

const getCategoryColor = (category) => {
  const colors = {
    'strength': 'blue',
    'cardio': 'red',
    'flexibility': 'green',
    'balance': 'purple',
    'sport-specific': 'orange'
  };
  return colors[category] || 'grey';
};

const getCategoryIcon = (category) => {
  const icons = {
    'strength': 'mdi-dumbbell',
    'cardio': 'mdi-run',
    'flexibility': 'mdi-yoga',
    'balance': 'mdi-scale-balance',
    'sport-specific': 'mdi-soccer'
  };
  return icons[category] || 'mdi-help';
};

const logout = () => {
  Utils.removeItem("user");
  router.push({ name: "login" });
};

const goBack = () => {
  router.push({ name: user.value.role === 'admin' ? 'admin-dashboard' : 'coach-dashboard' });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- OC Branded Header -->
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Exercise Management
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} ({{ user.role }})
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <h2>Exercise Library</h2>
              <v-spacer></v-spacer>
              <v-btn
                color="#800020"
                variant="elevated"
                class="text-white"
                @click="openCreateDialog"
              >
                <v-icon left>mdi-plus</v-icon>
                Add Exercise
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="search"
                    append-icon="mdi-magnify"
                    label="Search exercises..."
                    single-line
                    hide-details
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="selectedCategory"
                    :items="categories"
                    item-title="text"
                    item-value="value"
                    label="Filter by category"
                    density="compact"
                    hide-details
                  ></v-select>
                </v-col>
              </v-row>

              <v-row class="mt-4">
                <v-col
                  v-for="exercise in filteredExercises"
                  :key="exercise.id"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <v-card>
                    <v-card-title class="d-flex align-center">
                      <v-icon :color="getCategoryColor(exercise.category)" class="mr-2">
                        {{ getCategoryIcon(exercise.category) }}
                      </v-icon>
                      {{ exercise.name }}
                      <v-spacer></v-spacer>
                      <v-chip
                        v-if="exercise.isStandard"
                        size="small"
                        color="#800020"
                        text-color="white"
                      >
                        Standard
                      </v-chip>
                    </v-card-title>

                    <v-card-text>
                      <p class="text-caption">{{ exercise.category }}</p>
                      <p v-if="exercise.description">{{ exercise.description }}</p>
                      <p v-if="exercise.equipment" class="text-caption">
                        <v-icon size="small">mdi-weight</v-icon> {{ exercise.equipment }}
                      </p>
                      <div v-if="exercise.muscleGroups && exercise.muscleGroups.length">
                        <v-chip
                          v-for="(muscle, index) in exercise.muscleGroups"
                          :key="`${exercise.id}-muscle-${index}`"
                          size="x-small"
                          class="mr-1 mb-1"
                        >
                          {{ muscle }}
                        </v-chip>
                      </div>
                    </v-card-text>

                    <v-card-actions v-if="exercise.createdBy === user.userId || user.role === 'admin'">
                      <v-btn
                        size="small"
                        color="#800020"
                        variant="text"
                        @click="openEditDialog(exercise)"
                      >
                        <v-icon size="small">mdi-pencil</v-icon>
                        Edit
                      </v-btn>
                      <v-btn
                        size="small"
                        color="error"
                        variant="text"
                        @click="openDeleteDialog(exercise)"
                      >
                        <v-icon size="small">mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert v-if="filteredExercises.length === 0" color="grey-lighten-3" variant="flat" class="mt-4">
                <v-icon color="#800020">mdi-information</v-icon>
                No exercises found. Try adjusting your filters or create a new exercise.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create Exercise Dialog -->
    <v-dialog v-model="createDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Create New Exercise</span>
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="newExercise.name"
            label="Exercise Name*"
            required
          ></v-text-field>

          <v-textarea
            v-model="newExercise.description"
            label="Description"
            rows="3"
          ></v-textarea>

          <v-select
            v-model="newExercise.category"
            :items="categories.slice(1)"
            item-title="text"
            item-value="value"
            label="Category*"
            required
          ></v-select>

          <v-text-field
            v-model="newExercise.equipment"
            label="Equipment (optional)"
            hint="e.g., Barbell, Dumbbells, Resistance Band"
          ></v-text-field>

          <v-select
            v-model="newExercise.muscleGroups"
            :items="muscleGroupOptions"
            label="Target Muscle Groups"
            multiple
            chips
            closable-chips
          ></v-select>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="createDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="#800020"
            variant="elevated"
            class="text-white"
            @click="createExercise"
          >
            Create Exercise
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Exercise Dialog -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card v-if="selectedExercise">
        <v-card-title>
          <span class="text-h5">Edit Exercise</span>
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="selectedExercise.name"
            label="Exercise Name*"
            required
          ></v-text-field>

          <v-textarea
            v-model="selectedExercise.description"
            label="Description"
            rows="3"
          ></v-textarea>

          <v-select
            v-model="selectedExercise.category"
            :items="categories.slice(1)"
            item-title="text"
            item-value="value"
            label="Category*"
            required
          ></v-select>

          <v-text-field
            v-model="selectedExercise.equipment"
            label="Equipment (optional)"
          ></v-text-field>

          <v-select
            v-model="selectedExercise.muscleGroups"
            :items="muscleGroupOptions"
            label="Target Muscle Groups"
            multiple
            chips
            closable-chips
          ></v-select>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="editDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="#800020"
            variant="elevated"
            class="text-white"
            @click="updateExercise"
          >
            Update Exercise
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ selectedExercise?.name }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteExercise"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>