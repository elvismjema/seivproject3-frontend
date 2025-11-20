    import { createRouter, createWebHistory } from "vue-router";

import Login from "./views/Login.vue";
import Registration from "./views/Registration.vue";

// Dashboard imports
import AdminDashboard from "./views/AdminDashboard.vue";
import CoachDashboard from "./views/CoachDashboard.vue";
import AthleteDashboard from "./views/AthleteDashboard.vue";

// Athlete imports
import AthleteProgress from "./views/AthleteProgress.vue";
import RecordWorkout from "./views/RecordWorkout.vue";
import WorkoutSchedule from "./views/WorkoutSchedule.vue";
import MyCoaches from "./views/MyCoaches.vue";

// Admin imports
import UserManagement from "./views/UserManagement.vue";

// Exercise imports
import ExerciseManagement from "./views/ExerciseManagement.vue";

// Coach imports
import ManagePlans from "./views/ManagePlans.vue";

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
    {
      path: "/admin-coaches",
      name: "admin-coaches",
      component: () => import("./views/AdminCoachList.vue"),
    },
    {
      path: "/admin-athletes",
      name: "admin-athletes",
      component: () => import("./views/AdminAthleteList.vue"),
    },
    // Exercise routes
    {
      path: "/exercise-management",
      name: "exercise-management",
      component: ExerciseManagement,
    },
    // Coach routes
    {
      path: "/manage-plans",
      name: "manage-plans",
      component: ManagePlans,
    },
    // Athlete routes
    {
      path: "/athlete-progress",
      name: "athlete-progress",
      component: AthleteProgress,
    },
    {
      path: "/record-workout",
      name: "record-workout",
      component: RecordWorkout,
    },
    {
      path: "/workout-schedule",
      name: "workout-schedule",
      component: WorkoutSchedule,
    },
    {
      path: "/my-coaches",
      name: "my-coaches",
      component: MyCoaches,
    },
    // Workout routes
    {
      path: "/workout-session",
      name: "workout-session",
      component: () => import("./views/WorkoutSession.vue"),
    },
    {
      path: "/record-exercise",
      name: "record-exercise",
      component: () => import("./views/RecordExercise.vue"),
    },
  ],
});

export default router;