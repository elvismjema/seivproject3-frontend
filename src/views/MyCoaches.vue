<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const coaches = ref([]);
const loading = ref(true);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    const response = await AthleteServices.getAthleteCoaches();
    if (response.data && response.data.data) {
      coaches.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching coaches:', err);
  } finally {
    loading.value = false;
  }
});

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
        <strong>OC</strong> Exercise Tracker - My Coaches
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Athlete)
      </v-chip>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <h1>My Coaches</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h5">
              <v-icon left color="#800020">mdi-account-tie</v-icon>
              Your Coaching Team
            </v-card-title>
            <v-card-text>
              <v-progress-linear v-if="loading" indeterminate color="#800020"></v-progress-linear>
              <v-row v-else-if="coaches.length > 0">
                <v-col cols="12" md="6" v-for="coachRel in coaches" :key="coachRel.id">
                  <v-card elevation="2" class="mb-3">
                    <v-card-title class="d-flex align-center bg-grey-lighten-4">
                      <v-avatar color="#800020" class="mr-3">
                        <v-icon color="white">mdi-account-tie</v-icon>
                      </v-avatar>
                      <span>{{ coachRel.coach.fName }} {{ coachRel.coach.lName }}</span>
                    </v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item>
                          <template v-slot:prepend>
                            <v-icon color="#800020">mdi-email</v-icon>
                          </template>
                          <v-list-item-title>{{ coachRel.coach.email }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item>
                          <template v-slot:prepend>
                            <v-icon color="#800020">mdi-calendar-check</v-icon>
                          </template>
                          <v-list-item-title>Coaching since {{ new Date(coachRel.startDate).toLocaleDateString() }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                    <v-card-actions>
                      <v-btn color="#800020" variant="text" :href="'mailto:' + coachRel.coach.email">
                        <v-icon left>mdi-email</v-icon>
                        Contact Coach
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
              <v-alert v-else color="grey-lighten-3" variant="flat">
                <v-icon color="#800020">mdi-information</v-icon>
                No coaches assigned yet. Contact your administrator to be paired with a coach!
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>