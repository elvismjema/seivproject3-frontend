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
  notes: ''
});
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
    await AthleteServices.recordWorkout(workoutForm.value);
    successMessage.value = 'Workout recorded successfully!';
    workoutForm.value = {
      exerciseId: null,
      performedDate: new Date().toISOString().split('T')[0],
      sets: null,
      reps: null,
      weight: null,
      notes: ''
    };
  } catch (err) {
    console.error('Error recording workout:', err);
    alert('Failed to record workout. Please try again.');
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
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
                  label="Exercise"
                  variant="outlined"
                  class="mb-3"
                  :loading="loading"
                  required
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ item.raw.category }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    {{ item.raw.name }}
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