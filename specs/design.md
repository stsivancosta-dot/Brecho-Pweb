# Design — Brechó Estudantil

## 1. Visão técnica 
Esta especificação descreve como atender aos requisitos de requirements.md sem implementar a aplicação nesta etapa.

~~~text
React (SPA)  →  API REST Node.js/Express  →  PostgreSQL
                     │
                  Sequelize ORM
~~~

- Frontend: renderiza páginas, mantém a sessão e chama a API. Ele não decide permissões nem transições de status.
- API: autentica, autoriza, valida entradas, executa regras de negócio e retorna respostas JSON.
- Banco: persiste dados, aplica integridade referencial e protege operações concorrentes.

Uma conta de Aluno pode executar ações de anunciante e de interessado. A autorização é baseada em autoria e estado do recurso, não em um campo de perfil exclusivo.

## 2. Organização lógica

~~~text
backend/
  src/
    app.js
    routes/
    controllers/
    services/
    models/
    middlewares/
    validators/
    jobs/
    config/
  migrations/
  tests/
frontend/
  src/
    api/
    pages/
    components/
    hooks/
    routes/
    utils/
~~~

Rotas recebem a requisição; controladores convertem HTTP em chamada de serviço; serviços aplicam regras e transações; modelos representam persistência. Validadores não substituem as regras de negócio do serviço.

## 3. Modelo de dados 

### 3.1 Relacionamentos

~~~text
Aluno 1 ─── N Anuncio
Aluno 1 ─── N Reserva (como interessado)
Anuncio 1 ─── N Reserva (histórico)

Cada Anuncio possui no máximo uma Reserva ATIVA.
~~~

### 3.2 Tabela alunos

| Campo | Tipo | Regras |
| --- | --- | --- |
| id | UUID | chave primária |
| nome | VARCHAR(120) | obrigatório |
| email | VARCHAR(160) | obrigatório, único, normalizado |
| senha_hash | TEXT | obrigatório; nunca retornado |
| criado_em | TIMESTAMPTZ | obrigatório, padrão atual |
| atualizado_em | TIMESTAMPTZ | obrigatório, padrão atual |

Não há coluna perfil. A API consulta autoria do anúncio e identidade do aluno autenticado.

### 3.3 Tabela anuncios

| Campo | Tipo | Regras |
| --- | --- | --- |
| id | UUID | chave primária |
| autor_id | UUID | FK alunos.id, obrigatório |
| item | VARCHAR(120) | obrigatório, 2 a 120 caracteres |
| descricao | TEXT | obrigatória, 10 a 1000 caracteres |
| categoria | VARCHAR(30) | lista fixa, obrigatório |
| estado_conservacao | VARCHAR(10) | NOVO, BOM ou USADO |
| preco | NUMERIC(10,2) | obrigatório, padrão 0, não negativo |
| status | VARCHAR(15) | DISPONIVEL, RESERVADO, CONCLUIDO ou CANCELADO |
| criado_em | TIMESTAMPTZ | obrigatório |
| atualizado_em | TIMESTAMPTZ | obrigatório |
| concluido_em | TIMESTAMPTZ | nulo até a confirmação |
| cancelado_em | TIMESTAMPTZ | nulo até o cancelamento |

Checks: categoria e conservação pertencem às listas fixas; preço é maior ou igual a zero; status pertence à lista fixa.

### 3.4 Tabela reservas

| Campo | Tipo | Regras |
| --- | --- | --- |
| id | UUID | chave primária |
| anuncio_id | UUID | FK anuncios.id, obrigatório |
| interessado_id | UUID | FK alunos.id, obrigatório |
| status | VARCHAR(15) | ATIVA, CONFIRMADA, EXPIRADA ou CANCELADA |
| reservado_em | TIMESTAMPTZ | obrigatório |
| expira_em | TIMESTAMPTZ | obrigatório; reservado_em + 3 dias |
| confirmado_em | TIMESTAMPTZ | nulo até confirmação |
| encerrado_em | TIMESTAMPTZ | nulo até expiração ou cancelamento |

