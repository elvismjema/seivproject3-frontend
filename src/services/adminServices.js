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

const AdminServices = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    return axios.get(
      `${BASE_URL}/admin/stats`,
      { headers: getAuthHeaders() }
    );
  },

  // Plan Management
  getAllPlans: async () => {
    return axios.get(
      `${BASE_URL}/admin/plans`,
      { headers: getAuthHeaders() }
    );
  },

  createStandardPlan: async (planData) => {
    return axios.post(
      `${BASE_URL}/admin/plans`,
      planData,
      { headers: getAuthHeaders() }
    );
  },

  updatePlan: async (planId, planData) => {
    return axios.put(
      `${BASE_URL}/admin/plans/${planId}`,
      planData,
      { headers: getAuthHeaders() }
    );
  },

  deletePlan: async (planId) => {
    return axios.delete(
      `${BASE_URL}/admin/plans/${planId}`,
      { headers: getAuthHeaders() }
    );
  },

  // Coach Management
  getCoachAthletes: async (coachId) => {
    return axios.get(
      `${BASE_URL}/admin/coaches/${coachId}/athletes`,
      { headers: getAuthHeaders() }
    );
  },

  removeAthleteFromCoach: async (coachId, athleteId) => {
    return axios.delete(
      `${BASE_URL}/admin/coaches/${coachId}/athletes/${athleteId}`,
      { headers: getAuthHeaders() }
    );
  },

  // User Management (existing functionality)
  getAllUsers: async () => {
    const response = await axios.get(
      `${BASE_URL}/users/admin/all-users`,
      { headers: getAuthHeaders() }
    );
    
    // Add athleteCount to each coach
    if (response.data) {
      const coaches = response.data.filter(user => user.role === 'coach');
      for (const coach of coaches) {
        const athletesResponse = await axios.get(
          `${BASE_URL}/admin/coaches/${coach.id}/athletes`,
          { headers: getAuthHeaders() }
        );
        coach.athleteCount = athletesResponse.data?.length || 0;
      }
    }
    
    return response;
  },

  updateUserRole: async (userId, role) => {
    return axios.put(
      `${BASE_URL}/users/${userId}/role`,
      { role },
      { headers: getAuthHeaders() }
    );
  },

  deleteUser: async (userId) => {
    return axios.delete(
      `${BASE_URL}/users/${userId}`,
      { headers: getAuthHeaders() }
    );
  },

  // Exercise Management
  getAllExercises: async () => {
    return axios.get(
      `${BASE_URL}/exercises`,
      { headers: getAuthHeaders() }
    );
  },

  createExercise: async (exerciseData) => {
    return axios.post(
      `${BASE_URL}/exercises`,
      exerciseData,
      { headers: getAuthHeaders() }
    );
  },

  updateExercise: async (exerciseId, exerciseData) => {
    return axios.put(
      `${BASE_URL}/exercises/${exerciseId}`,
      exerciseData,
      { headers: getAuthHeaders() }
    );
  },

  deleteExercise: async (exerciseId) => {
    return axios.delete(
      `${BASE_URL}/exercises/${exerciseId}`,
      { headers: getAuthHeaders() }
    );
  },

  // Alias for getAllExercises to match coach services API
  getExercises: async () => {
    return axios.get(
      `${BASE_URL}/exercises`,
      { headers: getAuthHeaders() }
    );
  }
};

export default AdminServices;