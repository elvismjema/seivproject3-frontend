<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AdminServices from '../services/adminServices.js';

const route = useRoute();
const router = useRouter();

const user = ref({});
const coach = ref(null);
const athletes = ref([]);
const availableAthletes = ref([]);
const loading = ref(true);
const loadingAthletes = ref(false);
const error = ref('');
const success = ref('');
const showAddAthleteDialog = ref(false);
const selectedAthleteId = ref('');

// Computed property to check if we have available athletes to add
const hasAvailableAthletes = computed(() => availableAthletes.value.length > 0);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }
  await fetchCoachAndAthletes();  
  await fetchAvailableAthletes();
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
    athletes.value = await AdminServices.getCoachAthletes(coachId);
  } catch (err) {
    console.error('Error fetching coach athletes:', err);
    error.value = 'Failed to load coach athletes. Please try again.';
    setTimeout(() => { error.value = ''; }, 5000);
  } finally {
    loading.value = false;
  }
};

const fetchAvailableAthletes = async () => {
  if (!coach.value) return;
  
  loadingAthletes.value = true;
  try {
    availableAthletes.value = await AdminServices.getAvailableAthletesForCoach(coach.value.id);
  } catch (err) {
    console.error('Error fetching available athletes:', err);
    error.value = 'Failed to load available athletes. Please try again.';
    setTimeout(() => { error.value = ''; }, 5000);
  } finally {
    loadingAthletes.value = false;
  }
};

const openAddAthleteDialog = async () => {
  await fetchAvailableAthletes();
  showAddAthleteDialog.value = true;
};

const addAthlete = async () => {
  if (!selectedAthleteId.value) return;
  
  try {
    await AdminServices.assignAthleteToCoach(coach.value.id, selectedAthleteId.value);
    
    // Refresh both lists
    await Promise.all([
      fetchCoachAndAthletes(),
      fetchAvailableAthletes()
    ]);
    
    success.value = 'Athlete added successfully';
    selectedAthleteId.value = '';
    showAddAthleteDialog.value = false;
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    console.error('Error adding athlete:', err);
    error.value = 'Failed to add athlete. Please try again.';
    setTimeout(() => { error.value = ''; }, 5000);
  }
};

const removeAthlete = async (athleteId) => {
  if (!confirm('Are you sure you want to remove this athlete from the coach?')) {
    return;
  }
  
  try {
    await AdminServices.removeAthleteFromCoach(coach.value.id, athleteId);
    // Refresh both lists
    await Promise.all([
      fetchCoachAndAthletes(),
      fetchAvailableAthletes()
    ]);
    
    success.value = 'Athlete removed successfully';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    console.error('Error removing athlete:', err);
    error.value = 'Failed to remove athlete. Please try again.';
    setTimeout(() => { error.value = ''; }, 5000);
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
                @click="openAddAthleteDialog"
                :loading="loadingAthletes"
                :disabled="!hasAvailableAthletes"
                class="mr-2"
              >
                Add Athlete
              </v-btn>
              <v-btn
                color="#800020"
                variant="outlined"
                prepend-icon="mdi-arrow-left"
                @click="goBack"
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

              <v-table v-if="!loading" class="elevation-1">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="athletes.length === 0">
                    <td colspan="3" class="text-center py-4">
                      <div v-if="!hasAvailableAthletes" class="text-subtitle-1">
                        No athletes available to assign. All athletes are already assigned to this coach.
                      </div>
                      <div v-else class="text-subtitle-1">
                        No athletes assigned yet. Click "Add Athlete" to get started.
                      </div>
                    </td>
                  </tr>
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
                        prepend-icon="mdi-account-remove"
                      >
                        Remove
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-progress-linear v-else indeterminate color="#800020"></v-progress-linear>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Add Athlete Dialog -->
    <v-dialog v-model="showAddAthleteDialog" max-width="600px">
      <v-card>
        <v-card-title>Add Athlete to Coach</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedAthleteId"
            :items="availableAthletes"
            item-title="name"
            item-value="id"
            label="Select Athlete"
            :loading="loadingAthletes"
            :disabled="loadingAthletes"
            :hint="availableAthletes.length === 0 ? 'No athletes available to add' : ''"
            persistent-hint
            class="mt-4"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.email"></v-list-item>
            </template>
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="showAddAthleteDialog = false">Cancel</v-btn>
          <v-btn 
            color="#800020" 
            @click="addAthlete" 
            :disabled="!selectedAthleteId || loading"
            :loading="loading"
          >
            Add Athlete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.v-table {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}
</style>