Quando anúncio com reserva ATIVA é cancelado, a reserva muda para CANCELADA e recebe encerrado_em. Esse estado técnico preserva o histórico da reserva e não constitui uma ação de recusa manual de reserva.

### 3.5 Índices e integridade

| Estrutura | Finalidade |
| --- | --- |
| UNIQUE em alunos.email | impedir contas duplicadas |
| índice anuncios(status, categoria, estado_conservacao) | catálogo e filtros |
| índice anuncios(autor_id, status) | meus anúncios e limite de ativos |
| índice reservas(interessado_id, status) | minhas reservas e histórico |
| índice reservas(anuncio_id, status) | confirmação e expiração |
| UNIQUE parcial em reservas(anuncio_id) WHERE status = ATIVA | no máximo uma reserva ativa |

## 4. Autenticação, autorização e erros

Após login, a API emite token de sessão assinado contendo somente alunoId. O middleware de autenticação valida o token e carrega o aluno. Senhas são comparadas por hash.

| Código | Uso |
| --- | --- |
| 200 | consulta, edição ou confirmação concluída |
| 201 | anúncio ou reserva criado |
| 204 | cancelamento concluído sem corpo |
| 400 | entrada inválida ou transição inválida |
| 401 | token ausente, inválido ou expirado |
| 403 | falta de autoria ou tentativa de autorreserva |
| 404 | recurso inexistente ou não visível |
| 409 | conflito de concorrência, reserva ativa ou limite de ativos |
| 500 | erro não esperado |

Formato de erro:

~~~json
{
  "erro": {
    "codigo": "RESERVA_NAO_DISPONIVEL",
    "mensagem": "Este anúncio não está disponível para reserva."
  }
}
~~~

## 5. Contrato da API

Base: /api. Todas as rotas, exceto login, exigem cabeçalho Authorization com token de sessão.

### 5.1 Autenticação e aluno

| Método e caminho | Finalidade | Requisitos |
| --- | --- | --- |
| POST /auth/login | iniciar sessão | RF-01 |
| GET /me | retornar aluno autenticado | RF-01, RF-09 |

POST /auth/login recebe:

~~~json
{ "email": "ana@escola.edu", "senha": "senha-da-conta" }
~~~

Retorna 200:

~~~json
{
  "token": "token-de-sessao",
  "aluno": { "id": "uuid", "nome": "Ana Silva", "email": "ana@escola.edu" }
}
~~~

GET /me retorna 200 com id, nome e e-mail, sem senha_hash. Testar credencial válida, senha inválida, token ausente e token válido.

### 5.2 Anúncios

| Método e caminho | Finalidade | Permissão | Requisitos |
| --- | --- | --- | --- |
| GET /anuncios | catálogo de disponíveis | autenticado | RF-02, RF-11 |
| GET /anuncios/:id | detalhe do anúncio | autenticado | RF-03 |
| POST /anuncios | criar anúncio | autenticado | RF-04, RN-04, RN-06 |
| PATCH /anuncios/:id | editar anúncio próprio disponível | autor | RF-05, RN-02, RN-05 |
| DELETE /anuncios/:id | cancelar logicamente anúncio próprio | autor | RF-05, RN-01, RN-07 |
| GET /me/anuncios | meus anúncios | autenticado | RF-09 |

GET /anuncios aceita busca, categoria, estado, pagina e limite. Busca compara item e descrição sem distinguir maiúsculas de minúsculas. Categoria e estado devem pertencer às listas fixas. A resposta contém somente anúncios DISPONIVEL.

Exemplo de resposta:

~~~json
{
  "dados": [
    {
      "id": "uuid",
      "item": "Livro de Matemática",
      "categoria": "LIVRO",
      "estadoConservacao": "BOM",
      "preco": 0,
      "precoExibicao": "Troca",
      "status": "DISPONIVEL",
      "anunciante": { "id": "uuid", "nome": "João" }
    }
  ],
  "paginacao": { "pagina": 1, "limite": 12, "total": 1 }
}
~~~

