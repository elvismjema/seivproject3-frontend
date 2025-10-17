import axios from "axios";
import Utils from "../config/utils.js";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "http://localhost:3122/tracker-t2";

// Helper to get auth headers
const getAuthHeaders = () => {
  const user = Utils.getStore("user");
  if (!user || !user.token) {
    throw new Error("No authentication token found");
  }
  return {
    Authorization: `Bearer ${user.token}`
  };
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

  // Assign plan to athlete
  assignPlan: async (assignmentData) => {
    return axios.post(
      `${BASE_URL}/coach/plans/assign`,
      assignmentData,
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

  // Get recent athlete results
  getCoachRecentResults: async (limit = 20) => {
    return axios.get(
      `${BASE_URL}/coach/results/recent`,
      {
        headers: getAuthHeaders(),
        params: { limit }
      }
    );
  }
};

export default CoachServices;
