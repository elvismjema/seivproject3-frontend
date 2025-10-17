import { createRouter, createWebHistory } from "vue-router";

import Login from "./views/Login.vue";
import Registration from "./views/Registration.vue";

// Dashboard imports
import AdminDashboard from "./views/AdminDashboard.vue";
import CoachDashboard from "./views/CoachDashboard.vue";
import AthleteDashboard from "./views/AthleteDashboard.vue";

// Admin imports
import UserManagement from "./views/UserManagement.vue";

// Exercise imports
import ExerciseManagement from "./views/ExerciseManagement.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      alias: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/registration",
      name: "registration",
      component: Registration,
    },
    // Dashboard routes
    {
      path: "/admin-dashboard",
      name: "admin-dashboard",
      component: AdminDashboard,
    },
    {
      path: "/coach-dashboard",
      name: "coach-dashboard",
      component: CoachDashboard,
    },
    {
      path: "/athlete-dashboard",
      name: "athlete-dashboard",
      component: AthleteDashboard,
    },
    // Admin routes
    {
      path: "/user-management",
      name: "user-management",
      component: UserManagement,
    },
    // Exercise routes
    {
      path: "/exercise-management",
      name: "exercise-management",
      component: ExerciseManagement,
    },
  ],
});

export default router;
