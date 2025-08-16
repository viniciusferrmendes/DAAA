# Projeto DAAA Digital - Arquitetura e Escopo do MVP

## 1. Stack Tecnológica
- **Backend**: Node.js + NestJS
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT (Access + Refresh Tokens)
- **Armazenamento Binário**: S3-compatible (MinIO local / S3 em produção)
- **PDF Generation**: serviço interno (HTML → PDF via Puppeteer/Playwright)
- **Logs/Observabilidade**: Pino (logs estruturados) + prom-client (métricas básicas) + NestJS Terminus (healthcheck)

---

## 2. Domínio e Entidades

### Accident
- id
- data, hora
- localização { local, país }
- injuries (bool)
- materialDamages { otherVehicles: bool, otherObjects: bool }
- witnesses [ { nome, morada, telefone } ]
- parties [AccidentParty A, AccidentParty B]
- circumstances { vehicleA: [int], vehicleB: [int] }
- collisionPoint { vehicleA: enum, vehicleB: enum }
- visibleDamages { vehicleA: string, vehicleB: string }
- sketch (URL/base64)
- observations { vehicleA: string, vehicleB: string }
- signatures { vehicleA: URL/base64, vehicleB: URL/base64 }
- status (enum: draft → awaiting_other_party → ready_to_sign → signed_by_both → pdf_generated → submitted)
- timestamps (createdAt, updatedAt)

### AccidentParty
- role (A|B)
- insured { apelido, nome, morada, CP, país, contacto, NIF }
- vehicle { marcaModelo, matricula, país, trailer? }
- insurance { companhia, apólice, cartaVerde, validadeInicio, validadeFim, agencia { nome, morada, CP, país, contacto }, coversMaterialDamage }
- driver { apelido, nome, nascimento, morada, CP, país, contacto, cartaNum, categoria, validade }

### User
- id
- email, passwordHash
- nome, contacto
- vehicles [Vehicle]
- defaultInsurance opcional

### Vehicle
- id
- userId (FK)
- marca, modelo, matrícula, país, ano
- seguro (FK opcional)

### QrSession
- id
- accidentId
- token (único, efémero, single-use)
- expiresAt
- used (bool)

### AuditLog
- id
- accidentId
- userId
- party (A|B)
- action (enum)
- block (ex: general, partyA, circumstances, etc)
- ip, geoLat, geoLng
- ts

---

## 3. Fluxos Principais

### Fluxo A - Criação do acidente (Condutor A)
1. A cria Accident (status = draft).
2. Preenche Parte A (insured/vehicle/insurance/driver).
3. Backend cria QrSession (token curto).
4. A mostra QR ao condutor B.

### Fluxo B - Pareamento (Condutor B)
1. B lê QR → envia token ao backend.
2. Backend valida token, associa B como Parte B no mesmo Accident.
3. Ambos podem editar o acidente em paralelo (cada um apenas seus blocos).

### Fluxo C - Preenchimento conjunto
- A e B preenchem seus blocos (6–9, 10, 11, 14, 12).
- Campos gerais (1–5) editáveis pelo criador (ou ambos).
- Circunstâncias: guardar apenas IDs marcados (1–17).

### Fluxo D - Assinatura
- Quando ambos confirmarem → status ready_to_sign.
- Cada um assina (salvo como base64/URL).
- Quando ambos assinam → status signed_by_both.

### Fluxo E - Geração do PDF
- Backend monta PDF fiel ao layout da 1ª página.
- Inserir textos, checkboxes, observações, croqui (imagem), assinaturas.
- Status → pdf_generated.
- Disponibiliza link temporário de download/compartilhamento.

---

## 4. Contratos de API (resumido)

### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/refresh

### Profile & Vehicles
- GET /me
- GET /me/vehicles
- POST /me/vehicles

### Accidents
- POST /accidents
- POST /accidents/:id/qrsessions
- POST /accidents/join
- GET /accidents/:id
- PATCH /accidents/:id/general
- PATCH /accidents/:id/party/A
- PATCH /accidents/:id/party/B
- PATCH /accidents/:id/circumstances
- PATCH /accidents/:id/collision-point
- PATCH /accidents/:id/visible-damages
- PATCH /accidents/:id/observations
- POST /accidents/:id/sign
- POST /accidents/:id/finalize
- GET /accidents/:id/pdf

### Uploads
- POST /uploads (fotos, croqui, assinatura) — opcional no MVP

---

## 5. Regras e Validações
- Matrícula PT (regex tolerante).
- Datas coerentes (apólice início ≤ fim).
- Idade mínima do condutor.
- Circunstâncias: validar total marcado = quantidade de checkboxes.
- Assinatura: não permitir finalize sem as duas.
- Locks otimistas (updatedAt/versão).
- Idempotência (Idempotency-Key nos PATCH/POST críticos).

---

## 6. Segurança
- QR contém apenas accidentId + one-time token curto.
- Token com escopo "join-as-B", single-use.
- HTTPS obrigatório.
- Criptografia at-rest (S3 SSE, colunas sensíveis).
- GDPR: consentimento, direito ao apagamento, retenção configurável.

---

## 7. Auditoria e Observabilidade
- **Auditoria mínima no MVP**: grava alterações por bloco.
- **Logs**: Pino JSON, requestId por requisição.
- **Métricas**: prom-client (latência, erros, PDFs gerados).
- **Healthcheck**: NestJS Terminus (DB, storage).

---

## 8. Roadmap de Implementação
1. Módulo Auth + Users + Vehicles.
2. Accidents: criação, QrSession, join.
3. PATCHs por blocos + validações + locks.
4. Assinatura + estados ready_to_sign / signed_by_both.
5. Geração de PDF.
6. Observabilidade mínima (logs + métricas + audit log).
7. Iteração futura: uploads de fotos e croqui avançado.

---

## 9. Estados do Processo (state machine)
- draft
- awaiting_other_party
- both_in_draft
- ready_to_sign
- signed_by_one
- signed_by_both
- pdf_generated
- submitted (futuro, integração seguradora)

