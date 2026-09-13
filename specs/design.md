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

## 7. Telas principais

### 7.1 Login

- campos de e-mail e senha;
- mensagem clara para credenciais inválidas;
- redirecionamento de acordo com o perfil.

### 7.2 Catálogo

- lista apenas anúncios disponíveis;
- busca textual;
- filtros de categoria e estado de conservação;
- acesso aos detalhes e ação de reservar para o perfil interessado.

### 7.3 Detalhe do anúncio

- informações completas do item e do anunciante;
- exibição de `Troca` para preço zero;
- status atual;
- botão de reserva somente quando permitido.

### 7.4 Formulário de anúncio

- criação e edição pelo anunciante;
- seletores baseados nas listas fixas;
- validação de campos obrigatórios e preço não negativo;
- bloqueio de alteração para anúncio concluído.

### 7.5 Meu perfil

- dados básicos do aluno;
- anúncios ativos do anunciante;
- reservas ou negociações relacionadas ao interessado;
- histórico de negociações concluídas.

### 7.6 Painel

- 2 a 3 indicadores resumidos;
- agrupamento por categoria;
- agrupamento por status.

### 7.7 Wireframes textuais

Os wireframes abaixo representam uma tela FHD de `1920 x 1080 px`. A barra lateral ocupa aproximadamente `360 px`; o conteúdo principal ocupa o restante. Eles definem estrutura e navegação, não o visual final.

**Padrão visual:** o menu lateral usa os nomes `Menu`, `Brechó`, `Vitrine` e `Perfil`. A logo fica no canto superior direito. Não incluir chat, imagens, pagamentos, frete ou cadastro das listas fixas.

| Item lateral | Tela correspondente |
| --- | --- |
| `Menu` | painel de indicadores |
| `Brechó` | catálogo e detalhe do anúncio |
| `Vitrine` | anúncios próprios, criação e edição |
| `Perfil` | dados do aluno e histórico |

#### Login

```text
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
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

A barra lateral aparece somente depois da autenticação, pois ela apresenta o aluno conectado.

#### Catálogo

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  BRECHÓ - Catálogo                              [ LOGO BRECHÓ ]             │
│     Aluna interessada          │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU PRINCIPAL                │  [ Buscar item... ]  [ Categoria ▾ ]  [ Conservação ▾ ]                     │
│                                │                                                                             │
│  □  Menu                       │  ┌───────────────────────────┐  ┌───────────────────────────┐               │
│  ▣  Brechó                     │  │ Livro de matemática        │  │ Uniforme escolar           │             │
│  □  Vitrine                    │  │ Livro · Bom · Troca        │  │ Uniforme · Usado · R$ 35   │             │
│  □  Perfil                     │  │ [ Ver detalhes ]           │  │ [ Ver detalhes ]           │             │
│                                │  └───────────────────────────┘  └───────────────────────────┘               │
│                                │                                                                             │
│                                │  12 itens disponíveis                                             1 2 ›     │
│                                │                                                                             │
│                                │                                                                             │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Detalhe do anúncio

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  ← Brechó  /  Livro de matemática                  [ LOGO BRECHÓ ]          │
│     Aluna interessada          │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU PRINCIPAL                │  Livro de matemática                                                        │
│                                │  Livro · Bom estado · Disponível                                            │
│  □  Menu                       │                                                                             │
│  ▣  Brechó                     │  Descrição                                                                  │
│  □  Vitrine                    │  Livro usado, sem páginas rasgadas.                                         │
│  □  Perfil                     │                                                                             │
│                                │  Valor: Troca               Anunciante: Ana Silva                           │
│                                │                                                                             │
│                                │                         [ Reservar item ]                                   │
│                                │                                                                             │
│          [ Sair ]              │  A reserva expira em 3 dias se não for confirmada.                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

O botão de reserva só aparece para o perfil interessado e para anúncio disponível de outro aluno.

#### Formulário de anúncio

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  VITRINE - Novo anúncio                            [ LOGO BRECHÓ ]          │
│     Aluna anunciante           │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU PRINCIPAL                │  Item        [____________________________________________________]         │
│                                │                                                                             │
│  □  Menu                       │  Categoria   [ Selecione ▾ ]       Conservação [ Selecione ▾ ]              │
│  □  Brechó                     │                                                                             │
│  ▣  Vitrine                    │  Preço       [__________]          0 = Troca                                │
│  □  Perfil                     │                                                                             │
│                                │  Descrição   [____________________________________________________]         │
│                                │              [____________________________________________________]         │
│                                │                                                                             │
│                                │  [ Cancelar ]                                  [ Salvar anúncio ]           │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Na edição, os mesmos campos são exibidos. Anúncios concluídos ficam somente para leitura.

#### Meu perfil

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  PERFIL                                            [ LOGO BRECHÓ ]          │
│     Aluna anunciante           │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU PRINCIPAL                │  Ana Silva · ana@escola.com · Anunciante                                    │
│                                │                                                                             │
│  □  Menu                       │  Meus anúncios ativos                              [ + Novo anúncio ]       │
│  □  Brechó                     │  ──────────────────────────────────────────────────────────────────         │
│  □  Vitrine                    │  Livro de matemática      Disponível                   [ Editar ]           │
│  ▣  Perfil                     │  Uniforme escolar         Reservado                [ Confirmar ]            │
│                                │                                                                             │
│                                │  Histórico                                                                  │
│                                │  Caderno universitário    Concluído                18/08/2026               │
│                                │                                                                             │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Para o perfil interessado, a seção central mostra reservas e negociações concluídas, sem botões de criar ou editar anúncio.

#### Painel

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ●  Ana Silva                  │  MENU                                              [ LOGO BRECHÓ ]          │
│     Aluna interessada          │                                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MENU PRINCIPAL                │  Visão geral do Brechó                                                      │
│                                │                                                                             │
│  ▣  Menu                       │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  □  Brechó                     │  │ 12             │  │ 3              │  │ 8              │                 │
│  □  Vitrine                    │  │ Disponíveis    │  │ Reservados     │  │ Concluídos     │                 │
│  □  Perfil                     │  └────────────────┘  └────────────────┘  └────────────────┘                 │
│                                │                                                                             │
│                                │  Por categoria                 Por status                                   │
│                                │  Livro  6 · Uniforme  5        Disponível  12 · Reservado  3                │
│                                │  Material  4 · Eletrônico  3   Concluído  8                                 │
│          [ Sair ]              │                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

O painel informa a situação do brechó e não cria uma ação administrativa sobre categorias, estados ou status.

## 8. Navegação por perfil

```text
ANUNCIANTE
Login -> Menu -> Vitrine -> Criar/Editar -> Confirmar reserva
            |       \-> Perfil -> Histórico
            \-> Brechó somente para consulta

INTERESSADO
Login -> Menu -> Brechó -> Detalhe -> Reservar
            |       \-> Perfil -> Histórico
            \-> Vitrine somente para consulta
```

O frontend pode esconder ações não permitidas, mas a API sempre deve repetir a verificação.

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
