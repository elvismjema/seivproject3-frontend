<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Workout Session
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push({ name: 'athlete-dashboard' })" class="text-white">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
      <!-- Welcome Screen - Before Workout Starts -->
      <v-row v-if="!workoutStarted" class="mt-10">
        <v-col cols="12" class="text-center">
          <v-icon size="120" color="#800020">mdi-dumbbell</v-icon>
          <h1 class="text-h3 mt-4 mb-2">Ready to Workout?</h1>
          <p class="text-h6 text-grey-darken-1 mb-8">Start your session when you're ready</p>
          
          <v-btn
            color="#800020"
            size="x-large"
            variant="elevated"
            class="text-white px-12 py-6"
            @click="startWorkout"
          >
            <v-icon left size="large">mdi-play-circle</v-icon>
            <span class="text-h5">Start Workout</span>
          </v-btn>
          
          <div class="mt-8">
            <v-btn
              variant="text"
              color="grey"
              @click="$router.push({ name: 'athlete-dashboard' })"
            >
              <v-icon left>mdi-arrow-left</v-icon>
              Back to Dashboard
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Workout In Progress -->
      <v-row v-else class="mt-5">
        <v-col cols="12">
          <!-- Timer Card -->
          <v-card class="mb-6" elevation="2">
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" md="6" class="text-center text-md-left">
                  <div class="d-flex align-center justify-center justify-md-start">
                    <v-icon color="#800020" size="40" class="mr-3">mdi-clock-outline</v-icon>
                    <div>
                      <div class="text-h3 font-weight-bold" style="color: #800020">{{ formatTime(elapsedTime) }}</div>
                      <div class="text-caption text-grey-darken-1">Workout Duration</div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="6" class="text-center text-md-right">
                  <v-btn
                    :color="isTimerRunning ? '#800020' : 'success'"
                    :variant="isTimerRunning ? 'outlined' : 'elevated'"
                    size="large"
                    class="mr-2"
                    @click="toggleTimer"
                  >
                    <v-icon left>{{ isTimerRunning ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                    {{ isTimerRunning ? 'Pause' : 'Resume' }}
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="elevated"
                    size="large"
                    @click="confirmEndWorkout"
                  >
                    <v-icon left>mdi-stop</v-icon>
                    End Workout
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Exercise List -->
          <v-card elevation="2">
            <v-card-title class="bg-grey-lighten-4 d-flex align-center">
              <v-icon color="#800020" class="mr-2" size="28">mdi-format-list-checks</v-icon>
              <span class="text-h6">Your Exercises</span>
              <v-spacer></v-spacer>
              <v-chip color="success" variant="flat" class="text-white mr-3">
                <v-icon left size="small">mdi-check-circle</v-icon>
                {{ exercises.filter(e => e.completed).length }} / {{ exercises.length }} Complete
              </v-chip>
              <v-btn
                color="#800020"
                variant="elevated"
                class="text-white"
                @click="addExercise"
              >
                <v-icon left>mdi-plus-circle</v-icon>
                Add Exercise
              </v-btn>
            </v-card-title>
            
            <v-card-text>
              <v-list v-if="exercises.length > 0" class="pa-0">
                <v-card
                  v-for="(exercise, index) in exercises"
                  :key="index"
                  class="mb-3"
                  :class="{ 'bg-success-lighten-5': exercise.completed }"
                  variant="outlined"
                >
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="d-flex align-center">
                        <v-checkbox
                          v-model="exercise.completed"
                          color="success"
                          @change="updateProgress"
                          hide-details
                          class="mr-2"
                        ></v-checkbox>
                        <div>
                          <div class="text-h6">{{ exercise.name }}</div>
                          <div class="text-caption text-grey-darken-1">
                            Target: {{ exercise.sets }} sets × {{ exercise.reps }} reps
                            <span v-if="exercise.weight">@ {{ exercise.weight }} lbs</span>
                          </div>
                        </div>
                      </div>
                      <v-chip
                        v-if="exercise.completed"
                        size="small"
                        color="success"
                        variant="flat"
                        class="text-white"
                      >
                        <v-icon size="small" left>mdi-check</v-icon>
                        Done
                      </v-chip>
                    </div>

                    <!-- Set Progress -->
                    <v-divider class="my-2"></v-divider>
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-caption">
                        Sets completed: {{ exercise.setsDone }} / {{ exercise.sets }}
                      </span>
                      <div>
                        <v-btn
                          size="small"
                          color="#800020"
                          variant="elevated"
                          class="text-white"
                          @click="recordSet(exercise)"
                          :disabled="exercise.completed"
                        >
                          <v-icon left size="small">mdi-plus</v-icon>
                          Log Set
                        </v-btn>
                        <v-btn
                          size="small"
                          icon
                          variant="text"
                          color="error"
                          @click="removeExercise(index)"
                          class="ml-1"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-list>
              <v-alert
                v-else
                type="info"
                variant="tonal"
                class="text-center"
              >
                <v-icon size="large" color="info">mdi-information</v-icon>
                <div class="mt-2">No exercises added yet</div>
                <div class="text-caption">Click "Add" above to begin your workout</div>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Progress Summary Card -->
      <v-row v-if="workoutStarted && exercises.length > 0">
        <v-col cols="12">
          <v-card class="mt-6" color="grey-lighten-5" elevation="0">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h6">Workout Progress</div>
                  <div class="text-caption text-grey-darken-1">{{ exercises.filter(e => e.completed).length }} of {{ exercises.length }} exercises completed</div>
                </div>
                <v-progress-circular
                  :model-value="(exercises.filter(e => e.completed).length / exercises.length) * 100"
                  :size="60"
                  :width="6"
                  color="#800020"
                >
                  {{ Math.round((exercises.filter(e => e.completed).length / exercises.length) * 100) }}%
                </v-progress-circular>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Add Exercise Dialog -->
      <v-dialog v-model="showAddExerciseDialog" max-width="600px">
        <v-card>
          <v-card-title class="bg-grey-lighten-4">
            <v-icon color="#800020" class="mr-2">mdi-plus-circle</v-icon>
            Add Exercise to Workout
          </v-card-title>
          <v-card-text class="pt-4">
            <v-select
              v-model="newExercise.exerciseId"
              :items="availableExercises"
              label="Select Exercise"
              variant="outlined"
              item-title="name"
              item-value="id"
              required
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon color="#800020">mdi-dumbbell</v-icon>
                  </template>
                  <v-list-item-subtitle>{{ item.raw.category }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>

            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-model.number="newExercise.sets"
                  type="number"
                  label="Sets"
                  variant="outlined"
                  min="1"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="newExercise.reps"
                  type="number"
                  label="Reps"
                  variant="outlined"
                  min="1"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="newExercise.weight"
                  type="number"
                  label="Weight (lbs)"
                  variant="outlined"
                  min="0"
                  hint="Optional"
                  persistent-hint
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" @click="showAddExerciseDialog = false">Cancel</v-btn>
            <v-btn color="#800020" variant="elevated" class="text-white" @click="confirmAddExercise">Add Exercise</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Record Set Dialog -->
      <v-dialog v-model="showRecordSetDialog" max-width="500px">
        <v-card>
          <v-card-title class="bg-grey-lighten-4">
            <v-icon color="#800020" class="mr-2">mdi-pencil</v-icon>
            Log Set {{ (currentExercise?.setsDone || 0) + 1 }}
          </v-card-title>
          <v-card-text class="pt-4">
            <v-alert type="info" variant="tonal" class="mb-4" v-if="currentExercise">
              <strong>{{ currentExercise.name }}</strong><br>
              Target: {{ currentExercise.reps }} reps @ {{ currentExercise.weight || 'bodyweight' }}
            </v-alert>
            
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="currentSet.reps"
                  type="number"
                  label="Reps Completed"
                  variant="outlined"
                  required
                  autofocus
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="currentSet.weight"
                  type="number"
                  label="Weight (lbs)"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-textarea
              v-model="currentSet.notes"
              label="Notes (Optional)"
              variant="outlined"
              rows="2"
              placeholder="e.g., 'Felt strong', 'Failed on last rep', 'Used 50 lbs instead of 60'"
              hint="Track how you felt or any modifications"
              persistent-hint
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" @click="showRecordSetDialog = false">Cancel</v-btn>
            <v-btn color="#800020" variant="elevated" class="text-white" @click="saveSet">
              <v-icon left>mdi-check</v-icon>
              Save Set
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Confirm End Workout Dialog -->
      <v-dialog v-model="showEndWorkoutDialog" max-width="500px">
        <v-card>
          <v-card-title class="bg-grey-lighten-4">
            <v-icon color="error" class="mr-2">mdi-stop-circle</v-icon>
            End Workout?
          </v-card-title>
          <v-card-text class="pt-4">
            <p class="mb-3">Are you sure you want to end this workout session?</p>
            <v-alert type="info" variant="tonal" class="mb-3">
              Duration: {{ formatTime(elapsedTime) }}<br>
              Exercises Completed: {{ exercises.filter(e => e.completed).length }} / {{ exercises.length }}
            </v-alert>
            <v-textarea
              v-model="workoutNotes"
              label="Workout Notes (Optional)"
              variant="outlined"
              rows="3"
              hint="How was your workout?"
              persistent-hint
              placeholder="e.g., 'Great session!', 'Felt tired today', 'New PR on bench press!'"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" @click="showEndWorkoutDialog = false">Cancel</v-btn>
            <v-btn color="error" variant="elevated" @click="endWorkout">
              <v-icon left>mdi-check</v-icon>
              End Workout
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AthleteServices from '../services/athleteServices';

const router = useRouter();
const todayWorkout = ref(null);
const exercises = ref([]);
const availableExercises = ref([]);
const workoutStarted = ref(false);
const elapsedTime = ref(0);
const isTimerRunning = ref(false);
const timerInterval = ref(null);
const workoutStartTime = ref(null);
const pauseStartTime = ref(null);
const totalPausedTime = ref(0);

// Dialog controls
const showAddExerciseDialog = ref(false);
const showRecordSetDialog = ref(false);
const showEndWorkoutDialog = ref(false);
const workoutNotes = ref('');

// Form models
const newExercise = ref({
  exerciseId: null,
  sets: 3,
  reps: 10,
  weight: null
});

const currentSet = ref({
  exerciseId: null,
  reps: null,
  weight: null,
  notes: ''
});

const workoutNotes = ref('');
const currentExercise = ref(null);

// Timer functions
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - workoutStartTime.value - totalPausedTime.value) / 1000);
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
};

