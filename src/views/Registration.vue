<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import UserServices from '../services/userServices.js';
import SocialLogin from "../components/SocialLogin.vue";

const router = useRouter();
const selectedRole = ref('athlete');
const roleSelectionComplete = ref(false);

const selectRole = (role) => {
  selectedRole.value = role;
  // Store as plain string, not JSON
  window.localStorage.setItem('pendingRole', role);
  roleSelectionComplete.value = true;
};

const handleLoginSuccess = (userData) => {
  // The backend will now handle setting the role based on what was selected
  const userRole = userData.role || selectedRole.value;

  if (userRole === 'admin') {
    router.push({ name: "admin-dashboard" });
  } else if (userRole === 'coach') {
    router.push({ name: "coach-dashboard" });
  } else if (userRole === 'athlete') {
    router.push({ name: "athlete-dashboard" });
  } else {
    router.push({ name: "login" });
  }
};

const goToLogin = () => {
  router.push({ name: 'login' });
};
</script>

<template>
  <v-container fluid class="pa-0" style="min-height: 100vh; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);">
    <v-row justify="center" align="center" style="min-height: 100vh">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card elevation="8" class="pa-8">
          <!-- Header -->
          <div class="text-center mb-6">
            <h1 style="color: #800020; font-size: 48px; font-weight: bold;">OC</h1>
            <h2 class="text-h4 mb-2" style="color: #800020;">Exercise Tracker</h2>
            <p class="text-subtitle-1 text-grey-darken-1">Join our fitness community</p>
          </div>

          <v-divider class="mb-6"></v-divider>

          <!-- Step 1: Role Selection -->
          <div v-if="!roleSelectionComplete">
            <h3 class="text-center mb-6">Step 1: Choose Your Account Type</h3>

            <v-row>
              <v-col cols="12" md="6" class="pa-4">
                <v-card
                  :variant="selectedRole === 'athlete' ? 'elevated' : 'outlined'"
                  :color="selectedRole === 'athlete' ? '#800020' : 'transparent'"
                  @click="selectedRole = 'athlete'"
                  class="pa-6 text-center transition-all"
                  style="cursor: pointer; transition: all 0.3s;"
                  :elevation="selectedRole === 'athlete' ? 8 : 0"
                >
                  <v-icon
                    size="64"
                    :color="selectedRole === 'athlete' ? 'white' : '#800020'"
                    class="mb-4"
                  >
                    mdi-run
                  </v-icon>
                  <h3 :class="selectedRole === 'athlete' ? 'text-white mb-2' : 'mb-2'">
                    I'm an Athlete
                  </h3>
                  <p :class="selectedRole === 'athlete' ? 'text-white' : 'text-grey'">
                    • Track your workouts<br>
                    • Monitor progress<br>
                    • Work with coaches<br>
                    • Achieve your goals
                  </p>
                </v-card>
              </v-col>

              <v-col cols="12" md="6" class="pa-4">
                <v-card
                  :variant="selectedRole === 'coach' ? 'elevated' : 'outlined'"
                  :color="selectedRole === 'coach' ? '#800020' : 'transparent'"
                  @click="selectedRole = 'coach'"
                  class="pa-6 text-center transition-all"
                  style="cursor: pointer; transition: all 0.3s;"
                  :elevation="selectedRole === 'coach' ? 8 : 0"
                >
                  <v-icon
                    size="64"
                    :color="selectedRole === 'coach' ? 'white' : '#800020'"
                    class="mb-4"
                  >
                    mdi-whistle
                  </v-icon>
                  <h3 :class="selectedRole === 'coach' ? 'text-white mb-2' : 'mb-2'">
                    I'm a Coach
                  </h3>
                  <p :class="selectedRole === 'coach' ? 'text-white' : 'text-grey'">
                    • Manage athletes<br>
                    • Create training plans<br>
                    • Track team progress<br>
                    • Build champions
                  </p>
                </v-card>
              </v-col>
            </v-row>

            <div class="text-center mt-6">
              <v-btn
                color="#800020"
                size="large"
                variant="elevated"
                @click="selectRole(selectedRole)"
                class="text-white"
              >
                Continue as {{ selectedRole === 'athlete' ? 'Athlete' : 'Coach' }}
                <v-icon right>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- Step 2: Google Sign In -->
          <div v-else>
            <h3 class="text-center mb-4">Step 2: Sign In with Google</h3>

            <v-alert type="info" variant="tonal" class="mb-4">
              <strong>Account type selected:</strong>
              {{ selectedRole === 'athlete' ? 'Athlete' : 'Coach' }}
              <v-btn
                size="small"
                variant="text"
                @click="roleSelectionComplete = false"
                class="ml-2"
              >
                Change
              </v-btn>
            </v-alert>

            <div class="text-center">
              <p class="mb-4 text-body-1">Complete your registration with your Google account</p>
              <SocialLogin />
            </div>
          </div>

          <v-divider class="my-6"></v-divider>

          <!-- Already have account link -->
          <div class="text-center">
            <p class="text-body-2">
              Already have an account?
              <v-btn variant="text" color="#800020" @click="goToLogin">
                Sign In
              </v-btn>
            </p>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.transition-all {
  transition: all 0.3s ease;
}
</style>