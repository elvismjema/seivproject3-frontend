<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import UserServices from '../services/userServices.js';

const router = useRouter();
const user = ref({});
const athletes = ref([]);
const loading = ref(false);
const search = ref('');
const dialog = ref(false);
const selectedAthlete = ref(null);
const athleteCoaches = ref([]);
const availableCoaches = ref([]);
const selectedCoach = ref(null);
const statsDialog = ref(false);
const athleteStats = ref(null);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }
  fetchAthletes();
  fetchAllCoaches();
});

const fetchAthletes = async () => {
  loading.value = true;
  try {
    const response = await UserServices.getAllUsers();
    if (response.data) {
      athletes.value = response.data.filter(u => u.role === 'athlete');
    }
  } catch (error) {
    console.error('Error fetching athletes:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAllCoaches = async () => {
  try {
    const response = await UserServices.getAllUsers();
    if (response.data) {
      availableCoaches.value = response.data.filter(u => u.role === 'coach');
    }
  } catch (error) {
    console.error('Error fetching coaches:', error);
  }
};

const viewAthleteCoaches = async (athlete) => {
  selectedAthlete.value = athlete;
  try {
    const response = await UserServices.getAthleteCoaches(athlete.id);
    athleteCoaches.value = response.data || [];
    dialog.value = true;
  } catch (error) {
    console.error('Error fetching athlete coaches:', error);
  }
};

const viewAthleteStats = async (athlete) => {
  selectedAthlete.value = athlete;
  try {
    const [progressResponse, goalsResponse, weeklyStatsResponse] = await Promise.all([
      UserServices.getAthleteProgress(athlete.id),
      UserServices.getAthleteGoals(athlete.id),
      UserServices.getWeeklyStats(athlete.id)
    ]);
    
    athleteStats.value = {
      progress: progressResponse.data || [],
      goals: goalsResponse.data || [],
      weeklyStats: weeklyStatsResponse.data || {}
    };
    statsDialog.value = true;
  } catch (error) {
    console.error('Error fetching athlete stats:', error);
  }
};

const addCoachToAthlete = async () => {
  if (!selectedCoach.value || !selectedAthlete.value) return;
  
  try {
    await UserServices.addAthleteToCoach(selectedCoach.value.id, selectedAthlete.value.id);
    await viewAthleteCoaches(selectedAthlete.value); // Refresh the list
    selectedCoach.value = null;
  } catch (error) {
    console.error('Error adding coach to athlete:', error);
  }
};

const removeCoachFromAthlete = async (coachId) => {
  if (!selectedAthlete.value) return;
  
  try {
    await UserServices.removeAthleteFromCoach(coachId, selectedAthlete.value.id);
    await viewAthleteCoaches(selectedAthlete.value); // Refresh the list
  } catch (error) {
    console.error('Error removing coach from athlete:', error);
  }
};

const filteredAthletes = computed(() => {
  if (!search.value) return athletes.value;
  const searchLower = search.value.toLowerCase();
  return athletes.value.filter(athlete => 
    athlete.fName?.toLowerCase().includes(searchLower) ||
    athlete.lName?.toLowerCase().includes(searchLower) ||
    athlete.email?.toLowerCase().includes(searchLower)
  );
});

const getCoachName = (coachId) => {
  const coach = availableCoaches.value.find(c => c.id === coachId);
  return coach ? `${coach.fName} ${coach.lName}` : 'Unknown Coach';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
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
        <strong>OC</strong> Exercise Tracker - Athlete Management
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
              <h2>Athletes</h2>
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search athletes..."
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
                    <th>Coaches</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="athlete in filteredAthletes" :key="athlete.id">
                    <td>{{ athlete.fName }} {{ athlete.lName }}</td>
                    <td>{{ athlete.email }}</td>
                    <td>
                      <v-chip 
                        v-if="athlete.coachCount" 
                        color="#800020" 
                        text-color="white" 
                        size="small"
                      >
                        <v-icon left size="small">mdi-account-tie</v-icon>
                        {{ athlete.coachCount }} Coaches
                      </v-chip>
                      <v-chip v-else color="grey" text-color="white" size="small">
                        No Coaches
                      </v-chip>
                    </td>
                    <td>
                      <v-tooltip text="View Coaches" location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            size="small"
                            color="primary"
                            variant="text"
                            icon="mdi-account-tie"
                            @click="viewAthleteCoaches(athlete)"
                            class="mr-2"
                          ></v-btn>
                        </template>
                      </v-tooltip>
                      
                      <v-tooltip text="View Stats" location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            size="small"
                            color="success"
                            variant="text"
                            icon="mdi-chart-line"
                            @click="viewAthleteStats(athlete)"
                          ></v-btn>
                        </template>
                      </v-tooltip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <v-progress-linear v-else indeterminate color="#800020"></v-progress-linear>
              
              <v-alert v-if="!loading && filteredAthletes.length === 0" type="info" class="mt-4">
                No athletes found.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Athlete Coaches Dialog -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card v-if="selectedAthlete">
        <v-card-title>
          <span class="text-h5">Coaches for {{ selectedAthlete.fName }} {{ selectedAthlete.lName }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-row class="mb-4">
            <v-col cols="12" md="8">
              <v-select
                v-model="selectedCoach"
                :items="availableCoaches.filter(c => !athleteCoaches.some(ac => ac.id === c.id))"
                item-title="fName"
                item-value="id"
                label="Add Coach"
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
                @click="addCoachToAthlete"
                :disabled="!selectedCoach"
                block
              >
                <v-icon left>mdi-plus</v-icon>
                Add Coach
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
              <tr v-for="coach in athleteCoaches" :key="coach.id">
                <td>{{ coach.fName }} {{ coach.lName }}</td>
                <td>{{ coach.email }}</td>
                <td>
                  <v-btn
                    size="small"
                    color="error"
                    variant="text"
                    @click="removeCoachFromAthlete(coach.id)"
                  >
                    <v-icon size="small" left>mdi-delete</v-icon>
                    Remove
                  </v-btn>
                </td>
              </tr>
              <tr v-if="athleteCoaches.length === 0">
                <td colspan="3" class="text-center text-grey py-4">No coaches assigned to this athlete</td>
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

    <!-- Athlete Stats Dialog -->
    <v-dialog v-model="statsDialog" max-width="1000px" scrollable>
      <v-card v-if="selectedAthlete && athleteStats">
        <v-card-title class="d-flex align-center">
          <span class="text-h5">Stats for {{ selectedAthlete.fName }} {{ selectedAthlete.lName }}</span>
          <v-spacer></v-spacer>
          <v-chip color="primary" class="mr-2">
            <v-icon left>mdi-run</v-icon>
            Athlete
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-tabs v-model="tab" color="#800020">
            <v-tab value="progress">Workout Progress</v-tab>
            <v-tab value="goals">Goals</v-tab>
            <v-tab value="stats">Weekly Stats</v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <!-- Progress Tab -->
            <v-window-item value="progress">
              <v-card flat class="mt-4">
                <v-card-text>
                  <v-table v-if="athleteStats.progress.length > 0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Exercise</th>
                        <th>Sets</th>
                        <th>Reps</th>
                        <th>Weight</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in athleteStats.progress" :key="index">
                        <td>{{ formatDate(item.date) }}</td>
                        <td>{{ item.exerciseName || 'N/A' }}</td>
                        <td>{{ item.sets || 'N/A' }}</td>
                        <td>{{ item.reps || 'N/A' }}</td>
                        <td>{{ item.weight ? `${item.weight} kg` : 'N/A' }}</td>
                        <td>{{ item.notes || 'No notes' }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                  <v-alert v-else type="info" class="mt-4">
                    No workout progress data available.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Goals Tab -->
            <v-window-item value="goals">
              <v-card flat class="mt-4">
                <v-card-text>
                  <v-list v-if="athleteStats.goals.length > 0">
                    <v-list-item
                      v-for="(goal, index) in athleteStats.goals"
                      :key="index"
                      :title="goal.title"
                      :subtitle="`Target: ${goal.targetValue} ${goal.unit || ''} by ${formatDate(goal.targetDate)}`"
                    >
                      <template v-slot:prepend>
                        <v-icon 
                          :color="new Date(goal.targetDate) >= new Date() ? 'success' : 'error'"
                          :icon="new Date(goal.targetDate) >= new Date() ? 'mdi-check-circle' : 'mdi-alert-circle'"
                        ></v-icon>
                      </template>
                      <template v-slot:append>
                        <v-chip 
                          :color="goal.isAchieved ? 'success' : 'grey'" 
                          text-color="white"
                          size="small"
                        >
                          {{ goal.isAchieved ? 'Achieved' : 'In Progress' }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" class="mt-4">
                    No goals set for this athlete.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Stats Tab -->
            <v-window-item value="stats">
              <v-card flat class="mt-4">
                <v-card-text>
                  <v-row v-if="Object.keys(athleteStats.weeklyStats).length > 0">
                    <v-col cols="12" md="4" v-for="(value, key) in athleteStats.weeklyStats" :key="key">
                      <v-card>
                        <v-card-title class="text-subtitle-1">
                          {{ key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') }}
                        </v-card-title>
                        <v-card-text class="text-h5 text-center">
                          {{ value }}
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                  <v-alert v-else type="info" class="mt-4">
                    No weekly statistics available.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="#800020" @click="statsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      tab: 'progress' // Default tab
    };
  }
};
</script>

<style scoped>
.v-table {
  width: 100%;
}
</style>
