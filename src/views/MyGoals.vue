<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AthleteServices from '../services/athleteServices.js';

const router = useRouter();
const user = ref({});
const allGoals = ref([]);
const loading = ref(true);

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'athlete') {
    router.push({ name: 'login' });
    return;
  }

  try {
    const goalsResponse = await AthleteServices.getAthleteGoals();
    
    if (goalsResponse.data && goalsResponse.data.data) {
      const goalsData = goalsResponse.data.data;
      // Combine all goals (active, completed, incomplete)
      allGoals.value = [
        ...(goalsData.active || []),
        ...(goalsData.completed || []),
        ...(goalsData.incomplete || [])
      ];
    }
  } catch (err) {
    console.error('Error fetching goals:', err);
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  router.push({ name: 'athlete-dashboard' });
};

const activeGoals = computed(() => {
  return allGoals.value.filter(g => g.status === 'active');
});

const completedGoals = computed(() => {
  return allGoals.value.filter(g => g.status === 'completed');
});

const incompleteGoals = computed(() => {
  return allGoals.value.filter(g => g.status === 'incomplete');
});

const formatDeadline = (deadline) => {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' (Past due)';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days away`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success';
  if (progress >= 67) return 'success';
  if (progress >= 34) return 'warning';
  return 'error';
};

const getStatusColor = (status) => {
  if (status === 'active') return 'primary';
  if (status === 'completed') return 'success';
  if (status === 'incomplete') return 'error';
  return 'grey';
};
</script>

<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - My Goals
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Athlete)
      </v-chip>
    </v-app-bar>

    <v-container class="py-6">
      <!-- Summary Cards -->
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-card class="text-center pa-4" elevation="2">
            <div class="text-h4 font-weight-bold" style="color: #800020">
              {{ activeGoals.length }}
            </div>
            <div class="text-subtitle-1 text-grey-darken-1">Active Goals</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="text-center pa-4" elevation="2">
            <div class="text-h4 font-weight-bold text-success">
              {{ completedGoals.length }}
            </div>
            <div class="text-subtitle-1 text-grey-darken-1">Completed Goals</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="text-center pa-4" elevation="2">
            <div class="text-h4 font-weight-bold text-grey">
              {{ incompleteGoals.length }}
            </div>
            <div class="text-subtitle-1 text-grey-darken-1">Incomplete Goals</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <v-row v-if="loading">
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-progress-circular indeterminate color="#800020" size="64"></v-progress-circular>
              <div class="mt-4 text-h6">Loading your goals...</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-else-if="allGoals.length === 0">
        <v-col cols="12">
          <v-card class="text-center pa-8" elevation="2">
            <v-icon size="80" color="#800020">mdi-target</v-icon>
            <h2 class="text-h5 mt-4 mb-2">No Goals Set Yet</h2>
            <p class="text-body-1 text-grey-darken-1 mb-4">
              Your coach hasn't set any goals for you yet. Reach out to your coach to discuss setting some fitness goals!
            </p>
            <v-btn
              color="#800020"
              variant="elevated"
              class="text-white"
              @click="$router.push({ name: 'my-coaches' })"
            >
              <v-icon left>mdi-account-tie</v-icon>
              View My Coaches
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <!-- Active Goals -->
      <v-row v-else-if="activeGoals.length > 0">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h5 bg-grey-lighten-4">
              <v-icon left color="#800020">mdi-target</v-icon>
              Active Goals
            </v-card-title>
            <v-card-text class="pa-4">
              <v-row>
                <v-col cols="12" md="6" v-for="goal in activeGoals" :key="goal.id">
                  <v-card elevation="1" class="h-100">
                    <v-card-text class="pa-4">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <div>
                          <h3 class="text-h6 font-weight-bold">{{ goal.exercise?.name || 'Goal' }}</h3>
                          <span class="text-caption text-grey">
                            Target: {{ goal.targetValue }} {{ goal.targetUnit }}
                          </span>
                        </div>
                        <v-chip
                          size="small"
                          color="primary"
                          variant="flat"
                        >
                          {{ goal.status }}
                        </v-chip>
                      </div>
                      
                      <v-progress-linear
                        :model-value="goal.progress"
                        :color="getProgressColor(goal.progress)"
                        height="25"
                        rounded
                        class="mb-3"
                      >
                        <strong class="text-white">{{ Math.round(goal.progress) }}%</strong>
                      </v-progress-linear>
                      
                      <div class="d-flex justify-space-between align-center">
                        <span class="text-caption">
                          <v-icon size="small" color="#800020">mdi-calendar</v-icon>
                          {{ formatDeadline(goal.targetDate) }}
                        </span>
                        <span class="text-caption font-weight-bold" style="color: #800020">
                          {{ Math.round((goal.progress / 100) * goal.targetValue) }} / {{ goal.targetValue }}
                        </span>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Completed Goals -->
      <v-row v-if="completedGoals.length > 0" class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h5 bg-grey-lighten-4">
              <v-icon left color="success">mdi-check-circle</v-icon>
              Completed Goals
            </v-card-title>
            <v-card-text class="pa-4">
              <v-list>
                <v-list-item
                  v-for="goal in completedGoals"
                  :key="goal.id"
                  class="mb-2 border rounded"
                >
                  <template v-slot:prepend>
                    <v-avatar color="success" size="40">
                      <v-icon color="white">mdi-trophy</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold">
                    {{ goal.exercise?.name || 'Goal' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Target: {{ goal.targetValue }} {{ goal.targetUnit }}
                    <span v-if="goal.completedDate" class="ml-2">
                      • Completed: {{ new Date(goal.completedDate).toLocaleDateString() }}
                    </span>
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip color="success" size="small" variant="flat">
                      <v-icon size="small" start>mdi-check</v-icon>
                      100%
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Incomplete Goals -->
      <v-row v-if="incompleteGoals.length > 0" class="mt-4">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="text-h5 bg-grey-lighten-4">
              <v-icon left color="error">mdi-alert-circle</v-icon>
              Incomplete Goals
            </v-card-title>
            <v-card-text class="pa-4">
              <v-alert color="warning" variant="tonal" class="mb-4">
                <div class="d-flex align-center">
                  <v-icon color="warning" class="mr-2">mdi-information</v-icon>
                  <div class="text-caption">
                    These goals have passed their deadline. Don't give up! Keep working towards them or talk to your coach about setting new goals.
                  </div>
                </div>
              </v-alert>
              <v-list>
                <v-list-item
                  v-for="goal in incompleteGoals"
                  :key="goal.id"
                  class="mb-2 border rounded"
                >
                  <template v-slot:prepend>
                    <v-avatar color="error" size="40">
                      <v-icon color="white">mdi-target</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-bold">
                    {{ goal.exercise?.name || 'Goal' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Target: {{ goal.targetValue }} {{ goal.targetUnit }}
                    • Progress: {{ goal.progress }}%
                    • Deadline: {{ new Date(goal.targetDate).toLocaleDateString() }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip color="error" size="small" variant="flat">
                      Past Due
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>
