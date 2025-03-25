import { AxiosError, AxiosResponse } from 'axios';

// User interface
export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  unique_id?: string;
  qr_code?: string;
  display_name?: string;
  last_seen?: string;
}

export interface Reaction {
  id: number;
  emoji: string;
  user_id: number;
  username: string;
  message_id: number;
}
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}
export interface FileAttachment {
  url: string;
  name?: string;
  type: string; 
  size?: number;
}
export interface Message {
  id: number;
  sender: User;
  content: string;
  timestamp: string;
  is_read: boolean;
  status: MessageStatus;  
  reactions: Reaction[];
  file?: FileAttachment;
  type?: string; 
}
export type MessageType = Message;

export interface Conversation {
  id: number;
  participants: User[];
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
}
export interface ApiErrorResponse {
  status: number;
  statusText: string;
  data: {
    detail?: string;
    message?: string;
  };
  headers: any;
  config: any;
}

export interface ApiError extends AxiosError {
  response?: ApiErrorResponse;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: number | string;
    username: string;
  };
}