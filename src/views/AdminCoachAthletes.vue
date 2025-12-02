<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AdminServices from '../services/adminServices.js';

const route = useRoute();
const router = useRouter();

const user = ref({});
const coach = ref(null);
const athletes = ref([]);
const loading = ref(true);
const error = ref('');
const success = ref('');

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }
  await fetchCoachAndAthletes();
});

const fetchCoachAndAthletes = async () => {
  loading.value = true;
  error.value = '';
  try {
    // Get coach details
    const coachId = route.params.coachId;
    const usersResponse = await AdminServices.getAllUsers();
    coach.value = usersResponse.data.find(u => u.id === coachId && u.role === 'coach');
    
    if (!coach.value) {
      throw new Error('Coach not found');
    }
    
    // Get coach's athletes
    const response = await AdminServices.getCoachAthletes(coachId);
    athletes.value = response.data || [];
  } catch (err) {
    console.error('Error fetching coach athletes:', err);
    error.value = 'Failed to load coach athletes. Please try again.';
  } finally {
    loading.value = false;
  }
};

const removeAthlete = async (athleteId) => {
  if (!confirm('Are you sure you want to remove this athlete from the coach?')) {
    return;
  }
  
  try {
    await AdminServices.removeAthleteFromCoach(coach.value.id, athleteId);
    // Remove the athlete from the local list
    athletes.value = athletes.value.filter(a => a.id !== athleteId);
    success.value = 'Athlete removed successfully';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    console.error('Error removing athlete:', err);
    error.value = 'Failed to remove athlete. Please try again.';
    setTimeout(() => { error.value = ''; }, 3000);
  }
};

const goBack = () => {
  router.push({ name: 'admin-coaches' });
};

const logout = () => {
  Utils.removeItem("user");
  router.push({ name: "login" });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- Header -->
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Manage Athletes
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Admin)
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <h2 class="text-h5 font-weight-bold">
                Athletes for Coach: {{ coach ? `${coach.fName} ${coach.lName}` : '' }}
              </h2>
              <v-spacer></v-spacer>
              <v-btn
                color="#800020"
                variant="outlined"
                prepend-icon="mdi-account-multiple-plus"
                @click="$router.push({ name: 'admin-coaches' })"
              >
                Back to Coaches
              </v-btn>
            </v-card-title>

            <v-card-text>
              <!-- Success Message -->
              <v-alert
                v-if="success"
                type="success"
                class="mb-4"
                closable
                @click:close="success = ''"
              >
                {{ success }}
              </v-alert>

              <!-- Error Message -->
              <v-alert
                v-if="error"
                type="error"
                class="mb-4"
                closable
                @click:close="error = ''"
              >
                {{ error }}
              </v-alert>

              <v-table v-if="!loading && athletes.length > 0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="athlete in athletes" :key="athlete.id">
                    <td>{{ athlete.fName }} {{ athlete.lName }}</td>
                    <td>{{ athlete.email }}</td>
                    <td>
                      <v-btn
                        size="small"
                        color="error"
                        variant="outlined"
                        @click="removeAthlete(athlete.id)"
                        :loading="loading"
                      >
                        <v-icon size="small" class="mr-1">mdi-account-remove</v-icon>
                        Remove
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert v-else-if="!loading" type="info">
                No athletes found for this coach.
              </v-alert>

              <v-progress-linear v-else indeterminate color="#800020"></v-progress-linear>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style scoped>
.v-table {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}
</style>
