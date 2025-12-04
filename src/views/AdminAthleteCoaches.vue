<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import AdminServices from '../services/adminServices.js';

const route = useRoute();
const router = useRouter();
const athlete = ref({});
const coaches = ref([]);
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  const user = Utils.getStore("user");
  if (!user || user.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }
  
  await fetchAthleteCoaches();
});

const fetchAthleteCoaches = async () => {
  loading.value = true;
  error.value = '';
  try {
    const athleteId = route.params.athleteId;
    
    // For now, we'll just set some mock data since the API endpoint isn't available
    // In a real app, you would make an API call here:
    // const response = await AdminServices.getAthleteCoaches(athleteId);
    
    // Mock data for demonstration
    athlete.value = {
      id: athleteId,
      fName: 'Athlete',
      lName: 'User',
      email: 'athlete@example.com'
    };
    
    // Mock coaches data - in a real app, this would come from the API
    coaches.value = [
      {
        id: '1',
        fName: 'Coach',
        lName: 'One',
        email: 'coach1@example.com',
        phone: '(123) 456-7890',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        fName: 'Coach',
        lName: 'Two',
        email: 'coach2@example.com',
        phone: '(234) 567-8901',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Uncomment this when the API is available
    // if (response.data) {
    //   athlete.value = response.data.athlete || {};
    //   coaches.value = response.data.coaches || [];
    // }
  } catch (err) {
    console.error('Error fetching athlete coaches:', err);
    error.value = 'Coach information is not available at this time. Displaying sample data.';
    
    // Set mock data on error as fallback
    athlete.value = {
      id: route.params.athleteId,
      fName: 'Athlete',
      lName: 'User',
      email: 'athlete@example.com'
    };
    
    coaches.value = [
      {
        id: '1',
        fName: 'Sample',
        lName: 'Coach',
        email: 'coach@example.com',
        phone: '(123) 456-7890',
        createdAt: new Date().toISOString()
      }
    ];
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'admin-athletes' });
};

const logout = () => {
  Utils.removeItem("user");
  router.push({ name: "login" });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
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
        <strong>OC</strong> Exercise Tracker - Athlete Coaches
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        Admin View
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
              <h2>Coaches for {{ athlete.fName }} {{ athlete.lName }}</h2>
              <v-spacer></v-spacer>
              <v-btn 
                color="primary" 
                @click="goBack"
                prepend-icon="mdi-arrow-left"
              >
                Back to Athletes
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-alert
                v-if="error"
                type="error"
                class="mb-4"
              >
                {{ error }}
              </v-alert>

              <v-progress-linear
                v-if="loading"
                indeterminate
                color="primary"
                class="mb-4"
              ></v-progress-linear>

              <v-row v-if="!loading && coaches.length === 0">
                <v-col cols="12" class="text-center py-8">
                  <v-icon size="64" color="grey lighten-1">mdi-account-off-outline</v-icon>
                  <div class="text-h6 mt-4">No coaches assigned to this athlete</div>
                  <div class="text-body-2 text-grey">
                    This athlete is not currently assigned to any coaches.
                  </div>
                </v-col>
              </v-row>

              <v-row v-else>
                <v-col 
                  v-for="coach in coaches" 
                  :key="coach.id"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-card class="h-100 d-flex flex-column">
                    <v-card-title class="d-flex align-center">
                      <v-avatar color="primary" size="48" class="mr-3">
                        <span class="white--text text-h6">
                          {{ coach.fName?.charAt(0) }}{{ coach.lName?.charAt(0) }}
                        </span>
                      </v-avatar>
                      <div>
                        <div class="text-h6">{{ coach.fName }} {{ coach.lName }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ coach.email }}
                        </div>
                      </div>
                    </v-card-title>
                    
                    <v-divider class="mx-4"></v-divider>
                    
                    <v-card-text class="flex-grow-1">
                      <div class="d-flex align-center mb-2">
                        <v-icon color="primary" class="mr-2">mdi-email-outline</v-icon>
                        <span>{{ coach.email || 'N/A' }}</span>
                      </div>
                      <div class="d-flex align-center mb-2">
                        <v-icon color="primary" class="mr-2">mdi-phone-outline</v-icon>
                        <span>{{ coach.phone || 'N/A' }}</span>
                      </div>
                      <div class="d-flex align-center">
                        <v-icon color="primary" class="mr-2">mdi-calendar-outline</v-icon>
                        <span>Member since {{ formatDate(coach.createdAt) }}</span>
                      </div>
                    </v-card-text>
                    
                    <v-card-actions class="px-4 pb-4">
                      <v-spacer></v-spacer>
                      <v-btn
                        color="primary"
                        variant="outlined"
                        @click="$router.push(`/admin/athletes/${athlete.id}/progress`)"
                        prepend-icon="mdi-chart-line"
                      >
                        View Progress
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
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
}

.v-avatar {
  background-color: #800020 !important;
}
</style>
