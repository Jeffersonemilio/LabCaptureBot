-- Tabela de casos
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by VARCHAR(20),

  CONSTRAINT cases_status_check CHECK (status IN ('open', 'closed')),
  CONSTRAINT cases_closed_by_check CHECK (closed_by IN ('user', 'admin', 'timeout', 'auto'))
);

-- Índice para buscar caso ativo de um usuário rapidamente
CREATE INDEX IF NOT EXISTS idx_telegram_user_active
ON cases(telegram_user_id, status)
WHERE status = 'open';

-- Índice para ordenar por data de criação
CREATE INDEX IF NOT EXISTS idx_cases_created_at
ON cases(created_at DESC);

-- Índice para buscar casos que precisam ser auto-fechados
CREATE INDEX IF NOT EXISTS idx_cases_auto_close
ON cases(created_at)
WHERE status = 'open';
