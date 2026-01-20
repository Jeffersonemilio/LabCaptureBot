-- Tabela de arquivos dos casos
CREATE TABLE IF NOT EXISTS case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_type VARCHAR(20) NOT NULL,
  original_filename VARCHAR(255),
  minio_bucket VARCHAR(100) NOT NULL,
  minio_object_key VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  telegram_file_id VARCHAR(255) NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT case_files_type_check CHECK (file_type IN ('image', 'document', 'video')),
  CONSTRAINT case_files_minio_unique UNIQUE (minio_bucket, minio_object_key)
);

-- Índice para buscar arquivos de um caso
CREATE INDEX IF NOT EXISTS idx_case_files_case_id
ON case_files(case_id, created_at);

-- Índice para buscar por telegram_file_id (evitar upload duplicado)
CREATE INDEX IF NOT EXISTS idx_case_files_telegram_id
ON case_files(telegram_file_id);
