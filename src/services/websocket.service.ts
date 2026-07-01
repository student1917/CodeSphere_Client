import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '@/utils/constants';
import { STORAGE_KEYS } from '@/utils/constants';

class WebSocketService {
  private client: Client | null = null;
  private subscribers: Map<string, (message: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string, onConnect?: () => void, onError?: (error: any) => void) {
    if (this.client?.connected) {
      return;
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.error('No access token found');
      return;
    }

    // Extract base URL (remove /api/v1) - SockJS needs HTTP/HTTPS, not ws/wss
    const wsBaseUrl = API_BASE_URL.replace('/api/v1', '');
    // SockJS không thể gửi headers trong info request, nên gửi token qua query parameter
    const wsUrl = `${wsBaseUrl}/ws?token=${encodeURIComponent(token)}`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log('STOMP:', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('WebSocket connected successfully', frame);
        this.reconnectAttempts = 0;
        onConnect?.();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        onError?.(frame);
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed');
        this.reconnect(userId, onConnect, onError);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
    });

    this.client.activate();
  }

  private reconnect(userId: string, onConnect?: () => void, onError?: (error: any) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect(userId, onConnect, onError);
      }, 5000);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(destination: string, callback: (message: any) => void): string {
    if (!this.client?.connected) {
      console.error('WebSocket not connected, cannot subscribe to:', destination);
      return '';
    }

    const subscriptionId = `${destination}-${Date.now()}`;
    
    console.log('Subscribing to:', destination);
    const subscription = this.client.subscribe(destination, (message) => {
      console.log('Received message from:', destination, message);
      try {
        const data = JSON.parse(message.body);
        console.log('Parsed notification data:', data);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, message.body);
        callback(message.body);
      }
    });

    if (subscription) {
      this.subscribers.set(subscriptionId, callback);
      console.log('Successfully subscribed to:', destination, 'subscriptionId:', subscriptionId);
      return subscriptionId;
    } else {
      console.error('Failed to create subscription for:', destination);
      return '';
    }
  }

  unsubscribe(subscriptionId: string) {
    this.subscribers.delete(subscriptionId);
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.subscribers.clear();
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const websocketService = new WebSocketService();

