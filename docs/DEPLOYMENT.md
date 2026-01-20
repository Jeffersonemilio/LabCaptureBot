# Guia de Deploy no Railway

## Pré-requisitos

- Conta no [Railway](https://railway.app)
- Repositório Git (GitHub, GitLab, etc)
- Token do Bot Telegram

## Passos para Deploy

### 1. Criar Projeto no Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Escolha "Deploy from GitHub repo"
4. Selecione seu repositório

### 2. Adicionar PostgreSQL

1. No projeto, clique em "New"
2. Escolha "Database" → "PostgreSQL"
3. Aguarde o provisionamento
4. Copie a variável `DATABASE_URL` que foi criada

### 3. Adicionar MinIO

1. Clique em "New" → "Empty Service"
2. Nome: `minio`
3. Na aba "Settings":
   - Source: `Docker Image`
   - Docker Image: `quay.io/minio/minio`
   - Start Command: `server /data --console-address ":9001"`

4. Na aba "Variables", adicione:
```
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

5. Na aba "Networking":
   - Expor porta 9000 (API)
   - Expor porta 9001 (Console)

6. Adicione volume em "Settings" → "Volumes":
   - Mount Path: `/data`

### 4. Configurar Service da API

1. Clique em "New" → "GitHub Repo"
2. Selecione seu repositório
3. Nome: `api`

4. Na aba "Settings":
   - Root Directory: `/`
   - Dockerfile Path: `api/Dockerfile`

5. Na aba "Variables", adicione:

```bash
# Database (copie da service PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# MinIO (use hostname interno do Railway)
MINIO_ENDPOINT=${{minio.RAILWAY_PRIVATE_DOMAIN}}
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=lab-capture-cases

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
CASE_AUTO_CLOSE_MINUTES=10
```

6. Na aba "Networking":
   - Habilite "Public Networking"
   - Copie a URL gerada (ex: `https://api-production-xxxx.railway.app`)

### 5. Configurar Service do Bot

1. Clique em "New" → "GitHub Repo"
2. Selecione seu repositório
3. Nome: `bot`

4. Na aba "Settings":
   - Root Directory: `/`
   - Dockerfile Path: `bot/Dockerfile`

5. Na aba "Variables", adicione:

```bash
TELEGRAM_BOT_TOKEN=8516621330:AAHs8pnR5bbBkqJ2abi8wM27UqqzSB0B4zQ
API_BASE_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}/api
NODE_ENV=production
LOG_LEVEL=info
```

**Importante**: Use a URL pública da API que você copiou no passo anterior.

### 6. Deploy

1. Todos os services devem estar configurados
2. Railway fará deploy automaticamente
3. Ordem de inicialização:
   - PostgreSQL (primeiro)
   - MinIO
   - API (roda migrations automaticamente)
   - Bot

### 7. Verificar Deploy

1. **API Health Check**:
```bash
curl https://sua-api.railway.app/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "minio": "connected"
  }
}
```

2. **Bot**: Envie `/start` no Telegram

## Variáveis de Referência entre Services

Railway permite referenciar variáveis de outros services:

```bash
# Referência ao PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Referência ao MinIO (domínio interno)
MINIO_ENDPOINT=${{minio.RAILWAY_PRIVATE_DOMAIN}}

# Referência à API (domínio público)
API_BASE_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}/api
```

## Troubleshooting

### API não conecta ao PostgreSQL

1. Verifique se `DATABASE_URL` está configurada
2. Verifique logs: Railway Dashboard → API → "Logs"
3. Certifique-se que PostgreSQL está rodando

### API não conecta ao MinIO

1. Use `RAILWAY_PRIVATE_DOMAIN` do MinIO, não URL pública
2. Verifique se MinIO está rodando
3. Teste conectividade: adicione log no `initMinIO()`

### Bot não responde

1. Verifique token do Telegram
2. Verifique se `API_BASE_URL` está correto (deve ser URL pública)
3. Veja logs do bot
4. Teste API manualmente: `curl https://api.../api/health`

### Migrations não rodam

1. Verifique `Dockerfile` da API: deve ter `npm run migrate &&`
2. Veja logs de deploy da API
3. Rode migrations manualmente via Railway CLI:

```bash
railway run npm run migrate --workspace=api
```

### MinIO não salva arquivos

1. Verifique se volume está montado em `/data`
2. Veja logs do MinIO
3. Teste criação de bucket:

```bash
railway run npm run --workspace=api tsx -e "
import { initMinIO } from './src/config/minio';
initMinIO().then(() => console.log('OK'));
"
```

## Monitoramento

### Logs

```bash
# Railway CLI
railway logs --service=api
railway logs --service=bot
```

### Métricas

Railway Dashboard → Service → "Metrics"
- CPU usage
- Memory usage
- Network I/O

### Health Checks

Configure no Railway:
- Path: `/api/health`
- Interval: 60s

## Custos Estimados

Railway tem plano gratuito com:
- $5 de crédito/mês
- Depois: ~$5-10/mês para este projeto

**Breakdown**:
- PostgreSQL: ~$5/mês
- MinIO: ~$2/mês (com volume)
- API: ~$1/mês
- Bot: ~$1/mês

## CI/CD

Railway faz deploy automático quando você:
1. Push para branch principal
2. Merge de Pull Request

### Desabilitar Auto-deploy

Settings → "Deployments" → Disable auto-deploy

### Deploy Manual

```bash
railway up --service=api
railway up --service=bot
```

## Rollback

Railway Dashboard → Service → "Deployments"
1. Escolha deployment anterior
2. Clique em "Redeploy"

## Backup

### PostgreSQL

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

### MinIO

Railway Dashboard → MinIO → Volumes → Download

## Segurança

### Variáveis Sensíveis

- Nunca commite `.env` files
- Use Railway Variables para secrets
- Token do bot é sensível!

### Network

- API: pública (necessário para bot)
- PostgreSQL: privada (apenas interno)
- MinIO: privada (apenas interno)
- Bot: sem networking (apenas saída)

## Scaling

### Horizontal (múltiplas instâncias)

**API**: Pode escalar horizontalmente
```bash
railway scale --service=api --replicas=2
```

**Bot**: NÃO escalar (Telegram permite apenas 1 instância)

### Vertical (mais recursos)

Settings → "Resources"
- Aumentar CPU
- Aumentar RAM

## Alternativas ao Railway

- **Render**: Similar, mais barato
- **Fly.io**: Mais controle, menos abstração
- **Heroku**: Mais caro, mais recursos
- **DigitalOcean App Platform**: Bom custo-benefício

## Próximos Passos

1. Configure alertas
2. Configure backups automáticos
3. Adicione monitoring (Sentry, DataDog)
4. Configure domínio customizado (opcional)