POST /anuncios recebe item, descricao, categoria, estadoConservacao e opcionalmente preco. A ausência de preco é normalizada para 0. Deve retornar 201 com o anúncio criado. Antes de inserir, a transação conta anúncios do autor com status DISPONIVEL ou RESERVADO e rejeita o sexto com 409.

PATCH /anuncios aceita somente item, descricao, categoria, estadoConservacao e preco. Ele rejeita anúncio que não seja do autor, esteja CONCLUIDO, CANCELADO ou RESERVADO. DELETE altera status para CANCELADO e preenche cancelado_em; nunca apaga a linha.

GET /me/anuncios aceita status opcional e retorna somente anúncios cujo autor_id é o aluno da sessão. Testar autoria, listas fixas, preço negativo, limite, imutabilidade e cancelamento lógico.

### 5.3 Reservas e histórico

| Método e caminho | Finalidade | Permissão | Requisitos |
| --- | --- | --- | --- |
| POST /anuncios/:id/reservas | reservar anúncio disponível | aluno diferente do autor | RF-06, RN-02, RN-03 |
| PATCH /reservas/:id/confirmacao | confirmar negociação | autor do anúncio | RF-07, RN-01, RN-05 |
| GET /me/reservas | minhas reservas, ativas ou históricas | autenticado | RF-09 |
| GET /me/reservas-recebidas | reservas ativas ou históricas dos anúncios próprios | autor do anúncio | RF-07, RF-09 |
| GET /me/negociacoes | concluídos do aluno | autenticado | RF-09 |

POST /anuncios/:id/reservas não recebe corpo. Retorna 201:

~~~json
{
  "id": "uuid",
  "anuncioId": "uuid",
  "status": "ATIVA",
  "reservadoEm": "2026-10-13T12:00:00Z",
  "expiraEm": "2026-10-16T12:00:00Z"
}
~~~

PATCH /reservas/:id/confirmacao não recebe corpo. Retorna 200 com reserva CONFIRMADA e anúncio CONCLUIDO. Deve rejeitar interessado, autor diferente, reserva expirada e anúncio não reservado.

GET /me/reservas aceita status opcional. GET /me/reservas-recebidas aceita status opcional e retorna somente reservas de anúncios cujo autor é o aluno autenticado. GET /me/negociacoes retorna somente anúncios CONCLUIDO em que o aluno é autor ou interessado da reserva CONFIRMADA, com o campo papel igual a ANUNCIANTE ou INTERESSADO.

Não existe rota de recusa manual de reserva, favoritos, avaliação ou mensagens.

### 5.4 Indicadores

| Método e caminho | Finalidade | Permissão | Requisitos |
| --- | --- | --- | --- |
| GET /indicadores | totais por status e categoria | autenticado | RF-10 |

Retorna 200 com até três agregações, por exemplo totalPorStatus e totalPorCategoria. Esta rota só será construída depois das rotas centrais e não bloqueia o fluxo de anúncio, reserva e confirmação.

## 6. Transações e concorrência

### 6.1 Criar anúncio

Em transação, bloquear ou serializar a verificação dos anúncios ativos do autor; contar DISPONIVEL e RESERVADO; criar somente quando o total for menor que cinco.

### 6.2 Criar reserva

1. iniciar transação;
2. buscar anúncio com bloqueio de linha;
3. expirar sua reserva ATIVA se ela já tiver vencido;
4. validar status DISPONIVEL e autor diferente do interessado;
5. inserir reserva ATIVA com expira_em em três dias;
6. alterar anúncio para RESERVADO;
7. confirmar transação.

O índice parcial é a defesa final contra duas reservas ativas no mesmo anúncio. Violação de unicidade é convertida para 409.

### 6.3 Confirmar reserva

Em uma única transação: bloquear reserva e anúncio; conferir autoria, status ATIVA e prazo; atualizar reserva para CONFIRMADA com confirmado_em; atualizar anúncio para CONCLUIDO com concluido_em.

### 6.4 Expirar reservas

