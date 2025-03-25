export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Message {
  id: number;
  sender: User;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export interface Conversation {
  id: number;
  participants: User[];
  created_at: string;
  updated_at: string;
  last_message: Message | null;
}