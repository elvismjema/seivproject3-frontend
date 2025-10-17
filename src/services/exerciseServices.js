import apiClient from "./services";

export default {
  // Exercise CRUD
  getAllExercises() {
    return apiClient.get("/exercises");
  },
  getExercise(id) {
    return apiClient.get(`/exercises/${id}`);
  },
  createExercise(data) {
    return apiClient.post("/exercises", data);
  },
  updateExercise(id, data) {
    return apiClient.put(`/exercises/${id}`, data);
  },
  deleteExercise(id) {
    return apiClient.delete(`/exercises/${id}`);
  },

  // Exercise Results
  recordResult(exerciseId, data) {
    return apiClient.post(`/exercises/${exerciseId}/results`, data);
  },
  getResultsForExercise(exerciseId) {
    return apiClient.get(`/exercises/${exerciseId}/results`);
  },
  getResultsForUser(userId) {
    return apiClient.get(`/users/${userId}/results`);
  },

  // Exercise Plans
  createPlan(data) {
    return apiClient.post("/plans", data);
  },
  getPlan(id) {
    return apiClient.get(`/plans/${id}`);
  },
  updatePlan(id, data) {
    return apiClient.put(`/plans/${id}`, data);
  },
  assignPlan(athleteId, planId) {
    return apiClient.post(`/users/${athleteId}/assign-plan`, { planId });
  },
  getPlansForCoach(coachId) {
    return apiClient.get(`/coaches/${coachId}/plans`);
  },

  // Workouts
  getTodayWorkout(userId) {
    return apiClient.get(`/users/${userId}/today-workout`);
  },
  completeExercise(workoutId, exerciseId) {
    return apiClient.post(`/workouts/${workoutId}/exercises/${exerciseId}/complete`);
  }
};