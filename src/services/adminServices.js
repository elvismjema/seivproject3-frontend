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

const adminServices = {
  // User management
  getAllUsers: async () => {
    return axios.get(
      `${BASE_URL}/admin/all-users`,
      { headers: getAuthHeaders() }
    );
  },

  // Coach management
  getCoaches: async () => {
    return getAllUsers().then(response => {
      if (response.data) {
        return {
          data: {
            data: response.data.filter(user => user.role === 'coach')
          }
        };
      }
      return response;
    });
  },

  getCoachDetails: async (coachId) => {
    return getAllUsers().then(response => {
      if (response.data) {
        const coach = response.data.find(user => user.id === coachId && user.role === 'coach');
        return {
          data: { data: coach }
        };
      }
      return response;
    });
  },

  updateUserRole: async (userId, role) => {
    return axios.patch(
      `${BASE_URL}/admin/user/${userId}/role`,
      { role },
      { headers: getAuthHeaders() }
    );
  },

  // Athlete management
  getAthletes: async () => {
    return getAllUsers().then(response => {
      if (response.data) {
        return {
          data: {
            data: response.data.filter(user => user.role === 'athlete')
          }
        };
      }
      return response;
    });
  },

  getAthleteDetails: async (athleteId) => {
    return getAllUsers().then(response => {
      if (response.data) {
        const athlete = response.data.find(user => user.id === athleteId && user.role === 'athlete');
        return {
          data: { data: athlete }
        };
      }
      return response;
    });
  },

  // Dashboard statistics
  getDashboardStats: async () => {
    return axios.get(
      `${BASE_URL}/admin/stats`,
      { headers: getAuthHeaders() }
    );
  }
};

export default adminServices;