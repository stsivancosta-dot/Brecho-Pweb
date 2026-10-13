# Tasks — Brechó Estudantil

## 1. Convenções

Estas tarefas implementam requirements.md e design.md. Todas começam com status **Não iniciado**. A prioridade é o fluxo publicar → encontrar → reservar → confirmar → histórico; indicadores e acabamentos vêm depois.

| Campo | Significado |
| --- | --- |
| Relacionados | requisitos e regras atendidos |
| Dependências | tarefas que precisam estar concluídas |
| Módulos | destino provável; ajustar apenas se a estrutura real diferir |
| Validação | evidência objetiva de conclusão |

Comandos previstos após a configuração: npm test para testes automatizados e npm run dev para execução local. Os scripts exatos devem ser definidos em T-04.

## Etapa 1 — Base mínima de backend

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 | Revisar estas specs e registrar somente ambiguidades reais antes de codificar. | Todos | — | specs/ | Equipe confirma a conta única por aluno e preço ausente igual a zero. | Concluído |
| T-02 | Criar estrutura do backend Express com app, roteador e endpoint de saúde. | RNF-05, RNF-06 | T-01 | backend/src/app.js, routes/ | GET /health responde 200 em teste de integração. | Concluído |
| T-03 | Definir variáveis de ambiente locais e configuração PostgreSQL sem credenciais versionadas; a conexão real será validada na T-06, quando o driver for instalado. | RNF-03 | T-02 | backend/src/config/ | Configuração informa variável obrigatória ausente e aceita valores válidos sem abrir conexão. | Concluído |
| T-04 | Configurar scripts de desenvolvimento, teste e banco de testes. | RNF-06 | T-02, T-03 | package.json, backend/tests/ | npm test executa a suíte inicial; conexão de teste fica para T-06. | Concluído |
| T-05 | Criar resposta JSON de erro e middleware global de erros. | RNF-01, RNF-06 | T-02, T-04 | middlewares/, tests/ | Rota inexistente retorna formato erro.codigo e erro.mensagem. | Concluído |

**Conclusão da etapa:** API inicializa, possui configuração pronta para o banco e uma primeira rota testável. A conexão PostgreSQL será validada na T-06, junto do driver e ORM.

## Etapa 2 — Banco, ORM e primeira rota protegida

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-06 | Instalar e configurar Sequelize, driver PostgreSQL e migrations. | RNF-04 | T-03, T-04 | backend/src/models/, migrations/ | Migration de teste sobe e desfaz no banco de testes. | Não iniciado |
| T-07 | Criar migration e modelo Aluno com e-mail único e senha_hash. | RF-01, RNF-03 | T-06 | migrations/, models/Aluno | Duplicidade de e-mail é recusada pelo banco. | Não iniciado |
| T-08 | Criar contas de demonstração com senha em hash, sem endpoint de cadastro. | RF-01, RNF-03 | T-07 | seeders/ | Seed insere contas e nenhuma senha em texto puro. | Não iniciado |
| T-09 | Implementar POST /api/auth/login e GET /api/me. | RF-01 | T-05, T-08 | routes/auth, controllers/, services/ | Testar login válido, inválido, token válido e ausência de token. | Não iniciado |
| T-10 | Implementar middleware de autenticação baseado em alunoId e teste 401. | RF-01, RF-12, RNF-03 | T-09 | middlewares/auth | Rota protegida sem token responde 401; não há campo perfil exclusivo. | Não iniciado |

Exemplo de verificação desta etapa:

~~~bash
npm test -- auth
~~~

**Conclusão da etapa:** banco possui aluno, sessão é verificável e testes de autenticação estão verdes.

