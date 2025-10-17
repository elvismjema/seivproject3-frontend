<script setup>
import { ref, onMounted } from "vue";
import AuthServices from "../services/authServices";
import Utils from "../config/utils.js";
import { useRouter } from "vue-router";

const router = useRouter();
const fName = ref("");
const lName = ref("");
const user = ref({});

const loginWithGoogle = () => {
  window.handleCredentialResponse = handleCredentialResponse;
  const client = import.meta.env.VITE_APP_CLIENT_ID;
  console.log(client);
  window.google.accounts.id.initialize({
    client_id: client,
    cancel_on_tap_outside: false,
    auto_select: true,
    callback: window.handleCredentialResponse,
  });
  window.google.accounts.id.renderButton(document.getElementById("parent_id"), {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signup_with",
    width: 400,
  });
};

const handleCredentialResponse = async (response) => {
  // Get the pending role from storage (set during registration)
  // Use getItem directly to avoid JSON.parse issues with plain strings
  const pendingRole = window.localStorage.getItem('pendingRole');

  let token = {
    credential: response.credential,
    role: pendingRole // Include the selected role
  };

  // Clear the pending role after using it
  if (pendingRole) {
    Utils.removeItem('pendingRole');
  }

  await AuthServices.loginUser(token)
    .then((response) => {
      user.value = response.data;
      Utils.setStore("user", user.value);
      fName.value = user.value.fName;
      lName.value = user.value.lName;

      // Route based on user role
      const userRole = user.value.role;
      if (userRole === 'admin') {
        router.push({ name: "admin-dashboard" });
      } else if (userRole === 'coach') {
        router.push({ name: "coach-dashboard" });
      } else if (userRole === 'athlete') {
        router.push({ name: "athlete-dashboard" });
      } else {
        // Fallback to login if no role
        router.push({ name: "login" });
      }
    })
    .catch((error) => {
      console.log("error", error);
    });
};

onMounted(() => {
  loginWithGoogle();
});
</script>

<template>
  <div class="signup-buttons">
    <v-row justify="center">
      <div display="flex" id="parent_id"></div>
    </v-row>
  </div>
</template>
