import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';
import {
  OpenCaseRequest,
  OpenCaseResponse,
  AddMessageRequest,
  AddMessageResponse,
  AddFileRequest,
  AddFileResponse,
  CloseCaseRequest,
  CloseCaseResponse,
} from '@labcapturebot/shared/types';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request logging
    this.client.interceptors.request.use((config) => {
      logger.debug('API request', {
        method: config.method,
        url: config.url,
      });
      return config;
    });

    // Response logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
        throw error;
      }
    );
  }

  async openCase(data: OpenCaseRequest): Promise<OpenCaseResponse> {
    return retryWithBackoff(async () => {
      const response = await this.client.post<OpenCaseResponse>(
        '/cases/open',
        data
      );
      return response.data;
    });
  }

  async addMessage(
    caseId: string,
    data: AddMessageRequest
  ): Promise<AddMessageResponse> {
    return retryWithBackoff(async () => {
      const response = await this.client.post<AddMessageResponse>(
        `/cases/${caseId}/message`,
        data
      );
      return response.data;
    });
  }

  async addFile(
    caseId: string,
    fileBuffer: Buffer,
    metadata: AddFileRequest
  ): Promise<AddFileResponse> {
    return retryWithBackoff(async () => {
      const formData = new FormData();

      // Create a Blob from Buffer for FormData
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, 'file');

      // Add metadata
      formData.append('file_type', metadata.file_type);
      formData.append('telegram_file_id', metadata.telegram_file_id);
      formData.append(
        'telegram_message_id',
        metadata.telegram_message_id.toString()
      );
      formData.append('telegram_user_id', metadata.telegram_user_id.toString());

      const response = await this.client.post<AddFileResponse>(
        `/cases/${caseId}/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    });
  }

  async closeCase(
    caseId: string,
    data: CloseCaseRequest
  ): Promise<CloseCaseResponse> {
    return retryWithBackoff(async () => {
      const response = await this.client.post<CloseCaseResponse>(
        `/cases/${caseId}/close`,
        data
      );
      return response.data;
    });
  }
}

export const apiClient = new ApiClient();
