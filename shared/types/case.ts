export interface Case {
  id: string;
  telegram_user_id: number;
  telegram_chat_id: number;
  status: 'open' | 'closed';
  created_at: Date;
  closed_at: Date | null;
  closed_by: 'user' | 'admin' | 'timeout' | 'auto' | null;
}

export interface CaseMessage {
  id: string;
  case_id: string;
  type: 'text' | 'command';
  content: string;
  telegram_message_id: number;
  telegram_user_id: number;
  created_at: Date;
}

export interface CaseFile {
  id: string;
  case_id: string;
  file_type: 'image' | 'document' | 'video';
  original_filename: string | null;
  minio_bucket: string;
  minio_object_key: string;
  file_size: number | null;
  mime_type: string | null;
  telegram_file_id: string;
  telegram_message_id: number;
  created_at: Date;
}
