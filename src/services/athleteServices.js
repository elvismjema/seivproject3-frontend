import apiClient from "./services.js";

const AthleteServices = {
  // Record a workout
  recordWorkout: async (workoutData) => {
    return apiClient.post("/athlete/workouts", workoutData);
  },

  // Get workout history
  getWorkoutHistory: async (params = {}) => {
    return apiClient.get("/athlete/workouts/history", { params });
  },

  // Get today's workout
  getTodayWorkout: async () => {
    return apiClient.get("/athlete/workouts/today");
  },

  // Get weekly stats
  getWeeklyStats: async () => {
    return apiClient.get("/api/athlete/stats/weekly");
  },

  // Get athlete's goals
  getAthleteGoals: async () => {
    return apiClient.get("/athlete/goals");
  },

  // Get athlete's coaches
  getAthleteCoaches: async () => {
    return apiClient.get("/athlete/coaches");
  },

  // Get assigned plans
  getAssignedPlans: async () => {
    return apiClient.get("/athlete/plans");
  },

  // Get available exercises
  getAvailableExercises: async () => {
    return apiClient.get("/athlete/exercises");
  },

  // Record a single exercise with sets
  recordExercise: async (exerciseData) => {
    return apiClient.post("/athlete/exercises/record", exerciseData);
  },

  // Record a single set during a workout
  recordExerciseSet: async (setData) => {
    return apiClient.post("/athlete/exercises/set", setData);
  },

  // Complete a workout session
  completeWorkout: async (workoutData) => {
    return apiClient.post("/athlete/workouts/complete", workoutData);
  }
};

export default AthleteServices;
