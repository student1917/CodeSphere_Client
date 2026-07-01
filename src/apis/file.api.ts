import apiClient from './apiClient';
import type { DataResponse } from '@/types/common.types';

export interface UploadFileResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export const fileApi = {
  uploadFile: async (file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<DataResponse<UploadFileResponse>>(
      '/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data!;
  },

  uploadImage: async (file: File): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<DataResponse<UploadFileResponse>>(
      '/files/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data!;
  },
};