const startWorkout = () => {
  workoutStarted.value = true;
  workoutStartTime.value = Date.now();
  isTimerRunning.value = true;
  startTimer();
};

const toggleTimer = () => {
  if (isTimerRunning.value) {
    // Pausing
    stopTimer();
    pauseStartTime.value = Date.now();
  } else {
    // Resuming
    if (pauseStartTime.value) {
      totalPausedTime.value += Date.now() - pauseStartTime.value;
      pauseStartTime.value = null;
    }
    startTimer();
  }
  isTimerRunning.value = !isTimerRunning.value;
};

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Exercise management
const addExercise = () => {
  showAddExerciseDialog.value = true;
};

const confirmAddExercise = () => {
  if (!newExercise.value.exerciseId || !newExercise.value.sets || !newExercise.value.reps) {
    // Show error message
    return;
  }

  const selectedExercise = availableExercises.value.find(e => e.id === newExercise.value.exerciseId);
  
  exercises.value.push({
    id: newExercise.value.exerciseId,
    name: selectedExercise.name,
    sets: newExercise.value.sets,
    reps: newExercise.value.reps,
    weight: newExercise.value.weight,
    completed: false,
    setsDone: 0
  });

  showAddExerciseDialog.value = false;
  newExercise.value = {
    exerciseId: null,
    sets: 3,
    reps: 10,
    weight: null
  };
};

