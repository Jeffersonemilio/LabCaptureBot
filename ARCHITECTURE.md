# LabCaptureBot - Arquitetura Completa

## Stack Tecnológica

### Bot
- **Runtime**: Node.js 20+
- **Framework**: Telegraf (bot framework)
- **Language**: TypeScript
- **HTTP Client**: Axios (para chamar API)

### API
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Language**: TypeScript
- **Validação**: Zod (schema validation)
- **File Upload**: Multer (multipart/form-data)
- **Database Client**: node-postgres (pg)
- **Storage Client**: MinIO SDK

### Infraestrutura
- **Database**: PostgreSQL 15+
- **Object Storage**: MinIO (S3-compatible)
- **Deploy**: Railway
- **Testing**: Jest + Supertest

---

## Arquitetura de Deploy (Railway)

```
Railway Project: LabCaptureBot
│
├─ Service: bot
│  ├─ Dockerfile: ./bot/Dockerfile
│  ├─ ENV: TELEGRAM_BOT_TOKEN, API_URL
│  └─ Health: none (long-running process)
│
├─ Service: api
│  ├─ Dockerfile: ./api/Dockerfile
│  ├─ ENV: DATABASE_URL, MINIO_*
│  ├─ Health: GET /health
│  └─ Public: true (expõe URL)
│
├─ Service: postgres
│  ├─ Template: PostgreSQL (Railway)
│  └─ Expõe: DATABASE_URL
│
└─ Service: minio
   ├─ Template: MinIO (ou custom Docker)
   ├─ Volumes: /data (persistent)
   └─ Expõe: MINIO_ENDPOINT, ACCESS_KEY, SECRET_KEY
```

**Estrutura de Projeto (mono-repo)**
```
LabCaptureBot/
├── bot/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── api/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── shared/
│   └── types/
├── docker-compose.yml (dev local)
└── README.md
```

---

## Database Schema (PostgreSQL)

### Tabela: `cases`
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'closed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by VARCHAR(20), -- 'user', 'admin', 'timeout'

  -- Índices
  INDEX idx_telegram_user_active (telegram_user_id, status) WHERE status = 'open',
  INDEX idx_created_at (created_at DESC)
);
```

### Tabela: `case_messages`
```sql
CREATE TABLE case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'text', 'command'
  content TEXT NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  telegram_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_case_messages_case_id (case_id, created_at)
);
```

### Tabela: `case_files`
```sql
CREATE TABLE case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_type VARCHAR(20) NOT NULL, -- 'image', 'document', 'video'
  original_filename VARCHAR(255),
  minio_bucket VARCHAR(100) NOT NULL,
  minio_object_key VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  telegram_file_id VARCHAR(255) NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_case_files_case_id (case_id, created_at),
  UNIQUE (minio_bucket, minio_object_key)
);
```

---

## MinIO Storage Structure

```
Bucket: lab-capture-cases
│
└── cases/
    ├── {case_id}/
    │   ├── images/
    │   │   ├── {uuid}.jpg
    │   │   ├── {uuid}.png
    │   │   └── ...
    │   ├── documents/
    │   │   └── {uuid}.pdf
    │   └── videos/
    │       └── {uuid}.mp4
```

**Política de acesso**: Privado por padrão (autenticação via API)

---

## API Endpoints (Contrato)

### 1. Abrir Caso
```http
POST /api/cases/open
Content-Type: application/json

{
  "telegram_user_id": 123456789,
  "telegram_chat_id": -1001234567890,
  "telegram_message_id": 100
}

Response 201:
{
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-20T12:00:00Z"
}

Response 409 (já tem caso aberto):
{
  "error": "active_case_exists",
  "case_id": "existing-uuid"
}
```

### 2. Enviar Mensagem de Texto
```http
POST /api/cases/{case_id}/message
Content-Type: application/json

{
  "type": "text",
  "content": "suspeita de blast",
  "telegram": {
    "message_id": 101,
    "user_id": 123456789,
    "chat_id": -1001234567890,
    "timestamp": 1710000000
  }
}

Response 201:
{
  "message_id": "uuid",
  "created_at": "2026-01-20T12:01:00Z"
}

Response 404:
{
  "error": "case_not_found"
}
```

### 3. Enviar Arquivo (Imagem/Documento)
```http
POST /api/cases/{case_id}/file
Content-Type: multipart/form-data

