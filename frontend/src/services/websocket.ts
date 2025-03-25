import { User } from '../types';

type MessageCallback = (message: { message: string; user_id: number }) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;

  connect(conversationId: number, userId: number | undefined) {
    // Перевіряємо наявність userId
    if (!userId) {
      console.error('No user ID provided for WebSocket connection');
      return;
    }

    this.disconnect(); // Закриваємо попереднє з'єднання, якщо воно є

    try {
      this.socket = new WebSocket(`ws://localhost:8000/ws/chat/${conversationId}/`);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.socket = null;
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.socket = null;
    }
    
    this.reconnectAttempts = 0;
  }

  sendMessage(message: string, userId: number) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected. Cannot send message.');
      return false;
    }

    try {
      this.socket.send(JSON.stringify({
        message,
        user_id: userId
      }));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();