# 🚀 Quick Start - LabCaptureBot

Guia rápido para rodar o projeto localmente em 5 minutos.

## 1. Pré-requisitos

Certifique-se de ter instalado:
- ✅ Node.js 20+
- ✅ PostgreSQL 15+
- ✅ Docker (para MinIO)

## 2. Instalar Dependências

```bash
npm install
```

## 3. Configurar PostgreSQL

```bash
# Criar banco de dados
createdb labcapture
```

## 4. Configurar MinIO (via Docker)

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name labcapture-minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

## 5. Configurar Variáveis de Ambiente

**API** - Crie `api/.env`:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/labcapture
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=lab-capture-cases
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CASE_AUTO_CLOSE_MINUTES=10
```

**Bot** - Já está configurado em `bot/.env` com seu token!

## 6. Rodar Migrations

```bash
npm run migrate --workspace=api
```

## 7. Iniciar os Serviços

**Terminal 1 - API:**
```bash
npm run dev:api
```

Deve mostrar:
```
API server listening on port 3000
Database connected successfully
MinIO initialized successfully
```

**Terminal 2 - Bot:**
```bash
npm run dev:bot
```

Deve mostrar:
```
Bot started successfully
```

## 8. Testar o Bot

1. Abra o Telegram
2. Procure seu bot (use o username que você criou no @BotFather)
3. Envie: `/start`
4. Envie: `/caso`
5. Envie uma foto
6. Envie uma mensagem: "teste"
7. Envie: `/fim`

## ✅ Pronto!

Agora você tem:
- ✅ API rodando em `http://localhost:3000`
- ✅ Bot conectado e funcionando
- ✅ PostgreSQL salvando metadados
- ✅ MinIO salvando arquivos

## 🔍 Verificar se está funcionando

### API Health Check
```bash
curl http://localhost:3000/api/health
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

### MinIO Console
Acesse: http://localhost:9001
- User: `minioadmin`
- Password: `minioadmin`

### PostgreSQL
```bash
psql labcapture

# Ver casos
SELECT * FROM cases;

# Ver mensagens
SELECT * FROM case_messages;

# Ver arquivos
SELECT * FROM case_files;
```

## 🐛 Problemas Comuns

### "Database connection failed"
```bash
# Verifique se PostgreSQL está rodando
pg_isready

# Se não estiver, inicie:
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux
```

### "MinIO connection failed"
```bash
# Verifique se o container está rodando
docker ps | grep minio

# Se não estiver, inicie:
docker start labcapture-minio
```

### "Bot não responde"
1. Verifique se a API está rodando
2. Verifique o token em `bot/.env`
3. Veja os logs do bot no terminal

## 📚 Próximos Passos

- [Documentação completa](README.md)
- [Guia de desenvolvimento](docs/DEVELOPMENT.md)
- [Deploy no Railway](docs/DEPLOYMENT.md)
- [Documentação da API](docs/API.md)

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
npm run dev:api      # Inicia API em watch mode
npm run dev:bot      # Inicia Bot em watch mode

# Build
npm run build        # Build de tudo

# Testes
npm test            # Roda todos os testes

# Migrations
npm run migrate --workspace=api

# Limpar tudo
npm run clean       # Remove node_modules e dist
```

## 🎉 Está funcionando?

Parabéns! Agora você pode:
- Enviar `/caso` para abrir um caso
- Enviar fotos, vídeos, documentos
- Enviar mensagens de texto
- Enviar `/fim` para fechar
- Ver `/status` para verificar caso ativo
