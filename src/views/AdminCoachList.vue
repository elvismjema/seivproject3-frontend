<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Admin
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Admin)
      </v-chip>
      <v-btn icon @click="$router.push({ name: 'admin-dashboard' })" class="text-white">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <h1 class="text-h4">Coach List</h1>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search Coaches"
              single-line
              hide-details
              class="ml-4"
              style="max-width: 300px"
            ></v-text-field>
          </div>

          <v-card>
            <v-data-table
              :headers="headers"
              :items="coaches"
              :search="search"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'active' ? 'success' : 'error'"
                  small
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  small
                  color="primary"
                  @click="viewCoachDetails(item)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  :color="item.status === 'active' ? 'error' : 'success'"
                  @click="toggleCoachStatus(item)"
                >
                  <v-icon>{{ item.status === 'active' ? 'mdi-close' : 'mdi-check' }}</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

      <!-- Coach Details Dialog -->
      <v-dialog v-model="showDetailsDialog" max-width="700px">
        <v-card v-if="selectedCoach">
          <v-card-title>
            Coach Details
            <v-spacer></v-spacer>
            <v-btn icon @click="showDetailsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <strong>Name:</strong> {{ selectedCoach.fName }} {{ selectedCoach.lName }}
              </v-col>
              <v-col cols="12" md="6">
                <strong>Email:</strong> {{ selectedCoach.email }}
              </v-col>
              <v-col cols="12" md="6">
                <strong>Status:</strong> {{ selectedCoach.status }}
              </v-col>
              <v-col cols="12" md="6">
                <strong>Joined:</strong> {{ formatDate(selectedCoach.createdAt) }}
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <h3 class="text-h6 mb-2">Athletes</h3>
            <v-list v-if="selectedCoach.athletes && selectedCoach.athletes.length > 0">
              <v-list-item v-for="athlete in selectedCoach.athletes" :key="athlete.id">
                <v-list-item-content>
                  <v-list-item-title>{{ athlete.fName }} {{ athlete.lName }}</v-list-item-title>
                  <v-list-item-subtitle>{{ athlete.email }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" text>No athletes assigned yet.</v-alert>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import adminServices from '../services/adminServices';

const router = useRouter();
const user = ref({});
const coaches = ref([]);
const loading = ref(true);
const search = ref('');
const showDetailsDialog = ref(false);
const selectedCoach = ref(null);

const headers = [
  { title: 'First Name', key: 'fName' },
  { title: 'Last Name', key: 'lName' },
  { title: 'Email', key: 'email' },
  { title: 'Athletes', key: 'athleteCount' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
];

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }

  await loadCoaches();
});

const loadCoaches = async () => {
  try {
    loading.value = true;
    const response = await adminServices.getCoaches();
    if (response.data && response.data.data) {
      coaches.value = response.data.data.map(coach => ({
        ...coach,
        athleteCount: coach.athletes ? coach.athletes.length : 0
      }));
    }
  } catch (error) {
    console.error('Error loading coaches:', error);
  } finally {
    loading.value = false;
  }
};

const viewCoachDetails = (coach) => {
  selectedCoach.value = coach;
  showDetailsDialog.value = true;
};

const toggleCoachStatus = async (coach) => {
  try {
    const newStatus = coach.status === 'active' ? 'inactive' : 'active';
    await adminServices.updateCoachStatus(coach.id, newStatus);
    coach.status = newStatus;
  } catch (error) {
    console.error('Error updating coach status:', error);
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
</script>