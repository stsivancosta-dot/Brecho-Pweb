# Brechó Estudantil (!1)

> Um espaço simples para alunos anunciarem, encontrarem, venderem ou trocarem itens ligados à vida escolar.

## Sobre o projeto

O **Brechó Estudantil** aproxima alunos que possuem itens parados de colegas que precisam deles. A proposta é organizar negociações que hoje acontecem de boca a boca, facilitando a circulação de uniformes, materiais escolares, livros e eletrônicos usados dentro da comunidade acadêmica.

```text
🎒 Quem tem um item  →  📢 publica um anúncio
🔎 Quem precisa      →  🤝 encontra e reserva
🏫 Os dois combinam  →  ✅ concluem pessoalmente
```

## Como funciona

1. O aluno anunciante cadastra o item com nome, descrição, categoria, estado de conservação e preço opcional.
2. Outros alunos consultam os itens disponíveis, pesquisam por texto e usam filtros.
3. Um aluno interessado reserva o item.
4. O anunciante confirma a negociação e a entrega acontece pessoalmente.
5. Depois de concluído, o anúncio fica no histórico dos participantes.

### Jornada de um item

```text
🟢 Disponível  →  🟡 Reservado  →  🟣 Concluído
       └─────── ❌ Cancelado ←───────┘
```

Se uma reserva não for confirmada em até **3 dias**, ela expira e o item volta a ficar disponível.

## O que pode ser anunciado

- 👕 Uniformes
- ✏️ Materiais escolares
- 📚 Livros
- 💻 Eletrônicos
- 📦 Outros itens relacionados ao ambiente acadêmico

Os itens podem ser vendidos, doados ou trocados. Quando o preço informado for zero, o anúncio aparece como **Troca**.

## Perfis de uso

- **Aluno anunciante:** publica e gerencia os próprios anúncios e confirma negociações.
- **Aluno interessado:** busca itens, aplica filtros e faz reservas.

Um mesmo aluno pode atuar das duas formas, conforme a negociação.

## Recursos principais

- Cadastro e gerenciamento de anúncios
- Busca e filtros por categoria e estado de conservação
- Reserva de itens disponíveis
- Confirmação e histórico de negociações
- Painel com totais de itens por categoria e situação
- Limite de **5 anúncios ativos** por aluno

## Limites desta versão

Para manter a solução direta e adequada ao ambiente escolar, esta versão não inclui pagamento ou frete, chat, fotos dos itens nem avaliação de vendedores. Todo o contato final e a entrega acontecem pessoalmente entre os alunos.

## Documentação

O planejamento do projeto está dividido em três specs:

- [Requisitos]
- [Design]
- [Tarefas]

## Desenvolvimento

Pré-requisito: Node.js 24 ou compatível.

1. Copie .env.example para .env e ajuste as variáveis do PostgreSQL.
2. Defina JWT_SECRET e DEMO_PASSWORD no arquivo .env; não use senhas reais.
3. Execute npm run db:migrate para criar a estrutura no PostgreSQL.
4. Execute npm run db:seed para criar Ana e Bruno como contas de demonstração; ambas usam a senha definida em DEMO_PASSWORD.
5. Execute npm test para validar regras locais e npm run dev para iniciar a API.
6. Em outro terminal, execute npm run frontend:dev para abrir a interface.

O projeto usa PostgreSQL real. Não há armazenamento em memória ou simulação de persistência.

Se alterar DEMO_PASSWORD depois de criar as contas, execute npm run db:reset-demo para atualizar somente as senhas das contas de demonstração existentes.

# Guia de instalação — Brechó Estudantil

Este guia apresenta o procedimento necessário para clonar, configurar e executar o projeto **Brechó Estudantil** em uma máquina nova ou em outra pasta.

## 1. Configuração do banco de dados pelo pgAdmin

Será necessário acessar o pgAdmin apenas uma vez para criar o banco de dados vazio.

Não é necessário criar tabelas ou configurar relacionamentos manualmente, pois o próprio código do projeto realiza essas operações.

Siga os passos:

1. Abra o pgAdmin e conecte-se ao PostgreSQL.
2. Clique com o botão direito em **Databases**.
3. Selecione **Create → Database...**.
4. Defina o nome do banco de dados como:

   ```text
   brecho_estudantil
   ```

5. Clique em **Save**.

Após a criação, o pgAdmin não precisará ser utilizado novamente durante a instalação.

## 2. Comandos e configurações no terminal

Abra um terminal (PowerShell, Git Bash ou Prompt de Comando) e execute as etapas na ordem apresentada.

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/stsivancosta-dot/Brecho-Pweb.git
cd Brecho-Pweb
```

### Passo 2 — Instalar as dependências

```bash
npm install
```

### Passo 3 — Configurar o arquivo `.env`

Por segurança, o arquivo `.env` não é enviado ao GitHub, pois está incluído no `.gitignore`.

Por isso, será necessário criá-lo a partir do arquivo `.env.example`.

**No Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

Alternativamente, você pode criar manualmente um arquivo chamado `.env` na raiz do projeto.

Abra o arquivo e configure as informações de conexão com o PostgreSQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=brecho_estudantil
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres
JWT_SECRET=qualquer_texto_longo_aqui_para_seguranca
DEMO_PASSWORD=qwerty
```

**Atenção:** substitua `sua_senha_do_postgres` pela senha definida durante a instalação do PostgreSQL.

### Passo 4 — Criar as tabelas e os usuários de teste

Execute os scripts responsáveis pela configuração automática do banco de dados:

```bash
npm run db:migrate
npm run db:seed
```

Esses comandos possuem as seguintes funções:

- **`db:migrate`:** cria a estrutura do banco de dados, incluindo as tabelas de alunos, anúncios e reservas.
- **`db:seed`:** cadastra os usuários e os dados iniciais de demonstração, incluindo Ana e Bruno, com a senha `qwerty`.

## 3. Executando o projeto

Após concluir as configurações, será necessário abrir **dois terminais** na pasta raiz do projeto.

### Terminal 1 — Backend

Execute:

```bash
npm run dev
```

Esse comando inicia o servidor responsável pelas operações do sistema.

### Terminal 2 — Frontend

Execute:

```bash
npm run frontend:dev
```

Esse comando inicia a aplicação frontend.

### Acessando o sistema

Após iniciar os dois servidores, acesse no navegador o endereço exibido pelo terminal do frontend.

Exemplo:

```text
http://127.0.0.1:5173
```

### Dados de acesso para teste

Utilize as seguintes credenciais para entrar no sistema:

| Campo | Informação |
|---|---|
| E-mail | `ana@escola.local` |
| Senha | `qwerty` |

---

**Instalação concluída!** O projeto estará configurado e pronto para utilização local.
