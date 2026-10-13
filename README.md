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
