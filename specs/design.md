# Design - Brechó Estudantil

## 1. Visão técnica

Esta spec transforma os comportamentos de [requirements.md](./requirements.md) em uma proposta técnica para a primeira versão do sistema.

```text
React SPA  ->  API REST em Node.js/Express  ->  PostgreSQL
```

- O React apresenta as telas, mantém a sessão do usuário e chama a API.
- A API autentica, autoriza, valida regras e coordena as transações.
- O PostgreSQL persiste alunos, anúncios e reservas e reforça restrições de integridade.

As regras de negócio nunca devem depender apenas de validações do frontend.

## 2. Decisões de arquitetura

| Decisão | Aplicação |
| --- | --- |
| Interface | SPA em React com rotas protegidas por perfil |
| Backend | API REST em Node.js com Express |
| Persistência | PostgreSQL com chaves estrangeiras, checks e transações |
| Autenticação | Login por e-mail e senha, com token de sessão contendo id e perfil |
| Contas | Contas de demonstração previamente cadastradas; não existe cadastro ou recuperação de senha |
| Remoção de anúncio | Cancelamento lógico pelo endpoint `DELETE`, preservando o histórico |
| Expiração | Validação de reservas vencidas antes de listar, reservar, confirmar ou calcular indicadores |
| Listas fixas | Enums ou checks no banco e constantes no backend/frontend, sem CRUD administrativo |

## 3. Modelo de dados

### 3.1 Relacionamentos

```text
Aluno 1 -------- N Anúncio
  |
  +------------- N Reserva N -------- 1 Anúncio

Um Anúncio pode ter várias reservas históricas,
mas no máximo uma Reserva ativa por vez.
```

### 3.2 Tabela `alunos`

| Campo | Tipo sugerido | Restrições |
| --- | --- | --- |
| `id` | UUID | PK |
| `nome` | VARCHAR(120) | NOT NULL |
| `email` | VARCHAR(160) | NOT NULL, UNIQUE |
| `senha_hash` | TEXT | NOT NULL |
| `perfil` | ENUM | `ANUNCIANTE` ou `INTERESSADO`, NOT NULL |
| `criado_em` | TIMESTAMPTZ | NOT NULL, valor atual por padrão |

### 3.3 Tabela `anuncios`

| Campo | Tipo sugerido | Restrições |
| --- | --- | --- |
| `id` | UUID | PK |
| `autor_id` | UUID | FK para `alunos.id`, NOT NULL |
| `item` | VARCHAR(120) | NOT NULL |
| `descricao` | TEXT | NOT NULL |
| `categoria` | ENUM | lista fixa de categorias, NOT NULL |
| `estado_conservacao` | ENUM | `NOVO`, `BOM` ou `USADO`, NOT NULL |
| `preco` | NUMERIC(10,2) | NOT NULL, padrão 0, CHECK `preco >= 0` |
| `status` | ENUM | lista fixa de status, padrão `DISPONIVEL` |
| `criado_em` | TIMESTAMPTZ | NOT NULL |
| `atualizado_em` | TIMESTAMPTZ | NOT NULL |
| `concluido_em` | TIMESTAMPTZ | NULL até a confirmação |

### 3.4 Tabela `reservas`

| Campo | Tipo sugerido | Restrições |
| --- | --- | --- |
| `id` | UUID | PK |
| `anuncio_id` | UUID | FK para `anuncios.id`, NOT NULL |
| `interessado_id` | UUID | FK para `alunos.id`, NOT NULL |
| `ativa` | BOOLEAN | NOT NULL, padrão `TRUE` |
| `reservado_em` | TIMESTAMPTZ | NOT NULL |
| `expira_em` | TIMESTAMPTZ | NOT NULL, `reservado_em + 3 dias` |
| `confirmado_em` | TIMESTAMPTZ | NULL até a confirmação |
| `encerrado_em` | TIMESTAMPTZ | NULL enquanto ativa |

Uma reserva está concluída quando `confirmado_em` possui valor. Uma reserva encerrada sem confirmação representa expiração ou cancelamento do anúncio. Essa modelagem evita criar outra lista de status além das listas fixadas no briefing.

### 3.5 Restrições e índices

- índice de busca em `anuncios.item` e, se necessário, em `anuncios.descricao`;
- índices em `anuncios.categoria`, `anuncios.estado_conservacao` e `anuncios.status`;
- índices em todas as chaves estrangeiras;
- índice único parcial em `reservas(anuncio_id) WHERE ativa = TRUE`;
- check para impedir preço negativo;
- operações de reserva, confirmação, expiração e limite de anúncios executadas em transação.

