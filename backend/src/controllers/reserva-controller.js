const reservaService = require("../services/reserva-service");

async function create(request, response) {
  return response.status(201).json(
    await reservaService.createReservation(request.params.id, request.aluno.id)
  );
}
async function confirm(request, response) {
  return response.status(200).json(
    await reservaService.confirmReservation(request.params.id, request.aluno.id)
  );
}
async function mine(request, response) {
  return response.status(200).json({
    dados: await reservaService.listMyReservations(request.aluno.id, request.query.status)
  });
}
async function received(request, response) {
  return response.status(200).json({
    dados: await reservaService.listReceivedReservations(request.aluno.id, request.query.status)
  });
}

module.exports = { confirm, create, mine, received };
