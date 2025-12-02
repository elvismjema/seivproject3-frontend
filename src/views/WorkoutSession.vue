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
      <v-row class="mt-5">
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Current Workout</h1>
          
          <!-- Timer -->
          <v-card class="mb-6">
            <v-card-text class="text-center">
              <div class="text-h2">{{ formatTime(elapsedTime) }}</div>
              <div class="text-subtitle-1">Workout Duration</div>
              <v-btn
                :color="isTimerRunning ? 'error' : 'success'"
                class="mt-2"
                @click="toggleTimer"
              >
                {{ isTimerRunning ? 'Pause' : 'Resume' }}
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Exercise List -->
          <v-card>
            <v-card-title class="d-flex align-center">
              Exercises
              <v-spacer></v-spacer>
              <v-btn
                color="success"
                variant="text"
                @click="addExercise"
                v-if="!todayWorkout"
              >
                <v-icon>mdi-plus</v-icon>
                Add Exercise
              </v-btn>
            </v-card-title>
            
            <v-card-text>
              <v-list v-if="exercises.length > 0">
                <v-list-item
                  v-for="(exercise, index) in exercises"
                  :key="index"
                  :class="{ 'bg-grey-lighten-4': exercise.completed }"
                >
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="exercise.completed"
                      :color="exercise.completed ? 'success' : undefined"
                      @change="updateProgress"
                    ></v-checkbox>
                  </template>

                  <v-list-item-title>
                    {{ exercise.name }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle>
                    {{ exercise.sets }} sets × {{ exercise.reps }} reps
                    <span v-if="exercise.weight">@ {{ exercise.weight }} lbs</span>
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-btn
                      icon
                      variant="text"
                      color="primary"
                      @click="recordSet(exercise)"
                      :disabled="exercise.completed"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert
                v-else
                type="info"
                variant="tonal"
              >
                No exercises added yet. Click "Add Exercise" to begin your workout.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bottom Action Bar -->
      <v-footer fixed class="bg-white v-col-12 pa-0">
        <v-card width="100%" flat>
          <v-card-text class="text-center">
            <v-btn
              color="error"
              variant="elevated"
              size="large"
              class="mx-2"
              @click="confirmEndWorkout"
            >
              End Workout
            </v-btn>
          </v-card-text>
        </v-card>
      </v-footer>

      <!-- Add Exercise Dialog -->
      <v-dialog v-model="showAddExerciseDialog" max-width="500px">
        <v-card>
          <v-card-title>Add Exercise</v-card-title>
          <v-card-text>
            <v-select
              v-model="newExercise.exerciseId"
              :items="availableExercises"
              item-title="name"
              item-value="id"
              label="Select Exercise"
              required
            ></v-select>
            
            <v-text-field
              v-model="newExercise.sets"
              type="number"
              label="Number of Sets"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="newExercise.reps"
              type="number"
              label="Reps per Set"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="newExercise.weight"
              type="number"
              label="Weight (lbs)"
              hint="Optional"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="showAddExerciseDialog = false">Cancel</v-btn>
            <v-btn color="success" @click="confirmAddExercise">Add</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Record Set Dialog -->
      <v-dialog v-model="showRecordSetDialog" max-width="500px">
        <v-card>
          <v-card-title>Record Set</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="currentSet.reps"
              type="number"
              label="Reps Completed"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="currentSet.weight"
              type="number"
              label="Weight Used (lbs)"
              required
            ></v-text-field>

            <v-textarea
              v-model="currentSet.notes"
              label="Notes"
              hint="Optional: How did this set feel?"
              persistent-hint
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="showRecordSetDialog = false">Cancel</v-btn>
            <v-btn color="success" @click="saveSet">Save Set</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Confirm End Workout Dialog -->
      <v-dialog v-model="showEndWorkoutDialog" max-width="500px">
        <v-card>
          <v-card-title>End Workout?</v-card-title>
          <v-card-text>
            Are you sure you want to end this workout session?
            <v-list class="mt-4 mb-4">
              <v-list-item>
                <v-list-item-title>Duration: {{ formatTime(elapsedTime) }}</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Exercises Completed: {{ exercises.filter(e => e.completed).length }} / {{ exercises.length }}</v-list-item-title>
              </v-list-item>
            </v-list>
            <v-textarea
              v-model="workoutNotes"
              label="Workout Notes"
              hint="Optional: How was your workout?"
              persistent-hint
              class="mt-4"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="showEndWorkoutDialog = false">Cancel</v-btn>
            <v-btn color="success" @click="endWorkout">End Workout</v-btn>
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
const elapsedTime = ref(0);
const isTimerRunning = ref(true);
const timerInterval = ref(null);
const workoutStartTime = ref(Date.now());

// Dialog controls
const showAddExerciseDialog = ref(false);
const showRecordSetDialog = ref(false);
const showEndWorkoutDialog = ref(false);

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

// Timer functions
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - workoutStartTime.value) / 1000);
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
};

const toggleTimer = () => {
  if (isTimerRunning.value) {
    stopTimer();
  } else {
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
  currentSet.value = {
    exerciseId: exercise.id,
    reps: exercise.reps,
    weight: exercise.weight,
    notes: ''
  };
  showRecordSetDialog.value = true;
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
  try {
    await AthleteServices.completeWorkout({
      duration: elapsedTime.value,
      exercises: exercises.value,
      notes: workoutNotes.value
    });
    
    router.push({ 
      name: 'athlete-dashboard',
      params: { 
        message: 'Workout completed successfully!' 
      }
    });
  } catch (error) {
    console.error('Error completing workout:', error);
    // Show error message
  }
};

// Lifecycle hooks
onMounted(async () => {
  startTimer();
  
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