const recordSet = (exercise) => {
  currentExercise.value = exercise;
  currentSet.value = {
    exerciseId: exercise.id,
    reps: exercise.reps,
    weight: exercise.weight,
    notes: ''
  };
  showRecordSetDialog.value = true;
};

const removeExercise = (index) => {
  if (confirm('Are you sure you want to remove this exercise from your workout?')) {
    exercises.value.splice(index, 1);
  }
};

const saveSet = async () => {
  const exercise = exercises.value.find(e => e.id === currentSet.value.exerciseId);
  if (exercise) {
    exercise.setsDone++;
    if (exercise.setsDone >= exercise.sets) {
      exercise.completed = true;
    }
    
    try {
      await AthleteServices.recordExerciseSet({
        exerciseId: currentSet.value.exerciseId,
        reps: currentSet.value.reps,
        weight: currentSet.value.weight,
        notes: currentSet.value.notes
      });
    } catch (error) {
      console.error('Error recording set:', error);
      // Show error message
    }
  }
  
  showRecordSetDialog.value = false;
  updateProgress();
};

const updateProgress = () => {
  // Update progress tracking
  const totalExercises = exercises.value.length;
  const completedExercises = exercises.value.filter(e => e.completed).length;
  
  if (totalExercises > 0 && completedExercises === totalExercises) {
    showEndWorkoutDialog.value = true;
  }
};

const confirmEndWorkout = () => {
  showEndWorkoutDialog.value = true;
};

const endWorkout = async () => {
  showEndWorkoutDialog.value = false; // Close the dialog first
  try {
    await AthleteServices.completeWorkout({
      duration: elapsedTime.value,
      exercises: exercises.value,
      notes: workoutNotes.value
    });
    
    // Stop the timer
    stopTimer();
    
    // Show success message
    alert('Workout completed successfully!');
    
    // Navigate to dashboard
    router.push({ 
      name: 'athlete-dashboard'
    });
  } catch (error) {
    console.error('Error completing workout:', error);
    // Show error message to user
    alert('Failed to complete workout. Please try again.');
    // Reopen the dialog to let user try again
    showEndWorkoutDialog.value = true;
  }
  
  // Reset workout state
  workoutStarted.value = false;
};

// Lifecycle hooks
onMounted(async () => {
  // Don't start timer automatically - wait for user to click Start Workout
  
  try {
    const [workoutResponse, exercisesResponse] = await Promise.all([
      AthleteServices.getTodayWorkout(),
      AthleteServices.getAvailableExercises()
    ]);

    if (workoutResponse.data && workoutResponse.data.data) {
      todayWorkout.value = workoutResponse.data.data;
      exercises.value = todayWorkout.value.map(ex => ({
        ...ex,
        completed: false,
        setsDone: 0
      }));
    }

    if (exercisesResponse.data && exercisesResponse.data.data) {
      availableExercises.value = exercisesResponse.data.data;
    }
  } catch (error) {
    console.error('Error loading workout data:', error);
    // Show error message
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>