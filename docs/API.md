# Documentação da API

Base URL: `http://localhost:3000/api` (desenvolvimento)

## Endpoints

### Health Check

#### GET /health

Verifica o status da API e suas dependências.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T12:00:00.000Z",
  "services": {
    "database": "connected",
    "minio": "connected"
  }
}
```

**Response 503:**
```json
{
  "status": "degraded",
  "timestamp": "2026-01-20T12:00:00.000Z",
  "services": {
    "database": "disconnected",
    "minio": "connected"
  }
}
```

---

### Cases

#### POST /cases/open

Abre um novo caso para um usuário. Se o usuário já tiver um caso aberto, ele será fechado automaticamente.

**Request:**
```json
{
  "telegram_user_id": 123456789,
  "telegram_chat_id": -1001234567890,
  "telegram_message_id": 100
}
```

**Response 201:**
```json
{
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-20T12:00:00.000Z"
}
```

---

#### POST /cases/:caseId/message

Adiciona uma mensagem de texto a um caso.

**Path Parameters:**
- `caseId` (UUID) - ID do caso

**Request:**
```json
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
```

**Response 201:**
```json
{
  "message_id": "660e8400-e29b-41d4-a716-446655440001",
  "created_at": "2026-01-20T12:01:00.000Z"
}
```

**Response 404:**
```json
{
  "error": "NOT_FOUND",
  "message": "Case not found"
}
```

**Response 409:**
```json
{
  "error": "CONFLICT",
  "message": "Case is already closed"
}
```

---

#### POST /cases/:caseId/file

Adiciona um arquivo (imagem, documento ou vídeo) a um caso.

**Path Parameters:**
- `caseId` (UUID) - ID do caso

**Request:**
```
Content-Type: multipart/form-data

Fields:
- file: <binary>
- file_type: "image" | "document" | "video"
- telegram_file_id: "AgACAgQAAxkBAAI..."
- telegram_message_id: 102
- telegram_user_id: 123456789
```

**Response 201:**
```json
{
  "file_id": "770e8400-e29b-41d4-a716-446655440002",
  "minio_url": "cases/550e8400-.../images/abc123.jpg",
  "created_at": "2026-01-20T12:02:00.000Z"
}
```

**Response 404:**
```json
{
  "error": "NOT_FOUND",
  "message": "Case not found"
}
```

**Response 409:**
```json
{
  "error": "CONFLICT",
  "message": "Case is already closed"
}
```

---

#### POST /cases/:caseId/close

Fecha um caso.

**Path Parameters:**
- `caseId` (UUID) - ID do caso

**Request:**
```json
{
  "closed_by": "user",
  "telegram_message_id": 110
}
```

`closed_by` pode ser:
- `"user"` - Fechado pelo usuário (/fim)
- `"admin"` - Fechado por admin
- `"timeout"` - Fechado automaticamente após 10 min
- `"auto"` - Fechado automaticamente ao abrir novo caso

**Response 200:**
```json
{
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "closed_at": "2026-01-20T12:05:00.000Z",
  "summary": {
    "messages_count": 5,
    "files_count": 3
  }
}
```

**Response 404:**
```json
{
  "error": "NOT_FOUND",
  "message": "Case not found"
}
```

---

#### GET /cases/active

Busca o caso ativo de um usuário.

**Query Parameters:**
- `telegram_user_id` (number) - ID do usuário no Telegram

**Request:**
```
GET /cases/active?telegram_user_id=123456789
```

**Response 200:**
```json
{
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-20T12:00:00.000Z"
}
```

**Response 404:**
```json
{
  "error": "no_active_case",
  "message": "No active case found for this user"
}
```

---

## Códigos de Status HTTP

- `200` - Success
- `201` - Created
- `400` - Bad Request (validação falhou)
- `404` - Not Found
- `409` - Conflict (caso já fechado, etc)
- `500` - Internal Server Error
- `503` - Service Unavailable (database ou MinIO offline)

## Tratamento de Erros

Todos os erros seguem o formato:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "data": {}  // Opcional, detalhes adicionais
}
```

### Erros Comuns

**Validação (400):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "data": [
    {
      "path": ["telegram_user_id"],
      "message": "Expected number, received string"
    }
  ]
}
```

**Caso não encontrado (404):**
```json
{
  "error": "NOT_FOUND",
  "message": "Case not found"
}
```

**Caso já fechado (409):**
```json
{
  "error": "CONFLICT",
  "message": "Case is already closed"
}
```

## Autenticação

Atualmente não há autenticação. A API confia nos dados enviados pelo bot.

**Futuramente**: Adicionar API key ou JWT.

## Rate Limiting

Não implementado ainda.

**Futuramente**: Limitar por `telegram_user_id`.

## Exemplos com cURL

### Abrir caso
```bash
curl -X POST http://localhost:3000/api/cases/open \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_user_id": 123456789,
    "telegram_chat_id": -1001234567890,
    "telegram_message_id": 100
  }'
```

### Adicionar mensagem
```bash
curl -X POST http://localhost:3000/api/cases/550e8400-.../message \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "teste",
    "telegram": {
      "message_id": 101,
      "user_id": 123456789,
      "chat_id": -1001234567890,
      "timestamp": 1710000000
    }
  }'
```

### Upload de arquivo
```bash
curl -X POST http://localhost:3000/api/cases/550e8400-.../file \
  -F "file=@image.jpg" \
  -F "file_type=image" \
  -F "telegram_file_id=AgACAgQAA..." \
  -F "telegram_message_id=102" \
  -F "telegram_user_id=123456789"
```

### Fechar caso
```bash
curl -X POST http://localhost:3000/api/cases/550e8400-.../close \
  -H "Content-Type: application/json" \
  -d '{
    "closed_by": "user",
    "telegram_message_id": 110
  }'
```

### Buscar caso ativo
```bash
curl "http://localhost:3000/api/cases/active?telegram_user_id=123456789"
```

## Schemas (TypeScript)

Ver código em:
- `shared/types/api.ts` - Interfaces de request/response
- `api/src/types/requests.ts` - Schemas Zod de validação