## Etapa 3 — Modelos de anúncio e catálogo

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-11 | Criar listas fixas, migration e modelo Anuncio com checks, FKs, timestamps e índices. | RF-11, RNF-04 | T-06, T-07 | models/Anuncio, migrations/ | Valores inválidos e preço negativo são recusados pelo banco ou validador. | Não iniciado |
| T-12 | Implementar serialização de anúncio e formato de preço Troca para valor zero. | RF-03, RN-06 | T-11 | services/anuncios, utils/ | Teste confirma preco 0 e precoExibicao Troca. | Não iniciado |
| T-13 | Implementar GET /api/anuncios com busca, filtros, paginação e somente DISPONIVEL. | RF-02, RF-11 | T-10, T-11, T-12 | routes/anuncios, services/ | Testar busca, categoria, conservação, paginação e exclusão dos outros status. | Não iniciado |
| T-14 | Implementar GET /api/anuncios/:id com dados textuais e anunciante. | RF-03 | T-13 | controllers/anuncios | Testar resposta 200, 404 e exibição Troca. | Não iniciado |

**Conclusão da etapa:** catálogo e detalhes são acessíveis por API autenticada e obedecem às listas fixas.

## Etapa 4 — CRUD próprio e regra de anúncios ativos

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-15 | Implementar POST /api/anuncios com normalização de preço ausente para zero. | RF-04, RN-06 | T-11, T-12 | services/anuncios | Testar criação válida, campos ausentes, lista inválida e preço omitido. | Não iniciado |
| T-16 | Implementar contagem transacional de anúncios DISPONIVEL ou RESERVADO e limite cinco. | RN-04, RNF-04 | T-15 | services/anuncios, migrations/ | Sexta criação retorna 409; duas criações concorrentes não ultrapassam cinco. | Não iniciado |
| T-17 | Implementar PATCH /api/anuncios/:id com autoria e edição apenas em DISPONIVEL. | RF-05, RF-12, RN-02, RN-05 | T-15 | services/anuncios | Autor edita disponível; terceiro recebe 403; reservado, concluído e cancelado são recusados. | Não iniciado |
| T-18 | Implementar DELETE /api/anuncios/:id como cancelamento lógico e preservação de registro. | RF-05, RN-01, RN-07 | T-17 | services/anuncios | Status vira CANCELADO; registro permanece no banco; item sai do catálogo. | Não iniciado |
| T-19 | Implementar GET /api/me/anuncios com filtro por status e autoria da sessão. | RF-09, RF-12 | T-15 | routes/me, services/ | Lista contém apenas anúncios do aluno autenticado. | Não iniciado |
| T-20 | Consolidar testes de CRUD, autoria, limite, cancelamento e imutabilidade. | RF-04, RF-05, RF-12, RN-02, RN-04, RN-05, RN-06, RN-07 | T-15 a T-19 | backend/tests/anuncios | Suíte verde cobre os cenários da etapa e não cria dados residuais. | Não iniciado |

**Conclusão da etapa:** o aluno publica e mantém apenas anúncios próprios, sem violar limite ou histórico.

