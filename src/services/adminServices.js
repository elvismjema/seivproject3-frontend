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
    ).then(response => {
      // Ensure the response has the expected structure
      if (response.data && response.data.data) {
        return response;
      }
      return { 
        ...response, 
        data: { data: response.data } 
      };
    });
  },

  // Get all coaches with their athlete counts
  getCoachesWithAthleteCounts: async () => {
    try {
      // First get all users
      const response = await axios.get(
        `${BASE_URL}/users/admin/all-users`,
        { headers: getAuthHeaders() }
      );
      
      if (!response.data) return [];
      
      // Filter coaches
      const coaches = response.data.filter(user => user.role === 'coach');
      
      // Get athlete counts for all coaches
      const countsResponse = await axios.get(
        `${BASE_URL}/admin/coaches/athlete-counts`,
        { headers: getAuthHeaders() }
      );
      
      // Map athlete counts to coaches
      return coaches.map(coach => ({
        ...coach,
        athleteCount: countsResponse.data[coach.id] || 0
      }));
    } catch (error) {
      console.error('Error fetching coaches with athlete counts:', error);
      throw error;
    }
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
  },

  // Get assigned plans for a specific athlete (admin version)
  getAssignedPlans: async (athleteId) => {
    return axios.get(
      `${BASE_URL}/admin/athletes/${athleteId}/plans`,
      { headers: getAuthHeaders() }
    );
  },
  
  // Get athlete progress (admin version)
  getAthleteProgress: async (athleteId) => {
    return axios.get(
      `${BASE_URL}/admin/athletes/${athleteId}/progress`,
      { headers: getAuthHeaders() }
    );
  },
  
  // Get athlete goals (admin version)
  getAthleteGoals: async (athleteId) => {
    return axios.get(
      `${BASE_URL}/admin/athletes/${athleteId}/goals`,
      { headers: getAuthHeaders() }
    );
  },
  
  // Get weekly stats (admin version)
  getWeeklyStats: async (athleteId) => {
    return axios.get(
      `${BASE_URL}/admin/athletes/${athleteId}/weekly-stats`,
      { headers: getAuthHeaders() }
    );
  },

  // Remove a plan from an athlete
  removeAthletePlan: async (athleteId, planId) => {
    return axios.delete(
      `${BASE_URL}/admin/athletes/${athleteId}/plans/${planId}`,
      { headers: getAuthHeaders() }
    );
  }
};

export default AdminServices;