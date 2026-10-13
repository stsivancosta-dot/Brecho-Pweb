function serializeAluno(aluno) {
  const source = aluno.get ? aluno.get({ plain: true }) : aluno;
  return { id: source.id, nome: source.nome, email: source.email };
}

function serializeAnuncio(anuncio, includeAuthor = true) {
  const source = anuncio.get ? anuncio.get({ plain: true }) : anuncio;
  const price = Number(source.preco);
  const result = {
    id: source.id, item: source.item, descricao: source.descricao,
    categoria: source.categoria, estadoConservacao: source.estado_conservacao,
    preco: price,
    precoExibicao: price === 0 ? "Troca" : "R$ " + price.toFixed(2).replace(".", ","),
    status: source.status, criadoEm: source.criado_em, atualizadoEm: source.atualizado_em,
    concluidoEm: source.concluido_em, canceladoEm: source.cancelado_em
  };
  if (includeAuthor && source.autor) result.anunciante = serializeAluno(source.autor);
  return result;
}

function serializeReserva(reserva) {
  const source = reserva.get ? reserva.get({ plain: true }) : reserva;
  return {
    id: source.id, anuncioId: source.anuncio_id, interessadoId: source.interessado_id,
    status: source.status, reservadoEm: source.reservado_em, expiraEm: source.expira_em,
    confirmadoEm: source.confirmado_em, encerradoEm: source.encerrado_em
  };
}

module.exports = { serializeAluno, serializeAnuncio, serializeReserva };
