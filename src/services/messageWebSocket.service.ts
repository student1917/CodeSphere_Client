import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '@/utils/constants';
import { STORAGE_KEYS } from '@/utils/constants';
import type { MessageResponse } from '@/types/conversation.types';

class MessageWebSocketService {
  private client: Client | null = null;
  private conversationSubscriptions: Map<number, string> = new Map();
  private messageCallbacks: Map<number, (message: MessageResponse) => void> = new Map();

  connect(userId: string, onConnect?: () => void, onError?: (error: any) => void) {
    if (this.client?.connected) {
      return;
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.error('No access token found');
      return;
    }

    const wsBaseUrl = API_BASE_URL.replace('/api/v1', '');
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
        console.log('Message WebSocket connected', frame);
        onConnect?.();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        onError?.(frame);
      },
      onWebSocketClose: () => {
        console.log('Message WebSocket closed');
      },
      onDisconnect: () => {
        console.log('Message WebSocket disconnected');
      },
    });

    this.client.activate();
  }

  subscribeToConversation(
    conversationId: number,
    callback: (message: MessageResponse) => void
  ) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const destination = `/topic/conversation/${conversationId}`;
    
    // Unsubscribe if already subscribed
    const existingSubId = this.conversationSubscriptions.get(conversationId);
    if (existingSubId) {
      this.unsubscribeFromConversation(conversationId);
    }

    console.log('Subscribing to conversation:', destination);
    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log('Received message:', data);
        callback(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    if (subscription) {
      const subId = `conv-${conversationId}-${Date.now()}`;
      this.conversationSubscriptions.set(conversationId, subId);
      this.messageCallbacks.set(conversationId, callback);
      console.log('Subscribed to conversation:', conversationId);
    }
  }

  unsubscribeFromConversation(conversationId: number) {
    const subId = this.conversationSubscriptions.get(conversationId);
    if (subId && this.client?.connected) {
      // Note: STOMP.js doesn't provide direct unsubscribe by ID, 
      // but we can track and remove from our map
      this.conversationSubscriptions.delete(conversationId);
      this.messageCallbacks.delete(conversationId);
      console.log('Unsubscribed from conversation:', conversationId);
    }
  }

  sendMessage(conversationId: number, userId: number, content?: string, imageUrl?: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      conversationId: conversationId.toString(),
      userId: userId.toString(),
      content: content || '',
      messageType: imageUrl ? 'IMAGE' : 'TEXT',
      imageUrl: imageUrl || null,
    };

    console.log('Sending message via WebSocket:', payload);
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
  }

  joinConversation(conversationId: number, userId: number) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const payload = {
      conversationId: conversationId.toString(),
      userId: userId.toString(),
    };

    this.client.publish({
      destination: '/app/chat.addUser',
      body: JSON.stringify(payload),
    });
  }

  disconnect() {
    if (this.client) {
      this.conversationSubscriptions.clear();
      this.messageCallbacks.clear();
      this.client.deactivate();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const messageWebSocketService = new MessageWebSocketService();

