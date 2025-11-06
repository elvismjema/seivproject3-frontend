<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Record Exercise
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push({ name: 'athlete-dashboard' })" class="text-white">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Record Exercise</h1>
          
          <v-card>
            <v-card-text>
              <v-form ref="form" @submit.prevent="submitExercise">
                <!-- Exercise Selection -->
                <v-select
                  v-model="exerciseData.exerciseId"
                  :items="availableExercises"
                  label="Select Exercise"
                  required
                  :rules="[v => !!v || 'Exercise is required']"
                  :item-text="(exercise) => `${exercise.name} (${exercise.category})`"
                  item-value="id"
                ></v-select>

                <!-- Date and Time -->
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="exerciseData.date"
                      label="Date"
                      type="date"
                      required
                      :rules="[v => !!v || 'Date is required']"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="exerciseData.time"
                      label="Time"
                      type="time"
                      required
                      :rules="[v => !!v || 'Time is required']"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <!-- Sets Section -->
                <div class="sets-section mb-4">
                  <div class="d-flex align-center mb-2">
                    <h3 class="text-h6">Sets</h3>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      variant="text"
                      @click="addSet"
                    >
                      <v-icon>mdi-plus</v-icon>
                      Add Set
                    </v-btn>
                  </div>

                  <v-expand-transition group>
                    <div v-for="(set, index) in exerciseData.sets" :key="index" class="set-item">
                      <v-card variant="outlined" class="mb-2">
                        <v-card-text>
                          <v-row align="center">
                            <v-col cols="12" md="3">
                              <v-text-field
                                v-model="set.reps"
                                label="Reps"
                                type="number"
                                required
                                :rules="[v => !!v || 'Reps are required']"
                              ></v-text-field>
                            </v-col>
                            <v-col cols="12" md="3">
                              <v-text-field
                                v-model="set.weight"
                                label="Weight (lbs)"
                                type="number"
                              ></v-text-field>
                            </v-col>
                            <v-col cols="12" md="5">
                              <v-text-field
                                v-model="set.notes"
                                label="Notes"
                                placeholder="Optional"
                              ></v-text-field>
                            </v-col>
                            <v-col cols="12" md="1" class="text-center">
                              <v-btn
                                icon
                                variant="text"
                                color="error"
                                @click="removeSet(index)"
                              >
                                <v-icon>mdi-delete</v-icon>
                              </v-btn>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </div>
                  </v-expand-transition>

                  <v-alert
                    v-if="exerciseData.sets.length === 0"
                    type="info"
                    variant="tonal"
                  >
                    Click "Add Set" to record your sets for this exercise.
                  </v-alert>
                </div>

                <!-- Notes -->
                <v-textarea
                  v-model="exerciseData.notes"
                  label="Exercise Notes"
                  placeholder="How did this exercise feel? Any achievements or challenges?"
                  rows="3"
                ></v-textarea>

                <!-- Submit Button -->
                <v-alert
                  v-if="exerciseData.sets.length === 0"
                  type="warning"
                  variant="tonal"
                  class="mb-3"
                >
                  Please add at least one set before saving.
                </v-alert>
                <v-card-actions class="pt-4">
                  <v-spacer></v-spacer>
                  <v-btn
                    color="error"
                    variant="text"
                    @click="$router.push({ name: 'athlete-dashboard' })"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="#800020"
                    variant="elevated"
                    type="submit"
                    class="text-white"
                    :loading="isSubmitting"
                    :disabled="exerciseData.sets.length === 0 || isSubmitting"
                    size="large"
                  >
                    <v-icon left>mdi-content-save</v-icon>
                    Save Exercise
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const form = ref(null);
const isSubmitting = ref(false);
const availableExercises = ref([]);

// Initialize with current date and time
const now = new Date();
const exerciseData = ref({
  exerciseId: null,
  date: now.toISOString().split('T')[0],
  time: now.toTimeString().split(':').slice(0, 2).join(':'),
  sets: [],
  notes: ''
});

const addSet = () => {
  exerciseData.value.sets.push({
    reps: null,
    weight: null,
    notes: ''
  });
};

const removeSet = (index) => {
  exerciseData.value.sets.splice(index, 1);
};

const submitExercise = async () => {
  console.log('Submit button clicked!');
  
  // Validate required fields manually
  if (!exerciseData.value.exerciseId) {
    alert('Please select an exercise');
    return;
  }
  
  if (!exerciseData.value.date) {
    alert('Please select a date');
    return;
  }
  
  if (!exerciseData.value.time) {
    alert('Please select a time');
    return;
  }
  
  if (exerciseData.value.sets.length === 0) {
    alert('Please add at least one set');
    return;
  }
  
  // Validate all sets have reps
  for (let i = 0; i < exerciseData.value.sets.length; i++) {
    if (!exerciseData.value.sets[i].reps) {
      alert(`Please enter reps for set ${i + 1}`);
      return;
    }
  }
  
  isSubmitting.value = true;
  
  try {
    const dateTime = new Date(`${exerciseData.value.date}T${exerciseData.value.time}`);
    
    console.log('Submitting exercise data:', {
      exerciseId: exerciseData.value.exerciseId,
      performedAt: dateTime.toISOString(),
      sets: exerciseData.value.sets,
      notes: exerciseData.value.notes
    });
    
    const response = await AthleteServices.recordExercise({
      exerciseId: exerciseData.value.exerciseId,
      performedAt: dateTime.toISOString(),
      sets: exerciseData.value.sets,
      notes: exerciseData.value.notes
    });
    
    console.log('Exercise saved successfully:', response);
    alert('Exercise recorded successfully!');

    router.push({ name: 'athlete-dashboard' });
  } catch (error) {
    console.error('Error recording exercise:', error);
    console.error('Error details:', error.response?.data);
    alert(`Failed to save exercise: ${error.response?.data?.message || error.message}`);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  try {
    const response = await AthleteServices.getAvailableExercises();
    if (response.data && response.data.data) {
      availableExercises.value = response.data.data;
    }
  } catch (error) {
    console.error('Error loading exercises:', error);
    // Show error message
  }
});
</script>

<style scoped>
.sets-section {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
}
</style>