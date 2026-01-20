# Railway - Guia de Troubleshooting

## Erro: "failed to compute cache key: /bot not found"

### Sintoma

Ao fazer deploy no Railway, você vê este erro nos logs:

```
ERROR: failed to build: failed to solve: failed to compute cache key:
failed to calculate checksum of ref: "/bot": not found
```

ou

```
ERROR: failed to build: failed to solve: failed to compute cache key:
failed to calculate checksum of ref: "/api": not found
```

### Causa

O Railway está usando um contexto de build incorreto para os Dockerfiles. Como o projeto é um **mono-repo** (bot + api + shared), os Dockerfiles precisam ter acesso à raiz do projeto para copiar as pastas `shared/`, `bot/` e `api/`.

Quando o **Root Directory** está configurado como `bot/` ou `api/`, o contexto do Docker fica limitado apenas a essa pasta, impedindo o acesso às outras.

### ✅ Solução

Para **AMBOS** os services (bot e api):

#### 1. Service do BOT

1. Acesse o Railway
2. Clique no service **bot**
3. Vá em **Settings** → **Source**
4. Configure:
   - **Root Directory**: deixe **VAZIO** (delete se houver algo)
   - **Dockerfile Path**: `bot/Dockerfile`
5. Clique em **Save**
6. Faça **Redeploy**

#### 2. Service da API

1. Clique no service **api**
2. Vá em **Settings** → **Source**
3. Configure:
   - **Root Directory**: deixe **VAZIO** (delete se houver algo)
   - **Dockerfile Path**: `api/Dockerfile`
4. Clique em **Save**
5. Faça **Redeploy**

### Por que isso funciona?

```
❌ CONFIGURAÇÃO ERRADA:
Root Directory: bot/
Dockerfile Path: Dockerfile
Contexto de build: /bot/
Resultado: Não encontra ../shared/ ❌

✅ CONFIGURAÇÃO CORRETA:
Root Directory: (vazio) ou /
Dockerfile Path: bot/Dockerfile
Contexto de build: / (raiz do projeto)
Resultado: Encontra shared/, bot/, api/ ✅
```

### Verificação

Após o redeploy, você deve ver nos logs:

```bash
✅ COPY package*.json ./
✅ COPY shared/package.json ./shared/
✅ COPY bot/package.json ./bot/
✅ RUN npm ci --workspace=bot --workspace=shared
✅ COPY shared/ ./shared/
✅ COPY bot/ ./bot/
✅ RUN npm run build --workspace=bot
✅ Successfully built
```

---

## Outros Problemas Comuns

### Build funciona mas API não conecta ao PostgreSQL

**Sintoma**: API inicia mas falha ao conectar no banco

**Solução**:
1. Verifique a variável `DATABASE_URL` no service da API
2. Use a referência do Railway: `${{Postgres.DATABASE_URL}}`
3. Certifique-se que o service PostgreSQL está rodando

### Build funciona mas API não conecta ao MinIO

**Sintoma**: API inicia mas falha ao fazer upload de arquivos

**Solução**:
1. Verifique `MINIO_ENDPOINT` está usando **domínio interno**: `${{minio.RAILWAY_PRIVATE_DOMAIN}}`
2. **NÃO** use a URL pública do MinIO
3. Certifique-se que o service MinIO está rodando

### Bot não conecta à API

**Sintoma**: Bot inicia mas falha ao abrir casos

**Solução**:
1. Verifique `API_BASE_URL` no service do bot
2. Use a **URL pública** da API: `${{api.RAILWAY_PUBLIC_DOMAIN}}/api`
3. Certifique-se que a API tem **Public Networking** habilitado

### Migrations não rodam

**Sintoma**: API inicia mas tabelas não existem no banco

**Solução**:
1. Verifique os logs da API no Railway
2. O Dockerfile da API roda `npm run migrate && npm start`
3. Se necessário, rode migrations manualmente via Railway CLI:
   ```bash
   railway run npm run migrate --workspace=api
   ```

### Variáveis de ambiente não estão sendo reconhecidas

**Sintoma**: Erro "Environment variable X is not defined"

**Solução**:
1. Vá em **Variables** do service
2. Adicione todas as variáveis necessárias
3. Para referenciar outros services, use: `${{ServiceName.VARIABLE}}`
4. Faça redeploy após adicionar variáveis

---

## Checklist de Deploy

Antes de fazer deploy, certifique-se:

- [ ] PostgreSQL provisionado e rodando
- [ ] MinIO configurado com volume persistente
- [ ] API configurada:
  - [ ] Root Directory: vazio
  - [ ] Dockerfile Path: `api/Dockerfile`
  - [ ] Todas variáveis de ambiente configuradas
  - [ ] Public Networking: habilitado
- [ ] Bot configurado:
  - [ ] Root Directory: vazio
  - [ ] Dockerfile Path: `bot/Dockerfile`
  - [ ] TELEGRAM_BOT_TOKEN configurado
  - [ ] API_BASE_URL aponta para API pública
- [ ] Services na ordem correta:
  1. PostgreSQL
  2. MinIO
  3. API
  4. Bot

---

## Logs Úteis

### Ver logs da API
```bash
railway logs --service=api
```

### Ver logs do Bot
```bash
railway logs --service=bot
```

### Testar health da API
```bash
curl https://sua-api.railway.app/api/health
```

---

## Suporte

Se o problema persistir:
1. Verifique os logs completos no Railway Dashboard
2. Confirme que todos os services estão com status "Active"
3. Teste localmente primeiro com `docker build -f bot/Dockerfile .`
4. Abra uma issue no repositório com os logs do erro