Fields:
- file: <binary>
- file_type: "image" | "document" | "video"
- telegram_file_id: "AgACAgQAAxkBAAI..."
- telegram_message_id: 102
- telegram_user_id: 123456789

Response 201:
{
  "file_id": "uuid",
  "minio_url": "cases/{case_id}/images/{uuid}.jpg",
  "created_at": "2026-01-20T12:02:00Z"
}
```

### 4. Fechar Caso
```http
POST /api/cases/{case_id}/close
Content-Type: application/json

{
  "closed_by": "user",
  "telegram_message_id": 110
}

Response 200:
{
  "case_id": "uuid",
  "closed_at": "2026-01-20T12:05:00Z",
  "summary": {
    "messages_count": 5,
    "files_count": 3
  }
}
```

### 5. Buscar Caso Ativo do Usuário
```http
GET /api/cases/active?telegram_user_id=123456789

Response 200:
{
  "case_id": "uuid",
  "created_at": "2026-01-20T12:00:00Z"
}

Response 404:
{
  "error": "no_active_case"
}
```

### 6. Health Check
```http
GET /health

Response 200:
{
  "status": "ok",
  "services": {
    "database": "connected",
    "minio": "connected"
  }
}
```

---

## Fluxo Completo (Exemplo Real)

### Conversa no Telegram
```
Usuário: /caso
Usuário: [📷 imagem1.jpg]
Usuário: suspeita de blast
Usuário: [📷 imagem2.jpg]
Usuário: /fim
```

### Requisições do Bot para a API

**1️⃣ Abrir caso**
```
POST /api/cases/open
→ Response: { "case_id": "A123" }
→ Bot salva em memória: user_123456789 → A123
```

**2️⃣ Enviar imagem 1**
```
POST /api/cases/A123/file
→ Bot baixa imagem do Telegram
→ Envia para API via multipart
→ API salva em MinIO: cases/A123/images/{uuid}.jpg
→ API registra no PostgreSQL (case_files)
```

**3️⃣ Enviar texto**
```
POST /api/cases/A123/message
→ API salva no PostgreSQL (case_messages)
```

**4️⃣ Enviar imagem 2**
```
POST /api/cases/A123/file
→ Mesmo fluxo da imagem 1
```

**5️⃣ Fechar caso**
```
POST /api/cases/A123/close
→ API marca status='closed' no PostgreSQL
→ Bot remove da memória
```

---

## Variáveis de Ambiente

### Bot (.env)
```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
API_BASE_URL=https://labcapturebot-api.railway.app
NODE_ENV=production
LOG_LEVEL=info
```

### API (.env)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
MINIO_ENDPOINT=minio.railway.internal:9000
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=lab-capture-cases
PORT=3000
NODE_ENV=production
```

---

## Tratamento de Erros e Resiliência

### Bot
- **API offline**: Retorna mensagem ao usuário "Sistema temporariamente indisponível"
- **Retry**: 3 tentativas com exponential backoff (1s, 2s, 4s)
- **Timeout**: 30s por requisição
- **Mensagem sem caso ativo**: Responde "Use /caso para iniciar um novo registro"

### API
- **Database down**: Health check falha, Railway reinicia
- **MinIO down**: Retorna 503, não salva arquivo
- **Validação**: Retorna 400 com detalhes do erro (Zod)
- **Idempotência**: `telegram_message_id` como chave de deduplicação

---

## Regras de Negócio

1. **Um caso ativo por usuário**: Tentar abrir `/caso` com caso ativo retorna erro
2. **Mensagens sem caso**: Bot ignora (ou responde pedindo `/caso`)
3. **Auto-fechamento**: Casos abertos há +24h podem ser auto-fechados (job opcional)
4. **Limites**:
   - Max 50 arquivos por caso
   - Max 10MB por arquivo
   - Max 100 mensagens por caso

---

## Próximos Passos

Agora preciso saber:

1. **Credenciais Telegram**: Você já criou o bot no @BotFather?
2. **Mono-repo ou separado**: Prefere tudo em `/LabCaptureBot` ou repos separados?
3. **MinIO no Railway**: Quer que eu crie Dockerfile customizado ou usa template?
4. **Comportamento**: Se usuário envia `/caso` com caso já aberto, fecha o anterior automaticamente ou retorna erro?

Responda essas 4 perguntas e começamos a implementação! 🚀