## Etapa 5 — Reserva, confirmação e expiração

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-21 | Criar migration e modelo Reserva com status, datas, FKs, índices e unicidade parcial de reserva ATIVA. | RF-06, RN-03, RNF-04 | T-11 | models/Reserva, migrations/ | Banco impede duas reservas ATIVA para o mesmo anúncio. | Não iniciado |
| T-22 | Implementar POST /api/anuncios/:id/reservas em transação com bloqueio do anúncio. | RF-06, RN-02, RN-03 | T-21, T-13 | services/reservas | Reserva válida retorna 201, registra expira_em e altera anúncio para RESERVADO. | Não iniciado |
| T-23 | Testar autorreserva, anúncio indisponível e duas reservas simultâneas. | RF-06, RF-12, RN-02, RN-03, RNF-04 | T-22 | backend/tests/reservas | Autor recebe 403; conflito recebe 409; existe uma única ATIVA. | Não iniciado |
| T-24 | Implementar PATCH /api/reservas/:id/confirmacao em transação para o autor do anúncio. | RF-07, RN-01, RN-02, RN-05 | T-22 | services/reservas | Reserva fica CONFIRMADA e anúncio CONCLUIDO no mesmo commit. | Não iniciado |
| T-25 | Implementar serviço idempotente de expiração e seu agendamento. | RF-08, RN-03 | T-22 | jobs/, services/reservas | Reserva vencida fica EXPIRADA e anúncio volta para DISPONIVEL. | Não iniciado |
| T-26 | Executar expiração antes de reserva, confirmação, catálogo dependente de status e indicadores. | RF-08, RN-03 | T-25 | services/, routes/ | Uma reserva vencida é liberada mesmo antes da próxima execução agendada. | Não iniciado |
| T-27 | Criar testes com relógio controlado para confirmação, expiração e imutabilidade. | RF-07, RF-08, RN-01, RN-03, RN-05, RNF-06 | T-24 a T-26 | backend/tests/reservas | Confirmação após prazo falha; concluído não pode ser reaberto. | Não iniciado |
| T-28 | Implementar GET /api/me/reservas, GET /api/me/reservas-recebidas e GET /api/me/negociacoes com papel do aluno. | RF-07, RF-09, RN-05 | T-24, T-27 | routes/me, services/ | Interessado vê suas reservas, autor vê reservas recebidas e participantes veem histórico concluído. | Não iniciado |

Exemplo de chamada após T-22:

~~~bash
curl -X POST http://localhost:3000/api/anuncios/ID/reservas -H "Authorization: Bearer TOKEN"
~~~

**Conclusão da etapa:** o fluxo central de backend está demonstrável, seguro contra concorrência e coberto por testes.

## Etapa 6 — Revisão do backend e contrato

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-29 | Criar testes de contrato para todas as rotas, erros 400, 401, 403, 404 e 409. | RF-01 a RF-09, RF-12 | T-09 a T-28 | backend/tests/ | Cada rota documentada possui ao menos sucesso e falha relevante. | Não iniciado |
| T-30 | Revisar transações, índices e mensagens de erro com dados de teste. | RNF-01, RNF-04 | T-29 | services/, migrations/ | Revisão confirma reserva única, limite e transições consistentes. | Não iniciado |
| T-31 | Congelar contratos de API usados pelo frontend e atualizar design.md se necessário. | RNF-06 | T-29, T-30 | specs/design.md | Rotas, payloads e códigos verificados correspondem à documentação. | Não iniciado |

**Conclusão da etapa:** backend e testes estão concluídos antes de iniciar interface.

## Etapa 7 — Frontend integrado aos contratos testados

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-32 | Criar SPA React, cliente de API, armazenamento de sessão e rotas protegidas. | RF-01, RF-12, RNF-01 | T-31 | frontend/src/api, routes/ | Login persiste sessão; acesso sem sessão retorna à tela de login. | Não iniciado |
| T-33 | Criar Layout, navegação e componentes de carregamento, vazio e erro. | RNF-01 | T-32 | components/ | Todas as páginas têm feedback visual consistente. | Não iniciado |
| T-34 | Implementar Login e Menu sem depender de indicadores. | RF-01 | T-32, T-33 | pages/Login, pages/Menu | Credencial inválida é exibida; sucesso permite navegar. | Não iniciado |
| T-35 | Implementar Brechó com cards textuais, busca, filtros e paginação. | RF-02, RF-11 | T-33, T-34 | pages/Brecho, components/AnuncioCard | Filtros chamam GET /anuncios; lista vazia é clara. | Não iniciado |
| T-36 | Implementar Detalhes e ação de reserva condicional. | RF-03, RF-06, RN-02, RN-06 | T-35 | pages/Detalhes | Autor não vê reservar; conflito 409 atualiza a mensagem. | Não iniciado |
| T-37 | Implementar Cadastro, Editar e Minha vitrine. | RF-04, RF-05, RF-09 | T-33, T-34, T-31 | pages/Cadastro, pages/MinhaVitrine | Formulário aplica listas fixas, mostra Troca e ações permitidas. | Não iniciado |
| T-38 | Implementar Minhas reservas, confirmação para o autor e Histórico somente leitura. | RF-07, RF-08, RF-09, RN-05 | T-36, T-37 | pages/Reservas, pages/Historico | Participante acompanha reserva; autor confirma; concluídos não oferecem edição. | Não iniciado |
| T-39 | Testar interface dos fluxos principais com chamadas simuladas ou ambiente de teste. | RNF-01, RNF-06 | T-34 a T-38 | frontend/src/**/*.test | Estados de carregamento, erro, vazio e sucesso são cobertos. | Não iniciado |

