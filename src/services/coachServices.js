import axios from "axios";
import Utils from "../config/utils.js";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "https://project2.eaglesoftwareteam.com/tracker-t2";

// Helper to get auth headers
const getAuthHeaders = () => {
  try {
    const user = Utils.getStore("user");
    if (!user || !user.token) {
      // Instead of throwing an error, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return {};
    }
    return {
      Authorization: `Bearer ${user.token}`
    };
  } catch (error) {
    console.error("Error getting auth headers:", error);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return {};
  }
};

const CoachServices = {
  // Get coach's athletes
  getCoachAthletes: async () => {
    return axios.get(
      `${BASE_URL}/coach/athletes`,
      { headers: getAuthHeaders() }
    );
  },

  // Add athlete to coach
  addAthlete: async (athleteData) => {
    return axios.post(
      `${BASE_URL}/coach/athletes`,
      athleteData,
      { headers: getAuthHeaders() }
    );
  },

  // Remove athlete from coach
  removeAthlete: async (athleteId) => {
    return axios.delete(
      `${BASE_URL}/coach/athletes/${athleteId}`,
      { headers: getAuthHeaders() }
    );
  },

  // Get athlete progress
  getAthleteProgress: async (athleteId, params = {}) => {
    return axios.get(
      `${BASE_URL}/coach/athletes/${athleteId}/progress`,
      {
        headers: getAuthHeaders(),
        params
      }
    );
  },

  // Create training plan
  createPlan: async (planData) => {
    return axios.post(
      `${BASE_URL}/coach/plans`,
      planData,
      { headers: getAuthHeaders() }
    );
  },

  // Get coach's plans
  getCoachPlans: async () => {
    return axios.get(
      `${BASE_URL}/coach/plans`,
      { headers: getAuthHeaders() }
    );
  },

  // Update training plan
  updatePlan: async (planId, planData) => {
    return axios.put(
      `${BASE_URL}/coach/plans/${planId}`,
      planData,
      { headers: getAuthHeaders() }
    );
  },

  // Delete training plan
  deletePlan: async (planId) => {
    return axios.delete(
      `${BASE_URL}/coach/plans/${planId}`,
      { headers: getAuthHeaders() }
    );
  },

  // Assign plan to athlete
  assignPlan: async (assignmentData) => {
    return axios.post(
      `${BASE_URL}/coach/plans/assign`,
      assignmentData,
      { headers: getAuthHeaders() }
    );
  },

  // Unassign plan from athlete
  unassignPlan: async (unassignmentData) => {
    return axios.post(
      `${BASE_URL}/coach/plans/unassign`,
      unassignmentData,
      { headers: getAuthHeaders() }
    );
  },

  // Create goal for athlete
  createGoal: async (goalData) => {
    return axios.post(
      `${BASE_URL}/coach/goals`,
      goalData,
      { headers: getAuthHeaders() }
    );
  },

  // Get coach's goals
  getCoachGoals: async () => {
    return axios.get(
      `${BASE_URL}/coach/goals`,
      { headers: getAuthHeaders() }
    );
  },

  // Delete goal
  deleteGoal: async (goalId) => {
    return axios.delete(
      `${BASE_URL}/coach/goals/${goalId}`,
      { headers: getAuthHeaders() }
    );
  },

  // Get recent athlete results
  getCoachRecentResults: async (limit = 20) => {
    return axios.get(
      `${BASE_URL}/coach/results/recent`,
      {
        headers: getAuthHeaders(),
        params: { limit }
      }
    );
  },

  // Exercise Management
  getExercises: async () => {
    return axios.get(
      `${BASE_URL}/coach/exercises`,
      { headers: getAuthHeaders() }
    );
  },

  createExercise: async (exerciseData) => {
    return axios.post(
      `${BASE_URL}/coach/exercises`,
      exerciseData,
      { headers: getAuthHeaders() }
    );
  },

  updateExercise: async (exerciseId, exerciseData) => {
    return axios.put(
      `${BASE_URL}/coach/exercises/${exerciseId}`,
      exerciseData,
      { headers: getAuthHeaders() }
    );
  },

  deleteExercise: async (exerciseId) => {
    return axios.delete(
      `${BASE_URL}/coach/exercises/${exerciseId}`,
      { headers: getAuthHeaders() }
    );
  },

  // Get custom exercises count
  getCustomExercisesCount: async () => {
    return axios.get(
      `${BASE_URL}/coach/exercises/custom/count`,
      { headers: getAuthHeaders() }
    );
  },

  // Get active goals count
  getActiveGoalsCount: async () => {
    return axios.get(
      `${BASE_URL}/coach/goals/active/count`,
      { headers: getAuthHeaders() }
    );
  },

  // Get weekly results count
  getWeeklyResultsCount: async () => {
    return axios.get(
      `${BASE_URL}/coach/results/weekly/count`,
      { headers: getAuthHeaders() }
    );
  },

  // Record workout result for athlete
  recordWorkoutResult: async (resultData) => {
    return axios.post(
      `${BASE_URL}/coach/results`,
      resultData,
      { headers: getAuthHeaders() }
    );
  }
};

export default CoachServices;
