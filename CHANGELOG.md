# Changelog

## [1.0.0] - 2026-01-20

### Implementação Inicial

#### ✅ Bot do Telegram
- Comandos principais:
  - `/start` - Mensagem de boas-vindas
  - `/caso` - Abrir novo caso
  - `/fim` - Fechar caso atual
  - `/status` - Ver status do caso ativo
- Handlers:
  - Mensagens de texto
  - Fotos
  - Documentos
  - Vídeos
- Recursos:
  - Retry automático com exponential backoff (3 tentativas)
  - Logging estruturado com Winston
  - Validação de variáveis de ambiente com Zod
  - Gerenciamento de casos ativos em memória

#### ✅ API REST
- Endpoints:
  - `POST /api/cases/open` - Abrir caso
  - `POST /api/cases/:id/message` - Adicionar mensagem
  - `POST /api/cases/:id/file` - Upload de arquivo
  - `POST /api/cases/:id/close` - Fechar caso
  - `GET /api/cases/active?telegram_user_id=X` - Buscar caso ativo
  - `GET /api/health` - Health check
- Recursos:
  - Validação de requests com Zod
  - Upload de arquivos com Multer (limite 10MB)
  - Error handling global
  - Logging estruturado
  - Auto-fechamento de casos após 10 minutos (job a cada 1 minuto)

#### ✅ Database (PostgreSQL)
- Tabelas:
  - `cases` - Dados principais dos casos
  - `case_messages` - Mensagens de texto
  - `case_files` - Metadados dos arquivos
- Recursos:
  - Migrations SQL versionadas
  - Índices otimizados
  - Foreign keys com CASCADE delete
  - Constraints de validação

#### ✅ Storage (MinIO)
- Organização: `lab-capture-cases/cases/{case_id}/{type}s/`
- Suporte a: imagens, documentos, vídeos
- Geração de URLs presignadas
- Criação automática de bucket

#### ✅ Deploy
- Dockerfiles multi-stage para bot e API
- Configuração para Railway
- Scripts de setup automático
- Documentação completa

### 🌟 Funcionalidades Especiais

#### Auto-fechamento
- Casos inativos por mais de 10 minutos são fechados automaticamente
- Job roda a cada 1 minuto
- Marcado como `closed_by: 'timeout'`

#### Fechamento Automático de Caso Anterior
- Se usuário envia `/caso` com caso já aberto, o anterior é fechado automaticamente
- Marcado como `closed_by: 'auto'`
- Novo caso é aberto imediatamente após

#### Streaming de Eventos
- Cada mensagem/arquivo vira um POST imediato para API
- Não há acúmulo de dados no bot
- Bot só mantém mapa: `user_id → case_id`

### 📚 Documentação
- README.md - Visão geral
- QUICKSTART.md - Início rápido
- ARCHITECTURE.md - Arquitetura detalhada
- docs/API.md - Documentação da API
- docs/DEVELOPMENT.md - Guia de desenvolvimento
- docs/DEPLOYMENT.md - Deploy no Railway
- PROJECT_SUMMARY.md - Resumo do projeto

### 🛠️ Stack Tecnológica
- Node.js 20+
- TypeScript 5.3
- Telegraf 4.15
- Express 4.18
- PostgreSQL 15+
- MinIO (S3-compatible)
- Zod (validação)
- Winston (logging)
- Multer (upload)
- Docker

### 📊 Estatísticas
- 47 arquivos de código TypeScript/SQL/Config
- 3 services (Bot, API, Shared)
- 6 endpoints REST
- 3 migrations SQL
- 4 handlers no bot
- 100% TypeScript