**Conclusão da etapa:** todas as páginas do fluxo principal usam contratos já testados e não exibem recursos fora do escopo.

## Etapa 8 — Indicadores, integração e entrega

| ID | Descrição | Relacionados | Dependências | Módulos | Validação e conclusão | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T-40 | Implementar e testar GET /api/indicadores com duas ou três agregações simples. | RF-10 | T-31 | routes/indicadores, tests/ | Totais por status e categoria batem com banco de teste. | Não iniciado |
| T-41 | Integrar indicadores de forma secundária no Menu. | RF-10, RNF-01 | T-34, T-40 | pages/Menu | Ausência temporária de dados não bloqueia anúncio ou catálogo. | Não iniciado |
| T-42 | Executar teste ponta a ponta: publicar, buscar, reservar, confirmar e consultar histórico. | RF-01 a RF-09 | T-39, T-41 | tests/e2e ou roteiro manual | Fluxo termina sem dashboard, chat, pagamento ou recurso externo. | Não iniciado |
| T-43 | Auditar escopo, rastreabilidade, documentação e navegadores desktop definidos. | Todos, RNF-05, RNF-06 | T-42 | specs/, README.md | Nenhuma rota, página ou dependência fora do escopo; docs correspondem ao sistema. | Não iniciado |
| T-44 | Preparar entrega: migrations reproduzíveis, seeds de demonstração, comandos e evidências de testes. | RNF-06 | T-43 | README.md, package scripts | Ambiente limpo reproduz a execução e a suíte passa. | Não iniciado |

**Conclusão da etapa:** fluxo principal entregue, indicadores secundários funcionais e evidências de qualidade disponíveis.

## 2. Matriz de rastreabilidade

| Item | Implementação | Teste principal |
| --- | --- | --- |
| RF-01 | T-07 a T-10, T-32, T-34 | T-09, T-29, T-39 |
| RF-02 e RF-03 | T-11 a T-14, T-35, T-36 | T-13, T-14, T-29, T-39 |
| RF-04 e RF-05 | T-15 a T-20, T-37 | T-16, T-20, T-29, T-39 |
| RF-06 a RF-08 | T-21 a T-27, T-36, T-38 | T-23, T-27, T-29, T-42 |
| RF-09 | T-19, T-28, T-37, T-38 | T-28, T-29, T-39 |
| RF-10 | T-40, T-41 | T-40, T-42 |
| RF-11 e RF-12 | T-11, T-13, T-17, T-23, T-32 | T-20, T-23, T-29 |
| RN-01 a RN-07 | T-16, T-18, T-21 a T-27 | T-20, T-23, T-27, T-30 |
| RNF-01 a RNF-06 | T-02 a T-05, T-29 a T-44 | T-29, T-30, T-39, T-43 |

## 3. Lista de auditoria final

- Todos os testes backend passam antes da implementação visual.
- A conta única pode publicar e reservar itens de outros alunos.
- Não existe perfil exclusivo, favoritos, avaliações, chat ou recusa manual de reserva.
- Preço ausente é salvo como zero e exibido como Troca.
- Uma reserva ativa por anúncio é garantida pelo banco e pela transação.
- Reservas vencidas liberam anúncio; concluídos são imutáveis.
- Dashboard é construído somente depois do fluxo principal.
