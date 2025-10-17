<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Utils from '../config/utils.js';
import UserServices from '../services/userServices.js';

const router = useRouter();
const user = ref({});
const users = ref([]);
const loading = ref(false);
const search = ref('');
const roleDialog = ref(false);
const selectedUser = ref(null);
const selectedRole = ref('');

const roles = [
  { text: 'Admin', value: 'admin', icon: 'mdi-shield-crown', color: '#800020' },
  { text: 'Coach', value: 'coach', icon: 'mdi-whistle', color: '#800020' },
  { text: 'Athlete', value: 'athlete', icon: 'mdi-run', color: '#800020' }
];

onMounted(async () => {
  user.value = Utils.getStore("user");
  if (!user.value || user.value.role !== 'admin') {
    router.push({ name: 'login' });
    return;
  }
  fetchUsers();
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await UserServices.getAllUsers();
    if (response.data) {
      users.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
};

const openRoleDialog = (userItem) => {
  selectedUser.value = userItem;
  selectedRole.value = userItem.role;
  roleDialog.value = true;
};

const updateUserRole = async () => {
  if (!selectedUser.value || !selectedRole.value) return;

  try {
    await UserServices.updateUserRole(selectedUser.value.id, selectedRole.value);
    selectedUser.value.role = selectedRole.value;
    roleDialog.value = false;

    // Update the users array
    const index = users.value.findIndex(u => u.id === selectedUser.value.id);
    if (index !== -1) {
      users.value[index].role = selectedRole.value;
    }
  } catch (error) {
    console.error('Error updating role:', error);
  }
};

const getRoleColor = (role) => {
  const roleObj = roles.find(r => r.value === role);
  return roleObj ? roleObj.color : '#800020';
};

const getRoleIcon = (role) => {
  const roleObj = roles.find(r => r.value === role);
  return roleObj ? roleObj.icon : 'mdi-account';
};

const filteredUsers = computed(() => {
  if (!search.value) {
    return users.value;
  }
  const searchLower = search.value.toLowerCase();
  return users.value.filter(u =>
    u.fName?.toLowerCase().includes(searchLower) ||
    u.lName?.toLowerCase().includes(searchLower) ||
    u.email?.toLowerCase().includes(searchLower) ||
    u.role?.toLowerCase().includes(searchLower)
  );
});

const logout = () => {
  Utils.removeItem("user");
  router.push({ name: "login" });
};

const goBack = () => {
  router.push({ name: 'admin-dashboard' });
};
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- OC Branded Header -->
    <v-app-bar color="#800020" elevation="0" class="text-white">
      <v-btn icon @click="goBack" class="text-white">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title class="text-white">
        <strong>OC</strong> Exercise Tracker - User Management
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip class="ma-2" color="white" text-color="#800020">
        {{ user.fName }} {{ user.lName }} (Admin)
      </v-chip>
      <v-btn icon @click="logout" class="text-white">
        <v-icon color="white">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container>
      <v-row class="mt-5">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <h2>User Management</h2>
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search users..."
                single-line
                hide-details
                density="compact"
                style="max-width: 300px"
              ></v-text-field>
            </v-card-title>

            <v-card-text>
              <v-table v-if="!loading">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="userItem in filteredUsers" :key="userItem.id">
                    <td>{{ userItem.fName }} {{ userItem.lName }}</td>
                    <td>{{ userItem.email }}</td>
                    <td>
                      <v-chip
                        :color="getRoleColor(userItem.role)"
                        text-color="white"
                        size="small"
                      >
                        <v-icon left size="small">{{ getRoleIcon(userItem.role) }}</v-icon>
                        {{ userItem.role }}
                      </v-chip>
                    </td>
                    <td>
                      <v-btn
                        size="small"
                        color="#800020"
                        variant="text"
                        @click="openRoleDialog(userItem)"
                        :disabled="userItem.id === user.userId"
                      >
                        <v-icon size="small">mdi-account-edit</v-icon>
                        Change Role
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <v-progress-linear v-else indeterminate color="#800020"></v-progress-linear>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Role Change Dialog -->
    <v-dialog v-model="roleDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Change User Role</span>
        </v-card-title>

        <v-card-text v-if="selectedUser">
          <p class="mb-4">
            Changing role for: <strong>{{ selectedUser.fName }} {{ selectedUser.lName }}</strong>
          </p>

          <v-radio-group v-model="selectedRole" color="#800020">
            <v-radio
              v-for="role in roles"
              :key="role.value"
              :label="role.text"
              :value="role.value"
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  <v-icon :color="role.color" class="mr-2">{{ role.icon }}</v-icon>
                  {{ role.text }}
                </div>
              </template>
            </v-radio>
          </v-radio-group>

          <v-alert color="grey-lighten-3" variant="flat" class="mt-4">
            <v-icon color="#800020">mdi-information</v-icon>
            <strong>Role Descriptions:</strong>
            <ul class="mt-2">
              <li><strong>Admin:</strong> Full system access, can manage users and system settings</li>
              <li><strong>Coach:</strong> Can manage athletes, create training plans, and track progress</li>
              <li><strong>Athlete:</strong> Can view and complete workouts, track personal progress</li>
            </ul>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="roleDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="#800020"
            variant="elevated"
            class="text-white"
            @click="updateUserRole"
            :disabled="!selectedRole || selectedRole === selectedUser?.role"
          >
            Update Role
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>