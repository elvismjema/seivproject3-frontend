import apiClient from "./services";

export default {
  // User Management
  getAllUsers() {
    return apiClient.get("/users/admin/all-users");
  },
  getUser(id) {
    return apiClient.get(`/users/${id}`);
  },
  updateUserRole(id, role) {
    return apiClient.put(`/users/${id}/role`, { role });
  },

  // Admin Dashboard Stats
  getAdminStats() {
    return apiClient.get("/users/admin/stats");
  },

  // Coach functions
  getCoachAthletes(coachId) {
    return apiClient.get(`/coaches/${coachId}/athletes`);
  },
  addAthleteToCoach(coachId, athleteId) {
    return apiClient.post(`/coaches/${coachId}/athletes`, { athleteId });
  },
  removeAthleteFromCoach(coachId, athleteId) {
    return apiClient.delete(`/coaches/${coachId}/athletes/${athleteId}`);
  },
  getCoachRecentResults(coachId) {
    return apiClient.get(`/coaches/${coachId}/recent-results`);
  },

  // Athlete functions
  getAthleteProgress(athleteId) {
    return apiClient.get(`/athletes/${athleteId}/progress`);
  },
  getAthleteGoals(athleteId) {
    return apiClient.get(`/athletes/${athleteId}/goals`);
  },
  getAthleteCoaches(athleteId) {
    return apiClient.get(`/athletes/${athleteId}/coaches`);
  },
  getWeeklyStats(athleteId) {
    return apiClient.get(`/athletes/${athleteId}/weekly-stats`);
  },

  // Goals
  createGoal(athleteId, data) {
    return apiClient.post(`/athletes/${athleteId}/goals`, data);
  },
  updateGoal(goalId, data) {
    return apiClient.put(`/goals/${goalId}`, data);
  },
  deleteGoal(goalId) {
    return apiClient.delete(`/goals/${goalId}`);
  }
};