Um serviço idempotente deve localizar reservas ATIVA com expira_em menor ou igual ao instante atual, atualizá-las para EXPIRADA e restaurar seus anúncios RESERVADO para DISPONIVEL. Ele roda por agendamento e também é executado antes de ações que dependam de disponibilidade. Testes usam relógio controlado.

## 7. Frontend 

### 7.1 Princípios e componentes comuns

Após login, a navegação apresenta Menu, Brechó, Cadastro, Minha vitrine, Minhas reservas e Histórico. As ações são condicionais: o dono vê editar, cancelar e confirmar; outro aluno vê reservar quando permitido.

Componentes compartilhados:

| Componente | Responsabilidade |
| --- | --- |
| AppLayout | cabeçalho, navegação e sessão |
| ProtectedRoute | exige sessão antes de renderizar |
| AnuncioCard | resumo textual e atalho de detalhes |
| StatusBadge | mostra status permitido |
| PrecoExibicao | mostra Troca quando preco é zero |
| EmptyState, LoadingState, ErrorState | feedback consistente |
| AnuncioForm | cadastro e edição com listas fixas |

Não incluir ícone de favoritos, avaliações, chat ou tela administrativa.

### 7.2 Páginas 
| Página | Objetivo, dados e ações | API e estados |
| --- | --- | --- |
| Login | campos e-mail e senha; entrar | POST /auth/login. Carregando, credencial inválida e sucesso com redirecionamento. |
| Menu | atalhos para fluxo principal; indicadores só quando disponíveis | GET /me e, posteriormente, GET /indicadores. Vazio não impede uso do catálogo. |
| Brechó | cards de anúncios disponíveis; busca, categoria, conservação e paginação | GET /anuncios. Carregando, sem resultado, filtro inválido e erro. |
| Detalhes | dados completos do anúncio; reservar somente para não autor e disponível | GET /anuncios/:id e POST /anuncios/:id/reservas. Sucesso atualiza status; 409 informa indisponibilidade. |
| Cadastro | formulário de novo anúncio | POST /anuncios. Exibe validação, limite de cinco e sucesso. |
| Editar anúncio | formulário do anúncio próprio disponível | GET /anuncios/:id e PATCH /anuncios/:id. Acesso negado, imutável e sucesso. |
| Minha vitrine | listar anúncios próprios por status; editar ou cancelar quando permitido | GET /me/anuncios e DELETE /anuncios/:id. Estado vazio, confirmação de cancelamento e erro. |
| Histórico | listar negociações concluídas com papel do aluno | GET /me/negociacoes. Estado vazio e somente leitura. |

Fluxos:

~~~text
Publicar: Login → Cadastro → Minha vitrine → gerenciamento 
Reservar: Login → Brechó → Detalhes → Reservar
Concluir: Minha vitrine → reserva ativa → Confirmar
~~~

## 8. Testabilidade

### 8.1 Backend primeiro


| Área | Casos mínimos |
| --- | --- |
| autenticação | login válido, inválido e rota sem token |
| anúncios | criar, editar próprio, negar edição alheia, cancelar lógico, limite de cinco |
| catálogo | somente disponíveis, busca e filtros combinados |
| reservas | autorreserva negada, reserva criada, conflito simultâneo, expiração |
| confirmação | somente autor, transição atômica, concluído imutável |
| histórico | visível aos dois participantes, invisível a terceiro |
| interface | carregando, vazio, erro e sucesso por página |

### 8.2 Exemplo de teste de contrato

~~~js
await request(app)
  .post("/api/anuncios/" + anuncioId + "/reservas")
  .set("Authorization", "Bearer " + tokenDoInteressado)
  .expect(201);
~~~

Um segundo pedido concorrente deve receber 409 e o banco deve manter uma única reserva ATIVA.

## 9. Decisões registradas

- Preço ausente é salvo como 0 e exibido como Troca.
- Cancelamento é lógico; registros não são apagados.
- Reserva vencida é expirada automaticamente e libera o anúncio.
- Não há perfil exclusivo: permissões dependem de sessão, autoria e estado.
- Recusa manual de reserva não faz parte do MVP. O anunciante confirma ou a reserva expira.
