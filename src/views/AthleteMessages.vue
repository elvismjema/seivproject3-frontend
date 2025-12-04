<template>
  <v-container fluid class="fill-height">
    <v-row class="fill-height">
      <!-- Sidebar with conversations -->
      <v-col cols="12" md="4" class="border-right">
        <v-card flat class="h-100 d-flex flex-column">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Messages</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="startNewConversation">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>

          <!-- Loading state -->
          <v-progress-linear
            v-if="loading"
            indeterminate
            color="primary"
          ></v-progress-linear>

          <!-- No conversations -->
          <div v-if="!loading && conversations.length === 0" class="text-center pa-8">
            <v-icon size="64" color="grey lighten-1" class="mb-4">mdi-message-text-outline</v-icon>
            <h3 class="text-h6 font-weight-regular mb-2">No conversations yet</h3>
            <p class="text-body-2 text--secondary mb-4">Start a conversation with your coach</p>
            <v-btn color="primary" @click="startNewConversation">
              Start a conversation
            </v-btn>
          </div>

          <!-- Conversations list -->
          <v-list v-else class="flex-grow-1 overflow-y-auto" nav>
            <v-list-item
              v-for="conversation in conversations"
              :key="conversation.id"
              :class="{ 'v-item--active': isActiveConversation(conversation.id) }"
              @click="selectConversation(conversation)"
            >
              <v-list-item-avatar>
                <v-img :src="conversation.coach.profileImage || 'https://via.placeholder.com/40'"></v-img>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ conversation.coach.fName }} {{ conversation.coach.lName }}</v-list-item-title>
                <v-list-item-subtitle class="text-truncate">
                  {{ getLastMessagePreview(conversation) }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-badge
                  v-if="getUnreadCount(conversation) > 0"
                  color="primary"
                  :content="getUnreadCount(conversation)"
                  overlap
                ></v-badge>
                <span v-else class="text-caption text--secondary">
                  {{ formatDate(conversation.lastMessageAt) }}
                </span>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Main chat area -->
      <v-col cols="12" md="8" class="d-flex flex-column" style="height: calc(100vh - 64px);">
        <v-card v-if="selectedConversation" class="flex-grow-1 d-flex flex-column">
          <!-- Chat header -->
          <v-toolbar color="white" flat>
            <v-avatar class="mr-3">
              <v-img :src="selectedConversation.coach.profileImage || 'https://via.placeholder.com/40'"></v-img>
            </v-avatar>
            <v-toolbar-title>
              {{ selectedConversation.coach.fName }} {{ selectedConversation.coach.lName }}
              <div class="text-caption text--secondary">Coach</div>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon>
              <v-icon>mdi-phone</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </v-toolbar>

          <v-divider></v-divider>

          <!-- Messages -->
          <div ref="messagesContainer" class="flex-grow-1 overflow-y-auto pa-4" style="height: 0;">
            <template v-if="loadingMessages">
              <div class="text-center pa-4">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
            </template>
            <template v-else>
              <div v-for="(message, index) in selectedConversation.messages" :key="message.id || index" 
                   class="d-flex mb-4" :class="{ 'flex-row-reverse': isCurrentUser(message.senderId) }">
                <v-avatar size="36" class="mr-2">
                  <v-img :src="getUserAvatar(message.senderId)"></v-img>
                </v-avatar>
                <div>
                  <v-card
                    :color="isCurrentUser(message.senderId) ? 'primary' : 'grey lighten-2'"
                    :class="['pa-3', isCurrentUser(message.senderId) ? 'white--text' : '']"
                    max-width="400"
                    elevation="0"
                    rounded="lg"
                  >
                    {{ message.content }}
                  </v-card>
                  <div class="text-caption text--secondary mt-1" :class="{ 'text-right': isCurrentUser(message.senderId) }">
                    {{ formatMessageTime(message.createdAt) }}
                  </div>
                </div>
              </div>
              <div v-if="selectedConversation.messages.length === 0" class="text-center pa-8">
                <v-icon size="64" color="grey lighten-2">mdi-message-text-outline</v-icon>
                <p class="text-body-1 mt-2">No messages yet</p>
                <p class="text-caption text--secondary">Send a message to start the conversation</p>
              </div>
            </template>
          </div>

          <!-- Message input -->
          <v-divider></v-divider>
          <div class="pa-3">
            <v-form @submit.prevent="sendMessage">
              <v-row align="center" no-gutters>
                <v-col>
                  <v-textarea
                    v-model="newMessage"
                    outlined
                    rows="1"
                    auto-grow
                    placeholder="Type a message..."
                    hide-details
                    class="mr-2"
                    @keydown.enter.exact.prevent="sendMessage"
                  ></v-textarea>
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    color="primary"
                    icon
                    x-large
                    :loading="sendingMessage"
                    :disabled="!newMessage.trim()"
                    @click="sendMessage"
                  >
                    <v-icon>mdi-send</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </v-card>

        <!-- No conversation selected -->
        <v-card v-else class="d-flex flex-column align-center justify-center flex-grow-1" flat>
          <v-icon size="64" color="grey lighten-1" class="mb-4">mdi-forum-outline</v-icon>
          <h3 class="text-h6 font-weight-regular mb-2">Select a conversation</h3>
          <p class="text-body-2 text--secondary mb-4">Or start a new one with your coach</p>
          <v-btn color="primary" @click="startNewConversation">
            New Conversation
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- New conversation dialog -->
    <v-dialog v-model="showNewConversationDialog" max-width="500">
      <v-card>
        <v-card-title>Start a new conversation</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedCoachId"
            :items="coaches"
            item-text="fullName"
            item-value="id"
            label="Select a coach"
            :loading="loadingCoaches"
            :disabled="loadingCoaches"
            outlined
            dense
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showNewConversationDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="createNewConversation"
            :loading="creatingConversation"
            :disabled="!selectedCoachId"
          >
            Start
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import MessageServices from '@/services/messageServices';
import CoachServices from '@/services/coachServices';
import { formatDistanceToNow, format } from 'date-fns';

export default {
  name: 'AthleteMessages',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    
    // State
    const loading = ref(true);
    const loadingMessages = ref(false);
    const sendingMessage = ref(false);
    const loadingCoaches = ref(false);
    const creatingConversation = ref(false);
    const showNewConversationDialog = ref(false);
    const selectedCoachId = ref(null);
    const newMessage = ref('');
    const messagesContainer = ref(null);
    
    // Data
    const conversations = ref([]);
    const selectedConversation = ref(null);
    const coaches = ref([]);
    
    // Get current user ID
    const currentUserId = store.getters.getUserId;
    
    // Check if a message is from the current user
    const isCurrentUser = (senderId) => {
      return senderId === currentUserId;
    };
    
    // Get user avatar
    const getUserAvatar = (userId) => {
      if (userId === currentUserId) {
        return store.getters.getUser?.profileImage || 'https://via.placeholder.com/40';
      }
      return selectedConversation.value?.coach?.profileImage || 'https://via.placeholder.com/40';
    };
    
    // Format message time
    const formatMessageTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    };
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    };
    
    // Get last message preview
    const getLastMessagePreview = (conversation) => {
      if (!conversation.messages || conversation.messages.length === 0) {
        return 'No messages yet';
      }
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const prefix = lastMessage.senderId === currentUserId ? 'You: ' : '';
      return prefix + lastMessage.content.substring(0, 30) + 
             (lastMessage.content.length > 30 ? '...' : '');
    };
    
    // Get unread message count for a conversation
    const getUnreadCount = (conversation) => {
      if (!conversation.messages) return 0;
      return conversation.messages.filter(
        msg => !msg.isRead && msg.senderId !== currentUserId
      ).length;
    };
    
    // Check if a conversation is active
    const isActiveConversation = (conversationId) => {
      return selectedConversation.value?.id === conversationId;
    };
    
    // Load conversations
    const loadConversations = async () => {
      try {
        loading.value = true;
        const response = await MessageServices.getMyConversations();
        if (response.data?.success) {
          conversations.value = response.data.data || [];
          
          // If there's a coachId in the route, try to select that conversation
          if (route.query.coachId) {
            const coachId = parseInt(route.query.coachId);
            const existingConversation = conversations.value.find(
              conv => conv.coach.id === coachId
            );
            
            if (existingConversation) {
              selectConversation(existingConversation);
            } else {
              // If no existing conversation, create a new one
              await startConversationWithCoach(coachId);
            }
          } else if (conversations.value.length > 0) {
            // Select the most recent conversation by default
            selectConversation(conversations.value[0]);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        store.dispatch('showSnackbar', {
          text: 'Failed to load conversations',
          color: 'error'
        });
      } finally {
        loading.value = false;
      }
    };
    
    // Load messages for a conversation
    const loadMessages = async (conversation) => {
      if (!conversation) return;
      
      try {
        loadingMessages.value = true;
        const response = await MessageServices.getConversationMessages(conversation.id);
        
        if (response.data?.success) {
          // Update the conversation with messages
          const updatedConversation = {
            ...conversation,
            messages: response.data.data || []
          };
          
          // Update the conversations array
          const index = conversations.value.findIndex(c => c.id === conversation.id);
          if (index !== -1) {
            conversations.value[index] = updatedConversation;
          }
          
          // Update the selected conversation
          selectedConversation.value = updatedConversation;
          
          // Scroll to bottom after messages load
          nextTick(scrollToBottom);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        store.dispatch('showSnackbar', {
          text: 'Failed to load messages',
          color: 'error'
        });
      } finally {
        loadingMessages.value = false;
      }
    };
    
    // Select a conversation
    const selectConversation = (conversation) => {
      selectedConversation.value = conversation;
      loadMessages(conversation);
      
      // Update URL
      router.push({
        name: 'AthleteMessages',
        query: { coachId: conversation.coach.id }
      }).catch(() => {});
    };
    
    // Send a message
    const sendMessage = async () => {
      if (!newMessage.value.trim() || !selectedConversation.value) return;
      
      const messageContent = newMessage.value.trim();
      newMessage.value = '';
      
      try {
        sendingMessage.value = true;
        
        // Optimistically add the message to the UI
        const tempMessage = {
          id: 'temp-' + Date.now(),
          content: messageContent,
          senderId: currentUserId,
          receiverId: selectedConversation.value.coach.id,
          createdAt: new Date().toISOString(),
          isRead: true
        };
        
        // Add to selected conversation
        selectedConversation.value.messages.push(tempMessage);
        
        // Scroll to bottom
        nextTick(scrollToBottom);
        
        // Send to server
        const response = await MessageServices.sendMessage(
          selectedConversation.value.id,
          messageContent
        );
        
        if (response.data?.success) {
          // Replace the temp message with the server response
          const index = selectedConversation.value.messages.findIndex(
            m => m.id === tempMessage.id
          );
          
          if (index !== -1) {
            selectedConversation.value.messages[index] = response.data.data;
          } else {
            selectedConversation.value.messages.push(response.data.data);
          }
          
          // Update the last message in the conversations list
          updateConversationLastMessage(selectedConversation.value.id, {
            content: messageContent,
            createdAt: new Date().toISOString()
          });
          
          // Scroll to bottom again in case the message was replaced
          nextTick(scrollToBottom);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        store.dispatch('showSnackbar', {
          text: 'Failed to send message',
          color: 'error'
        });
      } finally {
        sendingMessage.value = false;
      }
    };
    
    // Update last message in conversations list
    const updateConversationLastMessage = (conversationId, message) => {
      const index = conversations.value.findIndex(c => c.id === conversationId);
      if (index !== -1) {
        const updatedConversation = {
          ...conversations.value[index],
          lastMessageAt: message.createdAt,
          lastMessage: message.content
        };
        conversations.value.splice(index, 1); // Remove old
        conversations.value.unshift(updatedConversation); // Add to top
      }
    };
    
    // Scroll to bottom of messages
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // Start a new conversation with a coach
    const startNewConversation = async (coachId = null) => {
      if (coachId) {
        // If coachId is provided, start conversation directly
        await startConversationWithCoach(coachId);
      } else {
        // Otherwise, show the coach selection dialog
        loadCoaches();
        showNewConversationDialog.value = true;
      }
    };
    
    // Load available coaches
    const loadCoaches = async () => {
      try {
        loadingCoaches.value = true;
        const response = await CoachServices.getMyCoaches();
        if (response.data?.success) {
          coaches.value = response.data.data || [];
          
          // Set the first coach as selected by default if none selected
          if (coaches.value.length > 0 && !selectedCoachId.value) {
            selectedCoachId.value = coaches.value[0].id;
          }
        }
      } catch (error) {
        console.error('Error loading coaches:', error);
        store.dispatch('showSnackbar', {
          text: 'Failed to load coaches',
          color: 'error'
        });
      } finally {
        loadingCoaches.value = false;
      }
    };
    
    // Create a new conversation with the selected coach
    const createNewConversation = async () => {
      if (!selectedCoachId.value) return;
      
      try {
        creatingConversation.value = true;
        await startConversationWithCoach(selectedCoachId.value);
        showNewConversationDialog.value = false;
      } catch (error) {
        console.error('Error creating conversation:', error);
        store.dispatch('showSnackbar', {
          text: 'Failed to start conversation',
          color: 'error'
        });
      } finally {
        creatingConversation.value = false;
      }
    };
    
    // Start or get a conversation with a coach
    const startConversationWithCoach = async (coachId) => {
      try {
        const response = await MessageServices.startConversationWithCoach(coachId);
        
        if (response.data?.success) {
          const conversation = response.data.data;
          
          // Check if this conversation already exists in the list
          const existingIndex = conversations.value.findIndex(
            c => c.id === conversation.id
          );
          
          if (existingIndex !== -1) {
            // Update existing conversation
            conversations.value[existingIndex] = conversation;
          } else {
            // Add new conversation to the top of the list
            conversations.value.unshift(conversation);
          }
          
          // Select the conversation
          selectConversation(conversation);
          
          return conversation;
        }
      } catch (error) {
        console.error('Error starting conversation:', error);
        store.dispatch('showSnackbar', {
          text: error.response?.data?.message || 'Failed to start conversation',
          color: 'error'
        });
        throw error;
      }
    };
    
    // Initialize
    onMounted(() => {
      loadConversations();
      
      // Set up a timer to refresh conversations periodically
      const refreshInterval = setInterval(loadConversations, 30000); // Every 30 seconds
      
      // Clean up interval on component unmount
      return () => clearInterval(refreshInterval);
    });
    
    // Watch for route changes
    watch(() => route.query.coachId, (newCoachId) => {
      if (newCoachId) {
        const coachId = parseInt(newCoachId);
        const existingConversation = conversations.value.find(
          conv => conv.coach.id === coachId
        );
        
        if (existingConversation) {
          selectConversation(existingConversation);
        }
      }
    });
    
    return {
      // State
      loading,
      loadingMessages,
      sendingMessage,
      loadingCoaches,
      creatingConversation,
      showNewConversationDialog,
      selectedCoachId,
      newMessage,
      messagesContainer,
      
      // Data
      conversations,
      selectedConversation,
      coaches,
      
      // Methods
      isCurrentUser,
      getUserAvatar,
      formatMessageTime,
      formatDate,
      getLastMessagePreview,
      getUnreadCount,
      isActiveConversation,
      selectConversation,
      sendMessage,
      startNewConversation,
      createNewConversation,
      scrollToBottom
    };
  }
};
</script>

<style scoped>
.border-right {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.h-100 {
  height: 100%;
}

.flex-grow-1 {
  flex-grow: 1;
}

.overflow-y-auto {
  overflow-y: auto;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Message bubbles */
.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.08) !important;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .border-right {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }
  
  .h-100 {
    max-height: 40vh;
  }
}
</style>
