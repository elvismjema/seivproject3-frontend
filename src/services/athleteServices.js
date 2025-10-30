import axios from "axios";
import Utils from "../config/utils.js";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "https://project2.eaglesoftwareteam.com/tracker-t2";

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

const AthleteServices = {
  // Record a workout
  recordWorkout: async (workoutData) => {
    return axios.post(
      `${BASE_URL}/athlete/workouts`,
      workoutData,
      { headers: getAuthHeaders() }
    );
  },

  // Get workout history
  getWorkoutHistory: async (params = {}) => {
    return axios.get(
      `${BASE_URL}/athlete/workouts/history`,
      {
        headers: getAuthHeaders(),
        params
      }
    );
  },

  // Get today's workout
  getTodayWorkout: async () => {
    return axios.get(
      `${BASE_URL}/athlete/workouts/today`,
      { headers: getAuthHeaders() }
    );
  },

  // Get weekly stats
  getWeeklyStats: async () => {
    return axios.get(
      `${BASE_URL}/athlete/stats/weekly`,
      { headers: getAuthHeaders() }
    );
  },

  // Get athlete's goals
  getAthleteGoals: async () => {
    return axios.get(
      `${BASE_URL}/athlete/goals`,
      { headers: getAuthHeaders() }
    );
  },

  // Get athlete's coaches
  getAthleteCoaches: async () => {
    return axios.get(
      `${BASE_URL}/athlete/coaches`,
      { headers: getAuthHeaders() }
    );
  },

  // Get assigned plans
  getAssignedPlans: async () => {
    return axios.get(
      `${BASE_URL}/athlete/plans`,
      { headers: getAuthHeaders() }
    );
  },

  // Get available exercises
  getAvailableExercises: async () => {
    return axios.get(
      `${BASE_URL}/athlete/exercises`,
      { headers: getAuthHeaders() }
    );
  },

  // Record a single exercise with sets
  recordExercise: async (exerciseData) => {
    return axios.post(
      `${BASE_URL}/athlete/exercises/record`,
      exerciseData,
      { headers: getAuthHeaders() }
    );
  },

  // Record a single set during a workout
  recordExerciseSet: async (setData) => {
    return axios.post(
      `${BASE_URL}/athlete/exercises/set`,
      setData,
      { headers: getAuthHeaders() }
    );
  },

  // Complete a workout session
  completeWorkout: async (workoutData) => {
    return axios.post(
      `${BASE_URL}/athlete/workouts/complete`,
      workoutData,
      { headers: getAuthHeaders() }
    );
  }
};

export default AthleteServices;
