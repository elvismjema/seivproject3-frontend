import apiClient from "./services.js";

const MessageServices = {
  // Start or get an existing conversation with a coach
  startConversationWithCoach: async (coachId) => {
    return apiClient.post("/api/messages/conversations", { coachId });
  },

  // Get all conversations for the current user
  getMyConversations: async () => {
    return apiClient.get("/api/messages/conversations");
  },

  // Get messages for a specific conversation
  getConversationMessages: async (conversationId) => {
    // Extract user IDs from conversationId (format: conversation_athleteId_coachId)
    const [, , coachId] = conversationId.split('_');
    return apiClient.get(`/api/messages/conversation/${coachId}`);
  },

  // Send a new message in a conversation
  sendMessage: async (conversationId, content) => {
    // Extract user IDs from conversationId (format: conversation_athleteId_coachId)
    const [, , coachId] = conversationId.split('_');
    return apiClient.post("/api/messages", {
      receiverId: coachId,
      content
    });
  },

  // Get unread message count
  getUnreadCount: async () => {
    return apiClient.get("/api/messages/unread-count");
  },

  // Legacy methods (kept for backward compatibility)
  getConversation: async (userId) => {
    return apiClient.get(`/api/messages/conversation/${userId}`);
  },

  getAllConversations: async () => {
    return this.getMyConversations();
  }
};

export default MessageServices;
