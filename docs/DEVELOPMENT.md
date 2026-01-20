# Guia de Desenvolvimento

## Setup Local

### 1. Instalar Dependências do Sistema

```bash
# Node.js 20+
nvm install 20
nvm use 20

# PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# MinIO (via Docker)
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v ~/minio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

### 2. Criar Banco de Dados

```bash
createdb labcapture
```

### 3. Instalar Dependências do Projeto

```bash
npm install
```

### 4. Configurar Variáveis de Ambiente

Copie os arquivos `.env.example` e preencha:

```bash
cp bot/.env.example bot/.env
cp api/.env.example api/.env
```

Edite `bot/.env`:
```bash
TELEGRAM_BOT_TOKEN=SEU_TOKEN_AQUI
API_BASE_URL=http://localhost:3000/api
```

Edite `api/.env`:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/labcapture
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
```

### 5. Rodar Migrations

```bash
npm run migrate --workspace=api
```

### 6. Iniciar Serviços

Terminal 1 (API):
```bash
npm run dev:api
```

Terminal 2 (Bot):
```bash
npm run dev:bot
```

## Estrutura de Código

### Bot

```
bot/src/
├── config/           # Configurações e env vars
├── handlers/         # Handlers do Telegraf
│   ├── commandHandler.ts  # /caso, /fim, /start
│   ├── messageHandler.ts  # Mensagens de texto
│   └── mediaHandler.ts    # Fotos, vídeos, docs
├── services/
│   ├── apiClient.ts       # Cliente HTTP para API
│   └── caseManager.ts     # Gerencia casos ativos
├── types/            # Tipos TypeScript
├── utils/            # Utilitários (logger, retry)
├── bot.ts            # Configuração do Telegraf
└── index.ts          # Entry point
```

### API

```
api/src/
├── config/           # Configurações
│   ├── env.ts        # Validação de env vars
│   ├── database.ts   # Pool PostgreSQL
│   └── minio.ts      # Cliente MinIO
├── controllers/      # Controllers Express
├── middleware/       # Middlewares (error, validation, upload)
├── routes/           # Definição de rotas
├── services/         # Lógica de negócio
│   ├── caseService.ts      # Gerencia casos
│   ├── databaseService.ts  # Queries PostgreSQL
│   └── storageService.ts   # Upload MinIO
├── types/            # Tipos de request/response
├── utils/            # Utilitários
├── app.ts            # Express app
└── index.ts          # Entry point
```

## Boas Práticas

### 1. Logging

Use o logger estruturado:

```typescript
import { logger } from './utils/logger';

logger.info('Mensagem informativa', { userId, caseId });
logger.error('Erro ocorrido', { error });
logger.debug('Debug info', { data });
```

### 2. Tratamento de Erros

Use as classes de erro customizadas:

```typescript
import { NotFoundError, ConflictError } from './utils/errors';

throw new NotFoundError('Case not found');
throw new ConflictError('Case already exists');
```

### 3. Validação

Use Zod para validar dados:

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

const data = schema.parse(input);
```

### 4. Async/Await

Sempre use try/catch com async:

```typescript
try {
  const result = await someAsyncFunction();
} catch (error) {
  logger.error('Failed', { error });
  throw error;
}
```

## Testes

### Estrutura de Testes

```
api/__tests__/
├── integration/      # Testes E2E das rotas
└── services/         # Testes unitários dos services

bot/__tests__/
├── handlers/         # Testes dos handlers
└── services/         # Testes dos services
```

### Rodar Testes

```bash
# Todos os testes
npm test

# Apenas API
npm test --workspace=api

# Apenas Bot
npm test --workspace=bot

# Watch mode
npm run test:watch --workspace=api
```

### Exemplo de Teste

```typescript
import { caseService } from '../src/services/caseService';

describe('CaseService', () => {
  it('should open a new case', async () => {
    const result = await caseService.openCase(123, -100);

    expect(result).toHaveProperty('case_id');
    expect(result).toHaveProperty('created_at');
  });
});
```

## Debug

### VS Code Launch Config

Crie `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:api"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Bot",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:bot"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Logs Detalhados

```bash
LOG_LEVEL=debug npm run dev:api
LOG_LEVEL=debug npm run dev:bot
```

## Migrations

### Criar Nova Migration

1. Crie arquivo em `api/migrations/00X_description.sql`
2. Adicione ao array em `api/src/migrations/run-migrations.ts`
3. Rode: `npm run migrate --workspace=api`

### Exemplo de Migration

```sql
-- 004_add_index.sql
CREATE INDEX idx_example ON cases(field_name);
```

## MinIO Console

Acesse: http://localhost:9001

- User: `minioadmin`
- Password: `minioadmin`

## PostgreSQL

### Acessar via psql

```bash
psql labcapture
```

### Queries Úteis

```sql
-- Ver casos abertos
SELECT * FROM cases WHERE status = 'open';

-- Ver mensagens de um caso
SELECT * FROM case_messages WHERE case_id = 'uuid-aqui';

-- Ver arquivos de um caso
SELECT * FROM case_files WHERE case_id = 'uuid-aqui';

-- Limpar tudo (cuidado!)
TRUNCATE cases CASCADE;
```

## Troubleshooting

### Erro: "Cannot find module '@labcapturebot/shared'"

```bash
npm install
```

### Erro: "relation 'cases' does not exist"

```bash
npm run migrate --workspace=api
```

### Bot não recebe mensagens

1. Verifique o token
2. Pare outros bots usando o mesmo token
3. Use: `https://api.telegram.org/bot<TOKEN>/getMe`

### API não conecta ao MinIO

1. Verifique se o container está rodando: `docker ps`
2. Verifique as credenciais
3. Teste: `curl http://localhost:9000/minio/health/live`
