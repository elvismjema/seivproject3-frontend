<template>
  <v-container fluid class="pa-0">
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - Messages
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} ({{ user.role === 'coach' ? 'Coach' : 'Athlete' }})
      </v-chip>
    </v-app-bar>

    <v-container class="mt-4">
      <v-row>
        <!-- Conversation List -->
        <v-col cols="12" md="4" class="border-right">
          <v-card elevation="2" class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon left color="#800020">mdi-message-text</v-icon>
              Conversations
              <v-spacer></v-spacer>
              <v-badge
                :content="unreadCount"
                :value="unreadCount > 0"
                color="red"
                overlap
              >
                <v-btn icon @click="refreshConversations">
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </v-badge>
            </v-card-title>
            <v-divider></v-divider>
            <v-list v-if="conversations.length > 0" class="overflow-y-auto" style="max-height: 600px;">
              <v-list-item
                v-for="conversation in conversations"
                :key="conversation.otherUser.id"
                @click="selectConversation(conversation.otherUser)"
                :class="{ 'light-blue lighten-5': isActiveConversation(conversation.otherUser.id) }"
              >
                <v-list-item-avatar>
                  <v-avatar color="#800020">
                    <span class="white--text">{{ getInitials(conversation.otherUser.fName, conversation.otherUser.lName) }}</span>
                  </v-avatar>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ conversation.otherUser.fName }} {{ conversation.otherUser.lName }}
                    <v-chip
                      v-if="conversation.lastMessage && !conversation.lastMessage.isRead && conversation.lastMessage.senderId === conversation.otherUser.id"
                      x-small
                      color="red"
                      text-color="white"
                      class="ml-1"
                    >
                      New
                    </v-chip>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="conversation.lastMessage" class="text-truncate">
                    {{ conversation.lastMessage.content }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle v-if="conversation.lastMessage" class="text-caption text-grey">
                    {{ formatTimeAgo(conversation.lastMessage.createdAt) }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center text-grey">
              No conversations yet. Start a new conversation!
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Message Area -->
        <v-col cols="12" md="8">
          <v-card v-if="selectedUser" class="h-100 d-flex flex-column">
            <v-card-title class="d-flex align-center">
              <v-avatar color="#800020" class="mr-3">
                <span class="white--text">{{ getInitials(selectedUser.fName, selectedUser.lName) }}</span>
              </v-avatar>
              <div>
                <div>{{ selectedUser.fName }} {{ selectedUser.lName }}</div>
                <div class="text-caption text-grey">{{ selectedUser.email }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn icon @click="refreshMessages">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            
            <!-- Messages -->
            <div ref="messagesContainer" class="flex-grow-1 overflow-y-auto" style="height: 0; padding: 16px;">
              <template v-if="loadingMessages">
                <div class="text-center py-4">
                  <v-progress-circular indeterminate color="#800020"></v-progress-circular>
                </div>
              </template>
              <template v-else-if="messages.length === 0">
                <div class="text-center text-grey py-8">
                  No messages yet. Say hello to start the conversation!
                </div>
              </template>
              <template v-else>
                <div v-for="message in messages" :key="message.id" class="mb-4">
                  <div :class="['d-flex', message.senderId === user.id ? 'justify-end' : 'justify-start']">
                    <v-card
                      :class="['pa-3', message.senderId === user.id ? 'ml-12' : 'mr-12']"
                      :color="message.senderId === user.id ? '#800020' : 'grey lighten-3'"
                      dark
                      max-width="70%"
                      elevation="2"
                      rounded
                    >
                      <div :class="message.senderId === user.id ? 'white--text' : 'black--text'">
                        {{ message.content }}
                      </div>
                      <div class="text-right mt-1">
                        <span :class="['text-caption', message.senderId === user.id ? 'white--text' : 'grey--text']">
                          {{ formatTime(message.createdAt) }}
                        </span>
                        <v-icon v-if="message.senderId === user.id" small :color="message.isRead ? 'white' : 'grey lighten-1'" class="ml-1">
                          {{ message.isRead ? 'mdi-check-all' : 'mdi-check' }}
                        </v-icon>
                      </div>
                    </v-card>
                  </div>
                </div>
              </template>
              <div ref="messageEnd"></div>
            </div>

            <!-- Message Input -->
            <v-divider></v-divider>
            <v-card-actions class="pa-4">
              <v-text-field
                v-model="newMessage"
                outlined
                hide-details
                placeholder="Type a message..."
                @keydown.enter="sendMessage"
                :disabled="!selectedUser || sendingMessage"
                :loading="sendingMessage"
                class="mr-2"
              ></v-text-field>
              <v-btn
                color="#800020"
                dark
                :disabled="!newMessage.trim() || !selectedUser || sendingMessage"
                @click="sendMessage"
                :loading="sendingMessage"
              >
                <v-icon left>mdi-send</v-icon>
                Send
              </v-btn>
            </v-card-actions>
          </v-card>
          
          <v-card v-else class="h-100 d-flex align-center justify-center">
            <v-card-text class="text-center">
              <v-icon size="64" color="grey lighten-1" class="mb-4">mdi-forum-outline</v-icon>
              <div class="text-h6 grey--text text--darken-1">Select a conversation to start messaging</div>
              <div class="text-caption grey--text mt-2">Or start a new conversation from your contacts</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import MessageServices from '../services/messageServices.js';

const router = useRouter();
const user = ref(Utils.getStore('user') || {});
const conversations = ref([]);
const messages = ref([]);
const selectedUser = ref(null);
const newMessage = ref('');
const loadingMessages = ref(false);
const sendingMessage = ref(false);
const unreadCount = ref(0);
const messagesContainer = ref(null);
const messageEnd = ref(null);
let refreshInterval = null;

// Format time for messages
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format time ago for conversation list
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Get user initials for avatar
const getInitials = (firstName, lastName) => {
  return `${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`.toUpperCase();
};

// Check if a conversation is active
const isActiveConversation = (userId) => {
  return selectedUser.value && selectedUser.value.id === userId;
};

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (messageEnd.value) {
    messageEnd.value.scrollIntoView({ behavior: 'smooth' });
  }
};

// Load conversations
const loadConversations = async () => {
  try {
    const response = await MessageServices.getAllConversations();
    conversations.value = response.data || [];
    
    // Update unread count
    updateUnreadCount();
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
};

// Update unread count
const updateUnreadCount = async () => {
  try {
    const response = await MessageServices.getUnreadCount();
    unreadCount.value = response.data?.count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
  }
};

// Load messages for a conversation
const loadMessages = async (userId) => {
  if (!userId) return;
  
  loadingMessages.value = true;
  messages.value = [];
  
  try {
    const response = await MessageServices.getConversation(userId);
    messages.value = response.data || [];
    
    // Scroll to bottom after messages are loaded
    await nextTick();
    scrollToBottom();
    
    // Update unread count
    updateUnreadCount();
  } catch (error) {
    console.error('Error loading messages:', error);
  } finally {
    loadingMessages.value = false;
  }
};

// Select a conversation
const selectConversation = (user) => {
  selectedUser.value = user;
  loadMessages(user.id);
  
  // Update URL with conversation ID
  router.push({ name: 'coach-messaging', query: { userId: user.id } });
};

// Send a message
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedUser.value) return;
  
  const messageContent = newMessage.value.trim();
  newMessage.value = '';
  sendingMessage.value = true;
  
  try {
    await MessageServices.sendMessage(selectedUser.value.id, messageContent);
    
    // Reload messages
    await loadMessages(selectedUser.value.id);
    
    // Reload conversations to update last message
    await loadConversations();
    
    // Focus the input field again
    await nextTick();
    document.querySelector('textarea').focus();
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    sendingMessage.value = false;
  }
};

// Refresh messages
const refreshMessages = () => {
  if (selectedUser.value) {
    loadMessages(selectedUser.value.id);
  }
};

// Refresh conversations
const refreshConversations = () => {
  loadConversations();
};

// Handle back button
const goBack = () => {
  router.go(-1);
};

// Initialize
onMounted(async () => {
  // Load initial data
  await loadConversations();
  
  // Check for user ID in URL
  const userId = router.currentRoute.value.query.userId;
  if (userId) {
    // Find the user in conversations
    const conversation = conversations.value.find(c => c.otherUser.id === parseInt(userId));
    if (conversation) {
      selectConversation(conversation.otherUser);
    }
  }
  
  // Set up auto-refresh
  refreshInterval = setInterval(() => {
    if (selectedUser.value) {
      loadMessages(selectedUser.value.id);
    }
    loadConversations();
  }, 30000); // Refresh every 30 seconds
});

// Clean up
onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch for route changes
watch(() => router.currentRoute.value.query, (newQuery) => {
  if (newQuery.userId && newQuery.userId !== (selectedUser.value?.id?.toString() || '')) {
    const userId = parseInt(newQuery.userId);
    const conversation = conversations.value.find(c => c.otherUser.id === userId);
    if (conversation) {
      selectConversation(conversation.otherUser);
    }
  }
});
</script>

<style scoped>
.border-right {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.h-100 {
  height: 100%;
  min-height: calc(100vh - 120px);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
