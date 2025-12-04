import apiClient from "./services.js";

const MessageServices = {
  // Send a new message
  sendMessage: async (receiverId, content) => {
    return apiClient.post("/api/messages", {
      receiverId,
      content
    });
  },

  // Get conversation with a specific user
  getConversation: async (userId) => {
    return apiClient.get(`/api/messages/conversation/${userId}`);
  },

  // Get all conversations
  getAllConversations: async () => {
    return apiClient.get("/api/messages/conversations");
  },

  // Get unread message count
  getUnreadCount: async () => {
    return apiClient.get("/api/messages/unread-count");
  }
};

export default MessageServices;
