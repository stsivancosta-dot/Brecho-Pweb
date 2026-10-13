# Requirements — Brechó Estudantil

## 1. Objetivo e problema  ----------------------------------------------------

O Brechó Estudantil é uma aplicação web para alunos anunciarem, encontrarem, reservarem e concluírem negociações de itens relacionados à vida escolar. Ela concentra ofertas que hoje circulam informalmente e registra o fluxo básico de uma negociação.

O sistema termina na confirmação do anunciante. Contato, pagamento, troca e entrega acontecem presencialmente, fora da aplicação.

Fluxo prioritário:

1. um aluno publica um anúncio;
2. outro aluno encontra o item no catálogo, com busca ou filtros;
3. o interessado consulta os detalhes e reserva o item;
4. o anunciante confirma a negociação;
5. ambos consultam o registro no histórico.

## 2. Atores e permissões 

Há um único tipo de conta: Aluno. Uma mesma conta pode anunciar itens e também reservar itens publicados por outros alunos. Não existem perfis exclusivos de anunciante e interessado, apenas suas mutagens.

| Ação | Aluno autenticado |
| --- | --- |
| Consultar catálogo e detalhes | Sim |
| Criar, editar e cancelar anúncio próprio | Sim, conforme status |
| Reservar anúncio de outro aluno disponível | Sim |
| Reservar anúncio próprio | Não |
| Confirmar reserva de anúncio próprio | Sim |
| Alterar, cancelar ou confirmar anúncio de outro aluno | Não |
| Consultar anúncios e negociações dos quais participa | Sim |

## 3. Requisitos

### RF-01 — Autenticação e sessão

O sistema deve autenticar contas de alunos previamente cadastradas por e-mail e senha. Após o login, deve disponibilizar uma sessão autenticada com a identificação do aluno. Não há autocadastro nem recuperação de senha nesta versão.

**Aceite:** credenciais válidas iniciam sessão; credenciais inválidas retornam erro compreensível; rota protegida sem sessão é recusada.

### RF-02 — Catálogo, busca e filtros

O sistema deve listar anúncios com status DISPONIVEL e permitir busca textual por item ou descrição, filtros por categoria e estado de conservação e paginação.

**Aceite:** um anúncio disponível compatível aparece; anúncios RESERVADO, CONCLUIDO e CANCELADO não aparecem no catálogo público; filtros podem ser combinados.

### RF-03 — Detalhes do anúncio

O sistema deve mostrar item, descrição, categoria, estado de conservação, preço exibido, status, nome do anunciante e datas relevantes do anúncio.

**Aceite:** preço zero é exibido como Troca; a ação de reservar só é apresentada quando o anúncio está disponível e pertence a outro aluno.

### RF-04 — Cadastro de anúncio

O sistema deve permitir que um aluno crie anúncio com item, descrição, categoria, estado de conservação e preço. O preço é opcional: quando omitido, deve ser persistido como zero.

**Aceite:** campos obrigatórios e valores fixos são validados; anúncio novo inicia como DISPONIVEL; criação é recusada acima do limite de anúncios ativos.

### RF-05 — Edição e cancelamento de anúncio

O sistema deve permitir que o autor edite um anúncio DISPONIVEL. O autor também pode cancelá-lo logicamente enquanto não estiver CONCLUIDO. Cancelamento não pode apagar dados históricos.

**Aceite:** outro aluno recebe acesso negado; anúncio CONCLUIDO não é editável nem cancelável; anúncio CANCELADO não volta ao catálogo.

### RF-06 — Reserva de item

O sistema deve permitir que um aluno reserve anúncio DISPONIVEL de outro aluno. A reserva deve registrar interessado, instante da reserva e expiração em três dias.

**Aceite:** uma reserva válida altera o anúncio para RESERVADO; o autor não consegue reservar o próprio item; tentativas concorrentes resultam em apenas uma reserva ativa.

### RF-07 — Confirmação da negociação

O autor de um anúncio RESERVADO deve poder confirmar sua negociação ativa. A confirmação encerra a reserva e conclui o anúncio.

**Aceite:** somente o autor do anúncio confirma; a operação deixa anúncio e reserva consistentes como concluídos; não há retorno de CONCLUIDO para outro estado.

### RF-08 — Expiração de reserva

O sistema deve liberar reserva não confirmada após três dias e restaurar o anúncio para DISPONIVEL.

**Aceite:** reserva expirada fica registrada como expirada/inativa; o anúncio volta ao catálogo; ela não pode ser confirmada depois.

