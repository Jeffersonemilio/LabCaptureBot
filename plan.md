Planejamento: como organizar os envios de dados do bot para a API
Princípio central (guarde isso)

Cada mensagem do usuário vira UM evento enviado à API, sempre com case_id.

O bot não acumula dados.
Ele streama eventos para a API.

Visão geral do fluxo
Usuário (Telegram)
   ↓
Mensagem / Imagem
   ↓
Bot (parser)
   ↓
Identifica case_id
   ↓
Envia evento para API
   ↓
API salva no Supabase / Storage


O bot só precisa saber uma coisa:

“Qual é o case_id ativo desse usuário?”

1. Onde nasce o case_id
Quando o usuário envia:
#caso

Fluxo correto

Bot recebe #caso

Bot faz:

POST /cases/open


A API:

cria o caso no Supabase

gera case_id

API responde:

{
  "case_id": "c9b7c1e2-4e4a-4f2e"
}


Bot guarda em memória:

user_id → case_id


⚠️ O bot não inventa o case_id.
Ele recebe da API.

2. Estado mínimo que o bot mantém

O bot mantém apenas isso:

activeCases = {
  user_id_1: case_id_1,
  user_id_2: case_id_2
}


Nada mais.

Se o bot cair:

o backend ainda tem tudo

o usuário pode reabrir com #caso

3. Regra de envio: tudo vira evento

A partir do momento que existe case_id:

👉 CADA envio do usuário gera uma chamada à API

Sem exceção.

4. Envio de TEXTO para a API
Usuário envia:
suspeita de blast

Bot faz:
POST /cases/{case_id}/message

Payload enviado:
{
  "type": "text",
  "content": "suspeita de blast",
  "telegram": {
    "message_id": 321,
    "chat_id": -100999,
    "user_id": 12345,
    "timestamp": 1710000000
  }
}

O que a API faz:

grava em case_messages

associa ao case_id

pronto

5. Envio de IMAGEM para a API
Usuário envia imagem 📎
Bot faz:

Baixa a imagem do Telegram

Envia para a API:

POST /cases/{case_id}/file

Payload (multipart):

arquivo (imagem)

metadados:

{
  "file_type": "image",
  "telegram_message_id": 322,
  "user_id": 12345
}

O que a API faz:

salva a imagem no storage

grava o path no Supabase

associa ao case_id

6. Envio de FECHAMENTO do caso
Usuário envia:
#fim

Bot faz:
POST /cases/{case_id}/close


Payload:

{
  "closed_by": "user",
  "telegram_message_id": 330
}


A API:

marca status = closed

salva closed_at

Depois disso:

o bot remove o case_id da memória

7. Sequência REAL de eventos (exemplo completo)
Conversa no Telegram
#caso
[img1]
suspeita de blast
[img2]
#fim

O que o bot envia para a API

1️⃣ Abrir caso

POST /cases/open


⬅️ recebe case_id = A123

2️⃣ Imagem 1

POST /cases/A123/file


3️⃣ Texto

POST /cases/A123/message


4️⃣ Imagem 2

POST /cases/A123/file


5️⃣ Fechar caso

POST /cases/A123/close


✅ Fim.
A API agora tem tudo organizado por case_id.

8. Por que isso é o modelo certo
Vantagens

Zero ambiguidade

Nenhum dado perdido

Streaming simples

Backend manda na verdade

Fácil reprocessar depois

Você evita

❌ juntar dados no bot
❌ enviar tudo no final
❌ payload gigante
❌ confusão de casos
❌ retrabalho futuro

9. Erro comum (NÃO faça)

❌ Esperar #fim para mandar tudo
❌ Mandar um JSON com “o caso inteiro”
❌ Bot salvar dados localmente
❌ Bot escrever direto no Supabase

10. Regra de ouro (resuma isso)

O bot envia eventos.
A API constrói o caso.

Sempre.

Próximo passo lógico (agora sim)

Agora que o modelo está claro, o próximo passo natural é formalizar o contrato da API.

Posso:

Especificar todos os endpoints

Definir schemas JSON exatos

Criar diagrama de sequência visual

Planejar idempotência e retries

Definir estrutura final do Supabase

👉 Diga qual desses você quer fazer agora.