function serializeAluno(aluno) {
  const source = aluno.get ? aluno.get({ plain: true }) : aluno;
  return {
    id: source.id,
    nome: source.nome,
    email: source.email,
    fotoPerfil: source.foto_perfil || null,
    criadoEm: source.criado_em || null
  };
}

function serializeAnuncio(anuncio, includeAuthor = true) {
  const source = anuncio.get ? anuncio.get({ plain: true }) : anuncio;
  const price = Number(source.preco ?? 0);
  const fotosArray = Array.isArray(source.fotos) && source.fotos.length > 0
    ? source.fotos
    : (source.foto_url ? [source.foto_url] : []);

  const result = {
    id: source.id,
    item: source.item,
    descricao: source.descricao,
    categoria: source.categoria,
    estadoConservacao: source.estado_conservacao,
    preco: price,
    precoExibicao: price === 0 ? "Troca" : "R$ " + price.toFixed(2).replace(".", ","),
    fotoUrl: fotosArray[0] || source.foto_url || null,
    fotos: fotosArray,
    status: source.status,
    criadoEm: source.criado_em,
    atualizadoEm: source.atualizado_em,
    concluidoEm: source.concluido_em,
    canceladoEm: source.cancelado_em
  };
  if (includeAuthor && source.autor) result.anunciante = serializeAluno(source.autor);
  return result;
}

function serializeReserva(reserva) {
  const source = reserva.get ? reserva.get({ plain: true }) : reserva;
  return {
    id: source.id,
    anuncioId: source.anuncio_id,
    interessadoId: source.interessado_id,
    status: source.status,
    reservadoEm: source.reservado_em,
    expiraEm: source.expira_em,
    confirmadoEm: source.confirmado_em,
    encerradoEm: source.encerrado_em
  };
}

function serializePedido(pedido) {
  const source = pedido.get ? pedido.get({ plain: true }) : pedido;
  return {
    id: source.id,
    anuncioId: source.anuncio_id,
    interessadoId: source.interessado_id,
    mensagem: source.mensagem || "",
    status: source.status,
    criadoEm: source.criado_em,
    atualizadoEm: source.atualizado_em,
    concluidoEm: source.concluido_em,
    anuncio: source.anuncio ? serializeAnuncio(source.anuncio) : null,
    interessado: source.interessado ? serializeAluno(source.interessado) : null
  };
}

function serializeAvaliacao(avaliacao) {
  const source = avaliacao.get ? avaliacao.get({ plain: true }) : avaliacao;
  return {
    id: source.id,
    alunoId: source.aluno_id,
    autorId: source.autor_id,
    anuncioId: source.anuncio_id,
    estrelas: source.estrelas,
    comentario: source.comentario || "",
    fixado: Boolean(source.fixado),
    criadoEm: source.criado_em,
    atualizadoEm: source.atualizado_em,
    autor: source.autor ? serializeAluno(source.autor) : null,
    anuncio: source.anuncio ? serializeAnuncio(source.anuncio, false) : null
  };
}

module.exports = {
  serializeAluno,
  serializeAnuncio,
  serializeReserva,
  serializePedido,
  serializeAvaliacao
};
