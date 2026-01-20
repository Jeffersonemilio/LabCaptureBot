-- Tabela de mensagens dos casos
CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  telegram_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT case_messages_type_check CHECK (type IN ('text', 'command'))
);

-- Índice para buscar mensagens de um caso
CREATE INDEX IF NOT EXISTS idx_case_messages_case_id
ON case_messages(case_id, created_at);

-- Índice para evitar duplicação de mensagens do Telegram
CREATE INDEX IF NOT EXISTS idx_case_messages_telegram_id
ON case_messages(case_id, telegram_message_id);
