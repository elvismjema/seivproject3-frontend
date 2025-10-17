<script setup>
import { useRouter } from 'vue-router';
import SocialLogin from "../components/SocialLogin.vue";

const router = useRouter();

const goToRegistration = () => {
  router.push({ name: 'registration' });
};
</script>

<template>
  <v-container fluid class="pa-0" style="min-height: 100vh; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);">
    <v-row justify="center" align="center" style="min-height: 100vh">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="8" class="pa-8">
          <div class="text-center mb-6">
            <h1 style="color: #800020; font-size: 48px; font-weight: bold;">OC</h1>
            <h2 class="text-h5 mb-2" style="color: #800020;">Exercise Tracker</h2>
            <p class="text-subtitle-1 text-grey-darken-1">Track • Train • Transform • Triumph</p>
          </div>

          <v-divider class="mb-6"></v-divider>

          <div class="text-center">
            <p class="mb-4 text-body-1">Sign in with your Oklahoma Christian account</p>
            <SocialLogin />
          </div>

          <v-divider class="my-6"></v-divider>

          <div class="text-center">
            <p class="text-body-2">
              Don't have an account?
              <v-btn variant="text" color="#800020" @click="goToRegistration">
                Sign Up
              </v-btn>
            </p>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
