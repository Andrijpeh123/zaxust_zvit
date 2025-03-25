import axios from 'axios';
import { User, Conversation, MessageType, LoginResponse } from '../types';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
// Update the interceptor to ensure the token is correctly formatted
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post(`${API_URL}/token-auth/`, { username, password });
  
  if (response.data && response.data.token) {
    // Set the default Authorization header for future requests
    api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
    
    // Get full user data
    const userResponse = await api.get('/users/search/', {
      params: { q: username }
    });
    
    if (userResponse.data && userResponse.data.length > 0) {
      const userData = userResponse.data[0];
      // Save complete user data
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }
  
  return response.data;
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users/');
  return response.data;
};

// Conversations
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get('/conversations/');
  return response.data;
};

export const getConversation = async (id: number): Promise<Conversation> => {
  const response = await api.get(`/conversations/${id}/`);
  return response.data;
};

export const startConversation = async (userIds: number[]): Promise<Conversation> => {
  const response = await api.post('/conversations/start_conversation/', { user_ids: userIds });
  return response.data;
};

// Messages
export const getMessages = async (conversationId: number): Promise<MessageType[]> => {
  const response = await api.get(`/conversations/${conversationId}/messages/`);
  return response.data;
};

// Оновлюємо існуючу функцію sendMessage замість створення нової
export const sendMessage = async (
  conversationId: number, 
  content: string,
  file?: { url: string; name?: string; type: string; size?: number }
): Promise<MessageType> => {
  const response = await api.post(`/conversations/${conversationId}/send_message/`, { 
    content,
    file 
  });
  return response.data;
};

// Add these functions to your api.ts file

// User Settings
export interface UserSettings {
  theme: string;
  notification_enabled: boolean;
  message_sound_enabled: boolean;
  language: string;
}

export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const response = await api.get('/settings/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Return default settings if there's an error
    return {
      theme: 'light',
      notification_enabled: true,
      message_sound_enabled: true,
      language: 'en'
    };
  }
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const response = await api.patch('/settings/', settings);
  return response.data;
};

export const addReaction = async (messageId: number, emoji: string) => {
  const response = await api.post(`/messages/${messageId}/reactions/`, { emoji });
  return response.data;
};

export const removeReaction = async (messageId: number, reactionId: number) => {
  try {
    console.log(`Removing reaction ${reactionId} from message ${messageId}`);
    const response = await api.delete(`/messages/${messageId}/reactions/${reactionId}/`);
    return response.data;
  } catch (error) {
    console.error('API error removing reaction:', error);
    throw error;
  }
};

export const register = async (username: string, email: string, password: string, avatar?: File) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('email', email);
  formData.append('password', password);
  
  if (avatar) {
    formData.append('avatar', avatar);
  }
  
  const response = await axios.post(`${API_URL}/register/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await api.post('/users/upload_avatar/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  // Update the user in localStorage with the new avatar URL
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  currentUser.avatar = response.data.avatar;
  localStorage.setItem('user', JSON.stringify(currentUser));
  
  return response.data;
};
// Add this function to your api.ts file if it doesn't exist
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await api.get(`/users/search/?q=${encodeURIComponent(query)}`);
  return response.data;
};


export const getUserProfile = async (): Promise<User> => {
  const response = await api.get('/users/profile/');
  return response.data;
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch('/users/profile/', userData);
  return response.data;
};

// Don't add this if it already exists
// export const uploadAvatar = async (file: File): Promise<string> => {
//   const formData = new FormData();
//   formData.append('avatar', file);
//   
//   const response = await api.post('/users/avatar/', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
//   
//   return response.data.avatar_url;
// };
// Додайте цю функцію для завантаження файлів
export const uploadFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/messages/upload-file/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Видаліть цю дублікатну функцію sendMessage
// export const sendMessage = async (
//   conversationId: number, 
//   content: string,
//   file?: { url: string; name?: string; type: string; size?: number }
// ): Promise<Message> => {
//   const response = await api.post(`/conversations/${conversationId}/messages/`, {
//     content,
//     file
//   });
//   return response.data;
// };

// Add this function to your existing API services
export const clearChat = async (conversationId: number): Promise<any> => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/clear_chat/`,
      {},
      {
        headers: {
          'Authorization': `Token ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error clearing chat:', error);
    throw error;
  }
};

// Add this function to your existing API services
export const deleteChat = async (conversationId: number): Promise<void> => {
  await api.delete(`/conversations/${conversationId}/delete_chat/`);
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/me/');
  return response.data;
};

// Додайте цю функцію до api.ts
export const markMessageAsRead = async (messageId: number): Promise<void> => {
  await api.post(`/messages/${messageId}/mark_read/`);
};

export default api;