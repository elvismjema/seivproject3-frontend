<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import UserServices from '../services/userServices.js';

const router = useRouter();
const user = ref({});
const coaches = ref([]);
const loading = ref(false);
const search = ref('');
const dialog = ref(false);
const selectedCoach = ref(null);
const coachAthletes = ref([]);
const availableAthletes = ref([]);
const selectedAthlete = ref(null);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }
  fetchCoaches();
  fetchAllAthletes();
});

const fetchCoaches = async () => {
  loading.value = true;
  try {
    // Use the new service method that includes athlete counts
    const coachesWithCounts = await AdminServices.getCoachesWithAthleteCounts();
    coaches.value = coachesWithCounts;
  } catch (error) {
    console.error('Error fetching coaches:', error);
    // Fallback to the old method if the new one fails
    try {
      const response = await UserServices.getAllUsers();
      if (response.data) {
        coaches.value = response.data.filter(u => u.role === 'coach');
      }
    } catch (fallbackError) {
      console.error('Fallback error fetching coaches:', fallbackError);
    }
  } finally {
    loading.value = false;
  }
};

const fetchAllAthletes = async () => {
  try {
    const response = await UserServices.getAllUsers();
    if (response.data) {
      availableAthletes.value = response.data.filter(u => u.role === 'athlete');
    }
  } catch (error) {
    console.error('Error fetching athletes:', error);
  }
};

const viewCoachAthletes = async (coach) => {
  selectedCoach.value = coach;
  try {
    const response = await UserServices.getCoachAthletes(coach.id);
    coachAthletes.value = response.data || [];
    dialog.value = true;
  } catch (error) {
    console.error('Error fetching coach athletes:', error);
  }
};

const addAthleteToCoach = async () => {
  if (!selectedAthlete.value || !selectedCoach.value) return;
  
  try {
    await UserServices.addAthleteToCoach(selectedCoach.value.id, selectedAthlete.value);
    await viewCoachAthletes(selectedCoach.value); // Refresh the list
    selectedAthlete.value = null;
  } catch (error) {
    console.error('Error adding athlete to coach:', error);
  }
};

const removeAthleteFromCoach = async (athleteId) => {
  if (!selectedCoach.value) return;
  
  try {
    await UserServices.removeAthleteFromCoach(selectedCoach.value.id, athleteId);
    await viewCoachAthletes(selectedCoach.value); // Refresh the list
  } catch (error) {
    console.error('Error removing athlete from coach:', error);
  }
};

const filteredCoaches = computed(() => {
  if (!search.value) return coaches.value;
  const searchLower = search.value.toLowerCase();
  return coaches.value.filter(coach => 
    coach.fName?.toLowerCase().includes(searchLower) ||
    coach.lName?.toLowerCase().includes(searchLower) ||
    coach.email?.toLowerCase().includes(searchLower)
  );
});

const getAthleteName = (athleteId) => {
  const athlete = availableAthletes.value.find(a => a.id === athleteId);
  return athlete ? `${athlete.fName} ${athlete.lName}` : 'Unknown Athlete';
};

const goBack = () => {
  router.push({ name: 'admin-dashboard' });
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
        <strong>OC</strong> Exercise Tracker - Coach Management
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
              <h2>Coaches</h2>
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search coaches..."
                single-line
                hide-details
                density="compact"
                style="max-width: 300px"
              ></v-text-field>
            </v-card-title>

            <v-card-text>
              <v-table v-if="!loading">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="coach in filteredCoaches" :key="coach.id">
                    <td>{{ coach.fName }} {{ coach.lName }}</td>
                    <td>{{ coach.email }}</td>
                    <td>
                      <v-btn
                        size="small"
                        color="#800020"
                        variant="text"
                        :to="{ name: 'admin-coach-athletes', params: { coachId: coach.id } }"
                        class="text-none"
                      >
                        <v-icon size="small" left>mdi-account-details</v-icon>
                        Manage Athletes
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <v-progress-linear v-else indeterminate color="#800020"></v-progress-linear>
              
              <v-alert v-if="!loading && filteredCoaches.length === 0" type="info" class="mt-4">
                No coaches found.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Coach Athletes Dialog -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card v-if="selectedCoach">
        <v-card-title>
          <span class="text-h5">Athletes for {{ selectedCoach.fName }} {{ selectedCoach.lName }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-row class="mb-4">
            <v-col cols="12" md="8">
              <v-select
                v-model="selectedAthlete"
                :items="availableAthletes.filter(a => !coachAthletes.some(ca => ca.id === a.id))"
                item-title="fName"
                item-value="id"
                label="Add Athlete"
                return-object
                hide-details
              >
                <template v-slot:selection="{ item }">
                  {{ item.raw.fName }} {{ item.raw.lName }}
                </template>
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="`${item.raw.fName} ${item.raw.lName}`" :subtitle="item.raw.email"></v-list-item>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-btn 
                color="#800020" 
                @click="addAthleteToCoach"
                :disabled="!selectedAthlete"
                block
              >
                <v-icon left>mdi-plus</v-icon>
                Add Athlete
              </v-btn>
            </v-col>
          </v-row>
          
          <v-table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="athlete in coachAthletes" :key="athlete.id">
                <td>{{ athlete.fName }} {{ athlete.lName }}</td>
                <td>{{ athlete.email }}</td>
                <td>
                  <v-btn
                    size="small"
                    color="error"
                    variant="text"
                    @click="removeAthleteFromCoach(athlete.id)"
                  >
                    <v-icon size="small" left>mdi-delete</v-icon>
                    Remove
                  </v-btn>
                </td>
              </tr>
              <tr v-if="coachAthletes.length === 0">
                <td colspan="3" class="text-center text-grey py-4">No athletes assigned to this coach</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="#800020" @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.v-table {
  width: 100%;
}
</style>
