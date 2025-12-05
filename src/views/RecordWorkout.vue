<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const workoutForm = ref({
  exerciseId: null,
  performedDate: new Date().toISOString().split('T')[0],
  sets: null,
  reps: null,
  weight: null,
  duration: null,
  timeValue: null,
  timeUnit: 'seconds',
  notes: ''
});
const durationOptions = [
  { title: '10 minutes', value: 10 },
  { title: '20 minutes', value: 20 },
  { title: '30 minutes', value: 30 },
  { title: '40 minutes', value: 40 },
  { title: '50 minutes', value: 50 },
  { title: '60 minutes (1 hour)', value: 60 },
  { title: '70 minutes', value: 70 },
  { title: '80 minutes', value: 80 },
  { title: '90 minutes', value: 90 },
  { title: '100 minutes', value: 100 },
  { title: '110 minutes', value: 110 },
  { title: '120 minutes (2 hours)', value: 120 }
];
const submitting = ref(false);
const successMessage = ref('');
const availableExercises = ref([]);
const loading = ref(true);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  // Load available exercises
  try {
    const response = await AthleteServices.getAvailableExercises();
    if (response.data && response.data.data) {
      availableExercises.value = response.data.data;
    }
  } catch (err) {
    console.error('Error loading exercises:', err);
  } finally {
    loading.value = false;
  }
});

const submitWorkout = async () => {
  if (!workoutForm.value.exerciseId) {
    alert('Please select an exercise');
    return;
  }

  try {
    submitting.value = true;
    
    const dataToSubmit = {
      exerciseId: workoutForm.value.exerciseId,
      performedDate: workoutForm.value.performedDate,
      sets: workoutForm.value.sets,
      reps: workoutForm.value.reps,
      weight: workoutForm.value.weight,
      duration: workoutForm.value.duration,
      timeValue: workoutForm.value.timeValue,
      timeUnit: workoutForm.value.timeUnit,
      notes: workoutForm.value.notes
    };
    
    console.log('Submitting workout with data:', dataToSubmit);
    await AthleteServices.recordWorkout(dataToSubmit);
    successMessage.value = 'Workout recorded successfully!';
    workoutForm.value = {
      exerciseId: null,
      performedDate: new Date().toISOString().split('T')[0],
      sets: null,
      reps: null,
      weight: null,
      duration: null,
      timeValue: null,
      timeUnit: 'seconds',
      notes: ''
    };
  } catch (err) {
    console.error('Error recording workout:', err);
    console.error('Error response:', err.response?.data);
    alert('Failed to record workout. Please try again.');
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  console.log('Back button clicked, navigating to athlete-dashboard');
  router.push({ name: 'athlete-dashboard' });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Record Workout
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Athlete)
      </v-chip>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1>Record Workout</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-text>
              <v-alert v-if="successMessage" type="success" class="mb-4">
                {{ successMessage }}
              </v-alert>
              
              <v-form @submit.prevent="submitWorkout">
                <v-text-field
                  v-model="workoutForm.performedDate"
                  label="Date"
                  type="date"
                  variant="outlined"
                  class="mb-3"
                  required
                ></v-text-field>

                <v-select
                  v-model="workoutForm.exerciseId"
                  :items="availableExercises"
                  item-title="name"
                  item-value="id"
                  label="Exercise"
                  variant="outlined"
                  class="mb-3"
                  :loading="loading"
                  required
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props" :title="item.raw.name">
                      <v-list-item-subtitle>{{ item.raw.category }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>

                <v-row>
                  <v-col cols="4">
                    <v-text-field
                      v-model.number="workoutForm.sets"
                      label="Sets"
                      type="number"
                      variant="outlined"
                      min="1"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model.number="workoutForm.reps"
                      label="Reps"
                      type="number"
                      variant="outlined"
                      min="1"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model.number="workoutForm.weight"
                      label="Weight (lbs)"
                      type="number"
                      variant="outlined"
                      min="0"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-select
                  v-model="workoutForm.duration"
                  :items="durationOptions"
                  label="Workout Duration (Optional)"
                  variant="outlined"
                  class="mb-3"
                  clearable
                  hint="How long did this workout take?"
                  persistent-hint
                ></v-select>

                <v-divider class="my-4"></v-divider>
                <p class="text-subtitle-2 mb-2">Time-Based Exercise (Optional)</p>
                <p class="text-caption text-grey mb-3">For timed exercises like running, swimming, or batting practice</p>
                
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model.number="workoutForm.timeValue"
                      label="Time Value"
                      type="number"
                      variant="outlined"
                      min="0"
                      step="0.01"
                      hint="e.g., 30 for 30 seconds"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="workoutForm.timeUnit"
                      :items="[{title: 'Seconds', value: 'seconds'}, {title: 'Minutes', value: 'minutes'}, {title: 'Hours', value: 'hours'}]"
                      label="Time Unit"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                </v-row>

                <v-textarea
                  v-model="workoutForm.notes"
                  label="Notes (optional)"
                  variant="outlined"
                  rows="3"
                  class="mb-3"
                  placeholder="How did you feel? Any observations?"
                ></v-textarea>

                <v-btn
                  type="submit"
                  color="#800020"
                  variant="elevated"
                  class="text-white"
                  :loading="submitting"
                  :disabled="submitting || !workoutForm.exerciseId"
                >
                  <v-icon left>mdi-content-save</v-icon>
                  Save Workout
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>