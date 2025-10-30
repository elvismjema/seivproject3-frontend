<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import CoachServices from '../services/coachServices.js';

const router = useRouter();
const user = ref({});
const activeTab = ref('overview');
const athletes = ref([]);
const customExercises = ref([]);
const activeGoals = ref([]);
const weeklyResults = ref([]);
const recentResults = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'coach') {
    router.push({ name: 'login' });
    return;
  }

  // Fetch all coach data
  try {
    loading.value = true;
    const [
      athletesResponse,
      resultsResponse,
      exercisesResponse,
      goalsCountResponse,
      weeklyResultsResponse
    ] = await Promise.all([
      CoachServices.getCoachAthletes(),
      CoachServices.getCoachRecentResults(),
      CoachServices.getExercises(),
      CoachServices.getActiveGoalsCount(),
      CoachServices.getWeeklyResultsCount()
    ]);

    if (athletesResponse.data && athletesResponse.data.data) {
      athletes.value = athletesResponse.data.data;
    }
    if (resultsResponse.data && resultsResponse.data.data) {
      recentResults.value = resultsResponse.data.data;
    }
    if (exercisesResponse.data && exercisesResponse.data.data) {
      customExercises.value = exercisesResponse.data.data;
    }
    if (goalsCountResponse.data && goalsCountResponse.data.count !== undefined) {
      activeGoals.value = goalsCountResponse.data.count;
    }
    if (weeklyResultsResponse.data && weeklyResultsResponse.data.count !== undefined) {
      weeklyResults.value = weeklyResultsResponse.data.count;
    }
  } catch (err) {
    console.error('Error fetching coach data:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const logout = () => {
  Utils.removeItem("user");
  router.push({ name: "login" });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- OC Branded Header -->
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Coach
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Coach)
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
    <v-row class="mt-5">
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Welcome Coach {{ user.fName }}!</h1>
        <v-tabs
          v-model="activeTab"
          color="#800020"
          align-tabs="start"
          class="mb-6"
        >
          <v-tab value="overview">Overview</v-tab>
          <v-tab value="athletes">Athletes</v-tab>
          <v-tab value="exercises">Exercises</v-tab>
          <v-tab value="plans">Plans</v-tab>
          <v-tab value="goals">Goals</v-tab>
          <v-tab value="results">Results</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Metrics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ athletes.length }}</div>
            <div class="text-subtitle-1">My Athletes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ customExercises.length }}</div>
            <div class="text-subtitle-1">Custom Exercises</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ activeGoals.length }}</div>
            <div class="text-subtitle-1">Active Goals</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ weeklyResults.length }}</div>
            <div class="text-subtitle-1">Results This Week</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            My Athletes
            <v-spacer></v-spacer>
            <v-btn color="#800020" size="small" variant="elevated" class="text-white">
              <v-icon left>mdi-plus</v-icon>
              Add Athlete
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list v-if="athletes.length > 0">
              <v-list-item v-for="athlete in athletes" :key="athlete.id">
                <v-list-item-title>{{ athlete.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  Current Plan: {{ athlete.currentPlan || 'No plan assigned' }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn size="small" color="#800020" variant="text">View Progress</v-btn>
                  <v-btn size="small" color="#800020" variant="outlined">Assign Plan</v-btn>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else color="grey-lighten-3" variant="flat">
              <v-icon color="#800020">mdi-information</v-icon>
              No athletes yet. Click "Add Athlete" to connect with athletes.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-btn color="#800020" block class="mb-2 text-white" variant="elevated" @click="$router.push({ name: 'exercise-management' })">
                  <v-icon left>mdi-dumbbell</v-icon>
                  Manage Exercises
                </v-btn>
              </v-list-item>
              <v-list-item>
                <v-btn color="#800020" block class="mb-2" variant="tonal">
                  <v-icon left>mdi-clipboard-list</v-icon>
                  Create Plan
                </v-btn>
              </v-list-item>
              <v-list-item>
                <v-btn color="#800020" block class="mb-2" variant="outlined">
                  <v-icon left>mdi-target</v-icon>
                  Set Goal
                </v-btn>
              </v-list-item>
              <v-list-item>
                <v-btn color="#800020" block variant="outlined">
                  <v-icon left>mdi-pencil</v-icon>
                  Record Result
                </v-btn>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-3">
      <v-col cols="12">
        <v-card>
          <v-card-title>Recent Athlete Results</v-card-title>
          <v-card-text>
            <v-table v-if="recentResults.length > 0">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Exercise</th>
                  <th>Performance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in recentResults" :key="result.id">
                  <td>{{ result.athleteName }}</td>
                  <td>{{ result.exercise }}</td>
                  <td>{{ result.performance }}</td>
                  <td>{{ result.date }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-alert v-else color="grey-lighten-3" variant="flat">
              <v-icon color="#800020">mdi-information</v-icon>
              No recent results to display.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
  </v-container>
</template>