## 4. Máquina de estados do anúncio

```text
DISPONIVEL --reservar--> RESERVADO --confirmar--> CONCLUIDO
     |                       |
     +------cancelar-------->+------cancelar----> CANCELADO

RESERVADO --expirar em 3 dias--> DISPONIVEL
CONCLUIDO --nenhuma transição--> somente leitura
```

O cancelamento a partir de `CONCLUIDO` deve ser rejeitado, pois RN-05 torna a conclusão definitiva.

## 5. Contrato da API

### 5.1 Convenções

- Base sugerida: `/api`.
- Entrada e saída em JSON.
- Datas em ISO 8601 e UTC.
- O token identifica `alunoId` e `perfil`.
- Respostas de erro usam `{ "codigo": "...", "mensagem": "..." }`.
- Códigos principais: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409` e `422`.

### 5.2 Autenticação

| Método e rota | Acesso | Entrada | Saída principal | Relacionados |
| --- | --- | --- | --- | --- |
| `POST /api/auth/login` | Público | `email`, `senha` | token e dados básicos do aluno | RF-01, RF-12, RNF-03 |

### 5.3 Anúncios

| Método e rota | Acesso | Entrada | Saída principal | Relacionados |
| --- | --- | --- | --- | --- |
| `GET /api/anuncios` | Autenticado | `busca`, `categoria`, `estado` | anúncios `DISPONIVEL` paginados | RF-02, RF-11 |
| `GET /api/anuncios/:id` | Autenticado | id na rota | detalhes do anúncio | RF-03 |
| `POST /api/anuncios` | `ANUNCIANTE` | item, descrição, categoria, estado, preço | anúncio criado | RF-04, RN-04, RN-06 |
| `PATCH /api/anuncios/:id` | Autor `ANUNCIANTE` | campos editáveis | anúncio atualizado | RF-05, RN-02, RN-05 |
| `DELETE /api/anuncios/:id` | Autor `ANUNCIANTE` | id na rota | sem corpo | RF-05, RN-01, RN-02, RN-05 |

`DELETE` não apaga fisicamente. Ele muda o status para `CANCELADO`, encerra eventual reserva ativa e preserva a rastreabilidade.

### 5.4 Reservas

| Método e rota | Acesso | Entrada | Saída principal | Relacionados |
| --- | --- | --- | --- | --- |
| `POST /api/anuncios/:id/reservas` | `INTERESSADO` | id do anúncio | reserva e data de expiração | RF-06, RN-02, RN-03 |
| `PATCH /api/reservas/:id/confirmacao` | Autor do anúncio | id da reserva | reserva confirmada e anúncio concluído | RF-07, RN-01, RN-03, RN-05 |

A criação da reserva deve bloquear a linha do anúncio, confirmar que ele está `DISPONIVEL`, verificar que o interessado não é o autor e criar a única reserva ativa dentro da mesma transação.

### 5.5 Perfil, histórico e painel

| Método e rota | Acesso | Entrada | Saída principal | Relacionados |
| --- | --- | --- | --- | --- |
| `GET /api/me` | Autenticado | nenhuma | dados da conta e perfil | RF-01, RF-09 |
| `GET /api/me/anuncios` | `ANUNCIANTE` | filtro opcional por status | anúncios do autor | RF-05, RF-09 |
| `GET /api/me/negociacoes` | Autenticado | nenhuma | negociações concluídas relacionadas ao aluno | RF-09, RN-05 |
| `GET /api/dashboard` | Autenticado | nenhuma | totais por categoria e status | RF-10 |

O painel pode apresentar três indicadores: total disponível, total reservado e total concluído, acompanhados pelos agrupamentos por categoria e status.

## 6. Formatos principais

### 6.1 Criação de anúncio

```json
{
  "item": "Livro de matemática",
  "descricao": "Livro usado, sem páginas rasgadas",
  "categoria": "LIVRO",
  "estadoConservacao": "BOM",
  "preco": 0
}
```

### 6.2 Resposta resumida de anúncio

```json
{
  "id": "uuid",
  "item": "Livro de matemática",
  "categoria": "LIVRO",
  "estadoConservacao": "BOM",
  "preco": 0,
  "precoExibicao": "Troca",
  "status": "DISPONIVEL",
  "autor": {
    "id": "uuid",
    "nome": "Aluno anunciante"
  }
}
```

`precoExibicao` pode ser calculado no backend ou no frontend, mas a regra deve ter teste e comportamento uniforme.

## 7. Telas, perfis e wireframes

### 7.1 Um único software com navegação por perfil

O Brechó Estudantil é uma única aplicação. Após o login, a barra lateral mostra somente as ações permitidas ao perfil autenticado. A logo permanece no canto superior direito em todas as telas autenticadas.

| Tela | Interessado | Anunciante | Base atual |
| --- | --- | --- | --- |
| Menu | indicadores do brechó | indicadores do brechó | RF-10 |
| Brechó | buscar e abrir cards | buscar e abrir cards | RF-02, RF-03 |
| Detalhes do item | reservar | somente leitura | RF-03, RF-06; wireframe a definir |
| Favoritos† | acessar pelo ícone no topo | - | evolução proposta |
| Minhas reservas | acompanhar reservas | - | RF-06, RF-09 |
| Histórico de compras/negociações | consultar concluídos e avaliações† | consultar concluídos | RF-09 |
| Cadastro | - | criar e editar anúncio | RF-04, RF-05 |
| Minha vitrine/loja | - | ver anúncios próprios | RF-05, RF-09 |
| Gerenciar reservas/anúncios | - | confirmar, cancelar quando permitido e consultar status | RF-05, RF-07 |

Os dados básicos do aluno ficam no cartão lateral. `Favoritos†` é acessado pelo ícone de estrela ao lado da logo; `Avaliações†` fica dentro do Histórico, não como item próprio de menu. As evoluções marcadas com `†` não integram o MVP enquanto Requirements e Tasks não forem atualizados. Avaliação não pode usar nota, estrela ou reputação do vendedor, pois isso está fora do escopo atual.

### 7.2 Estrutura visual FHD

Os quadros representam uma tela de `1920 x 1080 px`: barra lateral aproximada de `360 px`, conteúdo principal no restante e cards somente textuais. Não incluir chat, imagens, pagamentos, frete ou cadastro de listas fixas.

#### Login

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                               [ LOGO BRECHÓ ESTUDANTIL ]     │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│                                      BEM-VINDO AO BRECHÓ ESTUDANTIL                                          │
│                                                                                                              │
│                                      E-mail  [_______________________________]                               │
│                                      Senha   [_______________________________]                               │
│                                                                                                              │
│                                                   [ Entrar ]                                                 │
│                                                                                                              │
│                                      Credenciais inválidas aparecem aqui.                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

A barra lateral aparece somente após a autenticação.

#### Menu

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  MENU                                              [ LOGO BRECHÓ ]          │
│     Aluna interessada          │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU                          │  Visão geral do Brechó                                                      │
│                                │                                                                             │
│  ▣  Menu                       │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  □  Brechó                     │  │ 12             │  │ 3              │  │ 8              │                 │
│                                │  │ Disponíveis    │  │ Reservados     │  │ Concluídos     │                 │
│  □  Minhas reservas            │  └────────────────┘  └────────────────┘  └────────────────┘                 │
│  □  Histórico                  │                                                                             │
│                                │  Categoria: Livro 6 · Uniforme 5 · Material 4 · Eletrônico 3                │
│                                │                                                                             │
│                                │  Status: Disponível 12 · Reservado 3 · Concluído 8                          │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

#### Brechó - cards e filtros

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  BRECHÓ                                            [ LOGO BRECHÓ ]          │
│     Aluna interessada          │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU                          │  [ Buscar por item... ]  [ Categoria ▾ ]  [ Conservação ▾ ]                 │
│                                │                                                                             │
│  □  Menu                       │  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐    │
│  ▣  Brechó                    │   │ Livro de matemática │ │ Uniforme escolar    │ │ Calculadora        │     │
│  □  Minhas reservas            │  │ Livro · Bom         │ │ Uniforme · Usado    │ │ Eletrônico · Novo   │    │
│  □  Histórico                  │  │ Troca               │ │ R$ 35,00            │ │ R$ 50,00            │    │
│                                │  │ [ Ver detalhes ]    │ │ [ Ver detalhes ]    │ │ [ Ver detalhes ]    │    │
│                                │  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘    │
│                                │                                                                             │
│                                │  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐    │
│          [ Sair ]              │  │ Caderno             │ │ Mochila             │ │ Régua técnica       │    │
│                                │  │ Material · Bom      │ │ Outro · Usado       │ │ Material · Novo     │    │
│                                │  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

Cards usam texto porque upload de imagens é fora do escopo.

#### Detalhes do item

Esta tela continua prevista por RF-03 e RF-06, mas o seu wireframe ficará a cargo do planejamento posterior do usuário. Quando existir, deverá manter o ícone de favoritos ao lado da logo e exibir a reserva somente para o interessado em anúncio disponível.

#### Minhas reservas e histórico

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  MINHAS RESERVAS                                    [ LOGO BRECHÓ ]         │
│     Aluna interessada          │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU                          │  [ Reservas ]  [ Histórico de negociações ]                                 │
│                                │                                                                             │
│  □  Menu                       │  Livro de matemática      Reservado       Expira em 2 dias                  │
│  □  Brechó                     │  Uniforme escolar         Concluído      18/08/2026                         │
│                                │                                                                             │
│  ▣ Minhas reservas            │  Histórico de compras, trocas e doações concluídas                          │
│  □  Histórico                  │  Caderno universitário   Concluído      Troca                               │
│                                │                                                                             │
│                                │  Avaliações †: ficam dentro do Histórico, sem nota/estrela do vendedor.     │
│                                │                                                                             │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

`Histórico de compras` é exibido como histórico de negociações, pois a solução também cobre troca e doação.

#### Favoritos †

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  FAVORITOS †                                       [ LOGO BRECHÓ ]          │
│     Aluna interessada          │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU                          │  Itens salvos pelo interessado                                              │
│                                │                                                                             │
│  □  Menu                       │  ┌─────────────────────┐ ┌─────────────────────┐                            │
│  □  Brechó                     │  │ Livro de química      │ │ Mochila azul        │                          │
│  ▣  Favoritos †                │  │ Disponível · Troca    │ │ Disponível · R$ 40  │                          │
│  □  Minhas reservas            │  │ [ Ver detalhes ]      │ │ [ Ver detalhes ]    │                          │
│  □  Histórico                  │  └─────────────────────┘ └─────────────────────┘                            │
│                                │                                                                             │
│                                │  † Proposta visual; exige requisito, dados e tarefa próprios.               │
│                                │                                                                             │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

#### Cadastro

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  CADASTRO - Novo anúncio                             [ LOGO BRECHÓ ]        │
│     Aluna anunciante           │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU                          │  Item        [____________________________________________________]         │
│                                │                                                                             │
│  □  Minha vitrine/loja         │  Categoria   [ Selecione ▾ ]       Conservação [ Selecione ▾ ]              │
│  □  Brechó                     │                                                                             │
│  ▣  Cadastro                   │  Preço       [__________]          0 = Troca                                │
│  □  Gerenciar                  │                                                                             │
│                                │  Descrição   [____________________________________________________]         │
│                                │              [____________________________________________________]         │
│                                │                                                                             │
│                                │  [ Cancelar ]                                  [ Salvar anúncio ]           │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

#### Minha vitrine/loja

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  MINHA VITRINE / LOJA                              [ LOGO BRECHÓ ]          │
│     Aluna anunciante           │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU                          │  [ + Novo anúncio ]   [ Todos ▾ ]                                           │
│                                │                                                                             │
│  ▣  Minha vitrine/loja         │  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐    │
│  □  Brechó                     │  │ Livro de matemática  │ │ Uniforme escolar   │ │ Calculadora         │    │
│  □  Cadastro                   │  │ Disponível · Troca   │ │ Reservado · R$ 35  │ │ Concluído · R$ 50   │    │
│  □  Gerenciar                  │  │ [ Editar ]            │ │ [ Gerenciar ]     │ │ Somente leitura     │    │
│                                │  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘    │
│                                │                                                                             │
│                                │  Concluído permanece no histórico e não pode ser alterado.                  │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

#### Gerenciar reservas/anúncios

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  GERENCIAR RESERVAS / ANÚNCIOS                       [ LOGO BRECHÓ ]        │
│     Aluna anunciante           │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU                          │  [ Reservas pendentes ] [ Histórico ]                                       │
│                                │                                                                             │
│  □  Minha vitrine/loja         │  RESERVAS PENDENTES                                                         │
│  □  Brechó                     │  ┌─────────────────────────────────────────────────────────────────────┐    │
│  □  Cadastro                   │  │ Livro de matemática · Reservado · Ana Silva                         │    │
│  ▣  Gerenciar                  │  │ Reserva: 16/08/2026 · Expira: 19/08/2026                            │    │
│                                │  │ [ Confirmar negociação ]   [ Recusar e liberar item † ]             │    │
│                                │  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                                                             │
│                                │  ANÚNCIOS POR STATUS                                                        │
│                                │  Uniforme escolar     Disponível      [ Editar ] [ Cancelar anúncio ]       │
│                                │  Calculadora          Concluído       Somente leitura                       │
│                                │  Caderno              Cancelado       Mantido no histórico                  │
│                                │                                                                             │
│          [ Sair ]              │  Nenhum anúncio recebe status além das listas fixas.                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
~~~

**Confirmar negociação** segue RF-07. **Recusar e liberar item†** é uma proposta: precisa ser formalizada em requisito, endpoint, tarefa e teste antes de virar ação real. Anúncios concluídos não podem ser removidos ou alterados.

## 8. Navegação por perfil

~~~text
ANUNCIANTE
Login -> Menu -> Cadastro -> Minha vitrine/loja -> Gerenciar -> Confirmar -> Concluído
                   |               \-> Brechó (consulta)
                   \-> Histórico na vitrine/gerenciamento

INTERESSADO
Login -> Menu -> Brechó -> Detalhes -> Reservar -> Minhas reservas -> Histórico -> Avaliações †
                   |          \-> Favoritar † (ícone ao lado da logo)
                   \-> Histórico de negociações
~~~

A API deve aplicar as permissões, mesmo quando a interface esconde ações não permitidas.
## 9. Aplicação das regras de negócio

| Regra | Onde aplicar | Resposta esperada em caso de violacao |
| --- | --- | --- |
| RN-01 | Serviço de anúncios e reservas, dentro de transações | `409` para transição inválida |
| RN-02 | Middleware de perfil e verificação de `autor_id` | `403` para usuário sem permissão |
| RN-03 | Serviço de reserva, índice único parcial e rotina de expiração | `409` se já houver reserva ativa |
| RN-04 | Serviço de criação com contagem bloqueada por autor | `422` ao atingir 5 ativos |
| RN-05 | Serviço de atualização, exclusão e confirmação | `409` ao tentar mudar concluído |
| RN-06 | Validação do preço e formatação de exibição | `422` para negativo; `Troca` para zero |

## 10. Fluxos críticos

### 10.1 Criar anúncio

1. Autenticar e exigir perfil `ANUNCIANTE`.
2. Validar campos e valores das listas fixas.
3. Abrir transação e contar anúncios `DISPONIVEL` ou `RESERVADO` do autor.
4. Rejeitar se a contagem for 5.
5. Criar o anúncio como `DISPONIVEL`.
6. Confirmar a transação e devolver o recurso criado.

### 10.2 Reservar item

1. Autenticar e exigir perfil `INTERESSADO`.
2. Encerrar reservas vencidas relacionadas ao anúncio.
3. Abrir transação e bloquear o anúncio.
4. Exigir status `DISPONIVEL` e impedir reserva do próprio item.
5. Criar a reserva com expiração em 3 dias.
6. Mudar o anúncio para `RESERVADO` e confirmar a transação.

### 10.3 Confirmar negociação

1. Autenticar o autor do anúncio.
2. Encerrar reservas vencidas.
3. Abrir transação e bloquear anúncio e reserva.
4. Exigir reserva ativa, não vencida e anúncio `RESERVADO`.
5. Marcar a reserva como inativa e confirmada.
6. Mudar o anúncio para `CONCLUIDO` e registrar `concluido_em`.
7. Confirmar a transação.

### 10.4 Expirar reserva

1. Localizar reservas ativas com `expira_em <= agora`.
2. Dentro de transação, marcar cada reserva como inativa e encerrada.
3. Retornar o anúncio ainda reservado para `DISPONIVEL`.
4. Não alterar anúncios já cancelados ou concluídos.

## 11. Estratégia de testes

- testes unitários para formatação do preço e validação das transições;
- testes de integração para endpoints, autenticação e permissão;
- testes transacionais para reserva única e limite de anúncios;
- teste com relógio controlado para expiração em 3 dias;
- testes de interface para login, CRUD, filtros, reserva, confirmação, histórico e painel;
- um fluxo ponta a ponta cobrindo `DISPONIVEL -> RESERVADO -> CONCLUIDO`.
