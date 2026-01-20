export interface OpenCaseRequest {
  telegram_user_id: number;
  telegram_chat_id: number;
  telegram_message_id: number;
}

export interface OpenCaseResponse {
  case_id: string;
  created_at: string;
}

export interface AddMessageRequest {
  type: 'text' | 'command';
  content: string;
  telegram: {
    message_id: number;
    user_id: number;
    chat_id: number;
    timestamp: number;
  };
}

export interface AddMessageResponse {
  message_id: string;
  created_at: string;
}

export interface AddFileRequest {
  file_type: 'image' | 'document' | 'video' | 'audio' | 'voice' | 'video_note' | 'sticker';
  telegram_file_id: string;
  telegram_message_id: number;
  telegram_user_id: number;
}

export interface AddFileResponse {
  file_id: string;
  minio_url: string;
  created_at: string;
}

export interface CloseCaseRequest {
  closed_by: 'user' | 'admin' | 'timeout' | 'auto';
  telegram_message_id?: number;
}

export interface CloseCaseResponse {
  case_id: string;
  closed_at: string;
  summary: {
    messages_count: number;
    files_count: number;
  };
}

export interface GetActiveCaseResponse {
  case_id: string;
  created_at: string;
}

export interface ApiError {
  error: string;
  message?: string;
  case_id?: string;
}
