<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const assignedPlans = ref([]);
const loading = ref(true);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    const response = await AthleteServices.getAssignedPlans();
    if (response.data && response.data.data) {
      assignedPlans.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching assigned plans:', err);
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.push({ name: 'athlete-dashboard' });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const viewPlanExercises = (plan) => {
  if (!plan || !plan.id) return;
  // Store the plan in session storage for the workout session
  sessionStorage.setItem('currentPlan', JSON.stringify(plan));
  router.push({ name: 'workout-session' });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Workout Schedule
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Athlete)
      </v-chip>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1>Workout Schedule</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
          
          <v-expansion-panels v-else-if="assignedPlans.length > 0">
            <v-expansion-panel v-for="assignment in assignedPlans" :key="assignment.id">
              <v-expansion-panel-title>
                <v-row no-gutters align="center">
                  <v-col cols="12" md="6">
                    <div>
                      <strong>{{ assignment.plan?.name || 'Unnamed Plan' }}</strong>
                      <div class="text-caption text-grey">
                        Assigned by: {{ assignment.assignedByUser?.fName }} {{ assignment.assignedByUser?.lName }}
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6" class="text-md-right">
                    <v-chip color="#800020" text-color="white" size="small" class="ma-1">
                      Started: {{ formatDate(assignment.startDate) }}
                    </v-chip>
                    <v-chip color="primary" text-color="white" size="small" class="ma-1">
                      {{ assignment.plan?.duration || 0 }} weeks
                    </v-chip>
                    <v-chip v-if="assignment.endDate" color="grey" text-color="white" size="small" class="ma-1">
                      Ended: {{ formatDate(assignment.endDate) }}
                    </v-chip>
                  </v-col>
                </v-row>
              </v-expansion-panel-title>
              
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="12">
                    <p v-if="assignment.plan?.description" class="mb-4">
                      {{ assignment.plan.description }}
                    </p>
                    
                    <div class="mb-3">
                      <strong>Plan Details:</strong>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Duration: {{ assignment.plan?.duration }} weeks</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Created by: {{ assignment.plan?.creator?.fName }} {{ assignment.plan?.creator?.lName }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item v-if="assignment.plan?.dayCheck">
                          <v-list-item-title>Days: {{ assignment.plan.dayCheck }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </div>
                    
                    <v-btn 
                      color="#800020" 
                      variant="outlined"
                      @click="viewPlanExercises(assignment.plan)"
                      :disabled="!assignment.plan"
                    >
                      <v-icon left>mdi-dumbbell</v-icon>
                      View Exercises
                    </v-btn>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-alert v-else color="grey-lighten-3" variant="flat">
            <v-icon color="#800020">mdi-information</v-icon>
            No workout plans assigned yet. Contact your coach to get started!
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>