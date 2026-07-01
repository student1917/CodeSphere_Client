import apiClient from './apiClient';
import { API_BASE_URL } from '@/utils/constants';
import { storage } from '@/utils/storage';
import type { DataResponse } from '@/types/common.types';

export interface RefactorCodeRequest {
  problemId: number;
  code: string;
  language: string;
  suggestions?: string[]; // Optional: chỉ refactor theo suggestions này để tối ưu token
}

export interface RefactorCodeResponse {
  refactoredCode: string;
}

export interface ChatRequest {
  message: string;
  problemId?: number;
  code?: string;
  language?: string;
  context?: 'problem' | 'general';
}

export interface ChatResponse {
  content: string;
}

export interface ReviewCodeRequest {
  problemId: number;
  code: string;
  language: string;
}

export interface ReviewCodeResponse {
  review: string; // Review content in markdown or plain text
  score?: number; // Optional score from 0-100
  suggestions?: string[]; // Optional list of suggestions
}

export const aiApi = {
  refactorCode: async (request: RefactorCodeRequest): Promise<RefactorCodeResponse> => {
    const response = await apiClient.post<DataResponse<RefactorCodeResponse>>('/ai/refactor', request);
    return response.data.data!;
  },

  reviewCode: async (request: ReviewCodeRequest): Promise<ReviewCodeResponse> => {
    const response = await apiClient.post<DataResponse<ReviewCodeResponse>>('/ai/review', request);
    return response.data.data!;
  },

  chat: async (request: ChatRequest): Promise<string> => {
    const response = await apiClient.post<DataResponse<string>>('/ai/chat', request);
    return response.data.data!;
  },

  generateStreamingResponse: async (
    input: ChatRequest,
    onChunk: (chunk: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ) => {
    try {
      console.log('🌐 Fetching AI stream from:', `${API_BASE_URL}/ai/chat/stream`);
      console.log('📤 Request payload:', input);
      
      // Get token from storage (same way as apiClient)
      const token = storage.getToken();
      console.log('🔑 Token used:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      if (!token) {
        onError('Bạn cần đăng nhập để sử dụng AI Chat');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, response.statusText);
        console.error('❌ Error text:', errorText);
        let errorMessage = 'Network response was not ok';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      console.log('✅ Response OK, starting to read stream...');

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;

      let currentEvent = '';
      let currentData = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process remaining buffer
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '') {
                // Process accumulated event
                if (currentEvent && currentData) {
                  try {
                    const data = JSON.parse(currentData);
                    if (data.content) {
                      chunkCount++;
                      console.log('📥 Final chunk #' + chunkCount + ':', data.content.substring(0, 50) + '...');
                      onChunk(data.content);
                    }
                    if (data.done) {
                      console.log('✅ SSE stream done');
                      onComplete();
                      return;
                    }
                  } catch (e) {
                    console.error('❌ Error parsing final SSE data:', e, 'Data:', currentData);
                  }
                }
                currentEvent = '';
                currentData = '';
              } else if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                currentData = line.slice(5).trim();
              }
            }
          }
          console.log('📭 Stream done, total chunks received:', chunkCount);
          onComplete();
          break;
        }

        const decoded = decoder.decode(value, { stream: true });
        console.log('📦 Raw chunk received (first 200 chars):', decoded.substring(0, 200) + (decoded.length > 200 ? '...' : ''));
        
        buffer += decoded;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        console.log('📋 Processing lines:', lines.length, 'Buffer remaining:', buffer.length);

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Skip empty lines - but process accumulated event/data first
          if (trimmedLine === '') {
            // Empty line means end of event, process it
            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);
                if (data.error) {
                  console.error('❌ Error in SSE data:', data.error);
                  onError(data.error);
                  return;
                }
                if (data.content) {
                  chunkCount++;
                  console.log('📥 Parsed chunk #' + chunkCount + ':', data.content.substring(0, 50) + '...');
                  onChunk(data.content);
                }
                if (data.done) {
                  console.log('✅ SSE stream done');
                  onComplete();
                  return;
                }
              } catch (e) {
                console.error('❌ Error parsing SSE data:', e, 'Data:', currentData);
              }
            }
            // Reset for next event
            currentEvent = '';
            currentData = '';
            continue;
          }
          
          // Parse event line (can be "event:message" or "event: message")
          if (line.startsWith('event:')) {
            const eventPart = line.slice(6); // Get everything after "event:"
            currentEvent = eventPart.trim();
            console.log('📨 SSE event type:', currentEvent);
            if (currentEvent === 'complete') {
              // Complete event - wait for data line
              continue;
            } else if (currentEvent === 'error') {
              // Error event - wait for data line
              continue;
            }
          } 
          // Parse data line (can be "data:{"content":"..."}" or "data: {"content":"..."}" or just "data:")
          else if (line.startsWith('data:')) {
            const dataPart = line.slice(5); // Get everything after "data:"
            const trimmedData = dataPart.trim();
            
            // If data is empty, it might be split - wait for next chunk
            if (trimmedData === '') {
              console.log('📄 SSE data line empty (might be split)');
              // Keep currentData as is, wait for next chunk
            } else {
              // New data line - replace currentData
              currentData = trimmedData;
              console.log('📄 SSE data received:', currentData.substring(0, 100) + (currentData.length > 100 ? '...' : ''));
            }
            
            // If we have event and data, try to process immediately
            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);
                if (data.error) {
                  console.error('❌ Error in SSE data:', data.error);
                  onError(data.error);
                  return;
                }
                if (data.content) {
                  chunkCount++;
                  console.log('📥 Parsed chunk #' + chunkCount + ':', data.content.substring(0, 50) + '...');
                  onChunk(data.content);
                  // Reset after processing
                  currentEvent = '';
                  currentData = '';
                }
                if (data.done) {
                  console.log('✅ SSE stream done');
                  onComplete();
                  return;
                }
              } catch (e) {
                // If JSON parse fails, might be incomplete - wait for more data
                console.warn('⚠️ JSON parse failed (might be incomplete):', e, 'Data:', currentData);
                // Don't reset - keep data for next chunk
              }
            }
          }
          // Handle case where data continues on next line (without "data:" prefix)
          else if (currentEvent && currentData && !line.startsWith('id:') && trimmedLine !== '') {
            // This might be continuation of JSON data that was split
            const appendedData = currentData + trimmedLine;
            console.log('📄 Appending to data (split JSON):', appendedData.substring(0, 100) + '...');
            
            try {
              const data = JSON.parse(appendedData);
              if (data.error) {
                console.error('❌ Error in SSE data:', data.error);
                onError(data.error);
                return;
              }
              if (data.content) {
                chunkCount++;
                console.log('📥 Parsed chunk #' + chunkCount + ' (from split):', data.content.substring(0, 50) + '...');
                onChunk(data.content);
                // Reset after processing
                currentEvent = '';
                currentData = '';
              }
              if (data.done) {
                console.log('✅ SSE stream done');
                onComplete();
                return;
              }
            } catch (e) {
              // Still incomplete - update currentData and wait for more
              currentData = appendedData;
              console.log('⚠️ JSON still incomplete, waiting for more data');
            }
          } 
          // Parse ID line (ignore)
          else if (line.startsWith('id:')) {
            // SSE ID, ignore
            continue;
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    }
  }
};

