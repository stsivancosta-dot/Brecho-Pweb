# Brechó Estudantil ana@escola.local

> Um espaço simples para alunos anunciarem, encontrarem, venderem ou trocarem itens ligados à vida escolar.

## Sobre o projeto

O **Brechó Estudantil** aproxima alunos que possuem itens parados de colegas que precisam deles. A proposta é organizar negociações que hoje acontecem de boca a boca, facilitando a circulação de uniformes, materiais escolares, livros e eletrônicos usados dentro da comunidade acadêmica.

```text
🎒 Quem tem um item  →  📢 publica um anúncio
🔎 Quem precisa      →  🤝 encontra e reserva
🏫 Os dois combinam  →  ✅ concluem pessoalmente
```

## Como funciona1

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

- [Requisitos](./requirements.md)
- [Design](./design.md)
- [Tarefas](./tasks.md)

Se você for clonar/importar o projeto do GitHub em uma máquina nova (ou em outra pasta), aqui está o guia passo a passo do que precisa fazer.

1. Será necessário entrar no pgAdmin?

Sim, mas apenas uma única vez para criar o banco de dados vazio. O pgAdmin não precisa de nenhuma configuração de tabelas manuais, pois o código cria tudo sozinho. O único papel do pgAdmin é:

Abrir o pgAdmin e conectar ao seu PostgreSQL.
Clicar com o botão direito em Databases ➔ Create ➔ Database...
Dar o nome de: brecho_estudantil e clicar em Save.

(Depois disso você já pode fechar o pgAdmin, não precisará mexer em mais nada nele).

2. Comandos e Configurações no Terminal

Abra o terminal (Git Bash, PowerShell ou Prompt de Comando) e siga a ordem:

Passo 1: Clonar e entrar na pasta
bash
git clone <URL_DO_SEU_REPOSITORIO>
cd brecho
Passo 2: Instalar as dependências
bash
npm install
Passo 3: Configurar o arquivo .env

O arquivo .env não sobe para o GitHub por segurança (está no .gitignore). Por isso, você precisa criá-lo a partir do .env.example:

No Windows (PowerShell):

powershell
Copy-Item .env.example .env

(ou simplesmente crie um arquivo chamado .env na raiz do projeto manualmente).

Abra o .env e coloque a sua senha do PostgreSQL:

env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=brecho_estudantil
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres
JWT_SECRET=qualquer_texto_longo_aqui_para_seguranca
DEMO_PASSWORD=qwerty
Passo 4: Criar as tabelas e os usuários de teste

Execute os scripts do projeto que criam toda a estrutura no banco automaticamente:

bash
npm run db:migrate
npm run db:seed
O db:migrate cria as tabelas de alunos, anúncios e reservas.
O db:seed já cadastra a Ana e o Bruno com a senha qwerty.
3. Rodando o Projeto

Depois de configurado, basta abrir dois terminais:

Terminal 1 (Backend):
bash
npm run dev
Terminal 2 (Frontend):
bash
npm run frontend:dev

Acesse no navegador pelo link exibido no Terminal 2 (ex: http://127.0.0.1:5173) e faça login com ana@escola.local e senha qwerty.
