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

const getStatusColor = (plan) => {
  const now = new Date();
  const start = new Date(plan.startDate);
  const end = plan.endDate ? new Date(plan.endDate) : null;
  
  if (end && now > end) return 'grey';
  if (now >= start && (!end || now <= end)) return 'success';
  return 'info';
};

const getStatusText = (plan) => {
  const now = new Date();
  const start = new Date(plan.startDate);
  const end = plan.endDate ? new Date(plan.endDate) : null;
  
  if (end && now > end) return 'Completed';
  if (now >= start && (!end || now <= end)) return 'Active';
  return 'Upcoming';
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
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-calendar-month</v-icon>
              My Training Plans
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-row v-else-if="assignedPlans.length > 0">
                <v-col cols="12" v-for="planAssignment in assignedPlans" :key="planAssignment.id">
                  <v-card elevation="2" class="mb-4">
                    <v-card-title class="d-flex align-center bg-grey-lighten-4">
                      <v-icon color="#800020" class="mr-2">mdi-clipboard-text</v-icon>
                      {{ planAssignment.plan?.name || 'Training Plan' }}
                      <v-spacer></v-spacer>
                      <v-chip :color="getStatusColor(planAssignment)" size="small" class="text-white">
                        {{ getStatusText(planAssignment) }}
                      </v-chip>
                    </v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="8">
                          <p class="text-body-1 mb-3">
                            {{ planAssignment.plan?.description || 'No description available' }}
                          </p>
                          <v-divider class="my-3"></v-divider>
                          <div class="mb-2">
                            <v-icon color="#800020" size="small" class="mr-2">mdi-calendar-start</v-icon>
                            <strong>Start Date:</strong> {{ new Date(planAssignment.startDate).toLocaleDateString() }}
                          </div>
                          <div class="mb-2" v-if="planAssignment.endDate">
                            <v-icon color="#800020" size="small" class="mr-2">mdi-calendar-end</v-icon>
                            <strong>End Date:</strong> {{ new Date(planAssignment.endDate).toLocaleDateString() }}
                          </div>
                          <div class="mb-2" v-if="planAssignment.assignedByUser">
                            <v-icon color="#800020" size="small" class="mr-2">mdi-account-check</v-icon>
                            <strong>Assigned by:</strong> {{ planAssignment.assignedByUser.fName }} {{ planAssignment.assignedByUser.lName }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-card variant="outlined">
                            <v-card-title class="text-subtitle-1">Plan Details</v-card-title>
                            <v-card-text>
                              <div class="text-center mb-2">
                                <div class="text-h6" style="color: #800020">{{ planAssignment.plan?.duration || 'N/A' }}</div>
                                <div class="text-caption">Duration</div>
                              </div>
                              <v-divider class="my-2"></v-divider>
                              <div class="text-center">
                                <div class="text-h6" style="color: #800020">{{ planAssignment.plan?.difficulty || 'Medium' }}</div>
                                <div class="text-caption">Difficulty</div>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                      <v-divider class="my-3"></v-divider>
                      <div v-if="planAssignment.notes">
                        <v-icon color="#800020" size="small" class="mr-2">mdi-note-text</v-icon>
                        <strong>Notes:</strong> {{ planAssignment.notes }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <v-alert v-else color="grey-lighten-3" variant="flat">
                <v-icon color="#800020">mdi-information</v-icon>
                No workout plans assigned yet. Contact your coach to get started!
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>