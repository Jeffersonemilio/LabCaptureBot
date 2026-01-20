# LabCaptureBot

Sistema de captura de casos laboratoriais via Telegram com armazenamento em PostgreSQL e MinIO.

## 📋 Visão Geral

O LabCaptureBot permite que usuários registrem casos laboratoriais através do Telegram, enviando:
- Mensagens de texto com anotações
- Imagens
- Documentos
- Vídeos

Todos os dados são organizados por caso e armazenados de forma estruturada.

## 🏗️ Arquitetura

```
┌─────────────┐
│   Telegram  │
│    User     │
└──────┬──────┘
       │
       v
┌─────────────┐      ┌─────────────┐
│     Bot     │─────>│     API     │
│  (Telegraf) │      │  (Express)  │
└─────────────┘      └──────┬──────┘
                            │
                  ┌─────────┴─────────┐
                  v                   v
           ┌─────────────┐     ┌──────────┐
           │ PostgreSQL  │     │  MinIO   │
           │  (Metadata) │     │ (Files)  │
           └─────────────┘     └──────────┘
```

## 🚀 Começando

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- MinIO (ou S3-compatible storage)
- Token do Bot Telegram (do @BotFather)

### Instalação

1. Clone o repositório
```bash
git clone <repo-url>
cd LabCaptureBot
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente

**Bot** (`bot/.env`):
```bash
TELEGRAM_BOT_TOKEN=8516621330:AAHs8pnR5bbBkqJ2abi8wM27UqqzSB0B4zQ
API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
LOG_LEVEL=info
```

**API** (`api/.env`):
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

4. Crie o banco de dados
```bash
createdb labcapture
```

5. Rode as migrations
```bash
npm run migrate --workspace=api
```

6. Inicie os serviços

**Terminal 1 - API:**
```bash
npm run dev:api
```

**Terminal 2 - Bot:**
```bash
npm run dev:bot
```

## 📱 Como Usar

1. **Iniciar conversa**: `/start`
2. **Abrir caso**: `/caso`
3. **Enviar dados**: Envie mensagens, fotos, documentos
4. **Fechar caso**: `/fim`
5. **Ver status**: `/status`

## 🔄 Fluxo de Trabalho

```
Usuário: /caso
Bot: ✅ Caso aberto!

Usuário: [📷 imagem.jpg]
Bot: 👍

Usuário: "suspeita de blast"
Bot: 👍

Usuário: /fim
Bot: ✅ Caso fechado! (2 mensagens, 1 arquivo)
```

## 🌟 Funcionalidades

### Auto-fechamento
- Casos inativos por mais de 10 minutos são fechados automaticamente
- Configurável via `CASE_AUTO_CLOSE_MINUTES`

### Fechamento Automático de Caso Anterior
- Se usuário envia `/caso` com caso já aberto, o anterior é fechado automaticamente
- Não há limite de casos por usuário (apenas 1 ativo por vez)

### Retry com Backoff
- Todas as chamadas à API usam retry automático
- 3 tentativas com backoff exponencial (1s, 2s, 4s)

### Validação de Dados
- Schemas Zod para validação de requests
- Tratamento de erros robusto

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
LabCaptureBot/
├── bot/          # Bot do Telegram
├── api/          # API REST
├── shared/       # Tipos compartilhados
└── docs/         # Documentação
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev:bot       # Inicia bot em modo watch
npm run dev:api       # Inicia API em modo watch

# Build
npm run build         # Build de todos os workspaces

# Testes
npm test             # Roda testes de todos os workspaces

# Migrations
npm run migrate --workspace=api
```

### Testes

```bash
# Rodar todos os testes
npm test

# Testes do bot
npm test --workspace=bot

# Testes da API
npm test --workspace=api
```

## 🚢 Deploy no Railway

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para instruções completas.

### Quick Start

1. Crie um projeto no Railway
2. Adicione 4 serviços:
   - PostgreSQL (template)
   - MinIO (Docker)
   - API (Dockerfile: `api/Dockerfile`)
   - Bot (Dockerfile: `bot/Dockerfile`)

3. Configure as variáveis de ambiente
4. Deploy!

## 📊 API Endpoints

### Cases

- `POST /api/cases/open` - Abrir novo caso
- `POST /api/cases/:id/message` - Adicionar mensagem
- `POST /api/cases/:id/file` - Adicionar arquivo
- `POST /api/cases/:id/close` - Fechar caso
- `GET /api/cases/active?telegram_user_id=X` - Buscar caso ativo

### Health

- `GET /api/health` - Status da API

Ver [docs/API.md](docs/API.md) para documentação completa.

## 🐛 Troubleshooting

### Bot não responde
- Verifique se o token está correto
- Verifique se a API está rodando
- Veja os logs: `LOG_LEVEL=debug npm run dev:bot`

### API retorna erro 500
- Verifique conexão com PostgreSQL
- Verifique conexão com MinIO
- Veja os logs: `LOG_LEVEL=debug npm run dev:api`

### Migrations falham
- Verifique `DATABASE_URL`
- Verifique se o banco existe
- Rode manualmente: `npm run migrate --workspace=api`

## 📝 Licença

MIT

## 👥 Contribuindo

Pull requests são bem-vindos!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request