### RF-09 — Minha atividade e histórico

O sistema deve permitir ao aluno consultar seus anúncios, suas reservas e as negociações concluídas das quais participou. O histórico deve informar qual papel o aluno teve na negociação.

**Aceite:** dados de outro aluno não são expostos em listas privadas; itens concluídos permanecem disponíveis apenas para leitura no histórico.

### RF-10 — Indicadores simples

Após as funcionalidades centrais, o sistema deve apresentar de dois a três indicadores simples, com totais de anúncios por status e/ou categoria.

**Aceite:** os totais são calculados a partir dos dados persistidos e não são necessários para concluir o fluxo principal.

### RF-11 — Listas fixas

Categoria, estado de conservação e status devem aceitar apenas os valores definidos na seção 6. Não deve haver tela ou API administrativa para cadastrar esses valores.

**Aceite:** valor fora da lista é recusado pela API; a interface oferece somente valores permitidos.

### RF-12 — Controle de acesso e autoria

Toda operação protegida deve validar a sessão e a autorização no servidor. A interface pode ocultar ações inválidas, mas não substitui a validação da API.

**Aceite:** ações sem autenticação retornam 401; ações autenticadas sem permissão ou autoria retornam 403.



## 4. Listas fixas

| Lista | Valores permitidos |
| --- | --- |
| Categoria | UNIFORME, MATERIAL_ESCOLAR, LIVRO, ELETRONICO, OUTRO |
| Estado de conservação | NOVO, BOM, USADO |
| Status do anúncio | DISPONIVEL, RESERVADO, CONCLUIDO, CANCELADO |
| Status da reserva | ATIVA, CONFIRMADA, EXPIRADA, CANCELADA |

## 5. Regras de negócio

### RN-01 — Ciclo do anúncio

O ciclo normal é DISPONIVEL → RESERVADO → CONCLUIDO. Um anúncio DISPONIVEL ou RESERVADO pode ser cancelado pelo autor e passa a CANCELADO. CONCLUIDO e CANCELADO são finais para esta versão.

### RN-02 — Autoria e impedimento de autorreserva

Somente o autor edita, cancela ou confirma anúncio próprio. Um aluno não pode reservar anúncio cuja autoria é sua.

### RN-03 — Reserva única e expiração

Cada anúncio tem no máximo uma reserva ATIVA. Ela expira exatamente três dias após sua criação quando não confirmada; então fica EXPIRADA e o anúncio volta a DISPONIVEL.

### RN-04 — Limite de anúncios ativos

Um aluno pode possuir no máximo cinco anúncios ativos. São ativos somente os anúncios DISPONIVEL ou RESERVADO.

### RN-05 — Imutabilidade da conclusão

Anúncio CONCLUIDO e sua reserva CONFIRMADA formam registro histórico somente para leitura. Eles não podem ser editados, cancelados ou reabertos.

### RN-06 — Preço zero

Preço é número não negativo. Valor ausente no cadastro é convertido para zero. No banco e na API o valor é 0; em toda interface ele é mostrado como Troca, nunca R$ 0,00.

### RN-07 — Cancelamento preserva histórico

Cancelar altera o status do anúncio para CANCELADO sem exclusão física. Se houver reserva ATIVA, ela deve mudar para CANCELADA no mesmo processo e ficar registrada no histórico.

## 6. Restrições e fora do escopo

O MVP não inclui:

- imagens, anexos ou upload de arquivos;
- chat, mensagens ou contato mediado entre alunos;
- pagamentos online, carrinho, frete ou cálculo de entrega;
- favoritos;
- avaliações, notas, estrelas ou reputação de vendedor;
- recusa manual de reserva;
- notificações por e-mail, WhatsApp ou push;
- aplicativos mobile, PWA ou responsividade avançada;
- telas administrativas para listas fixas;
- integrações externas, exportação, auditoria completa, backup, produção ou adequação completa à LGPD.

## 7. Critérios gerais de aceitação

1. aluno autenticado consegue criar anúncio permitido;
2. outro aluno consegue localizar, detalhar e reservar esse anúncio;
3. o autor consegue confirmar a reserva e ambos visualizam o registro concluído;
4. reserva vencida libera o anúncio corretamente;
5. autoria, autorreserva, limite de cinco ativos e imutabilidade de concluídos são bloqueados no servidor;
6. preço zero aparece como Troca em todas as respostas de apresentação;
7. nenhum recurso fora do escopo é necessário para completar o fluxo principal.
