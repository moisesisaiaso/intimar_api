const { authJwt } = require("../middleware");
const controller = require("../controllers/reserva.controller");
const { checkAforoMiddleware, updateReservaMiddleware } = require("../middleware");

const multer  = require('multer')
const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/intimar/reserva",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.allReservas
  )

  app.post(
    "/intimar/reserva",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    upload.single('file'),
    checkAforoMiddleware,
    controller.createReserva
  );

  //Create reserva forzoso
  app.post(
    "/intimar/reserva/force",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    upload.single('file'),
    controller.createReserva
  );

  //Relacion con mesas
  app.post(
    "/intimar/reserva/:id/mesa",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.asignarMesa
  );

  app.delete(
    "/intimar/reserva/:id/mesa",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.desasociarMesa
  );

  //Finalizar reserva
  app.post(
    "/intimar/reserva/:id/end",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.finalizarReserva
  );

  //Relacion con mozos
  app.post(
    "/intimar/reserva/:id/mozo",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.asignarMozo
  );

  app.post(
    "/intimar/reserva/fecha",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findReservasByDate
  );

  app.post(
    "/intimar/reserva/estado",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findReservasByStatus
  );

  app.post(
    "/intimar/reserva/fechahora",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findReservasByDateandHour
  );

  app.post(
    "/intimar/reserva/fecharangohora",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findReservasByDateandHours
  );

  app.post(
    "/intimar/reserva/aforo",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.obtenerAforoPorFechaYHora
  );

  app.get(
    "/intimar/reserva/clientId/:id",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findReservasByClientID
  );

  app.get(
    "/intimar/reserva/reservaId/:id",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findReservasByID
  );

  app.put(
    "/intimar/reserva/:id",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    upload.single('file'),
    updateReservaMiddleware,
    controller.updateReserva
  );

  app.delete(
    "/intimar/reserva/:id",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.deleteReserva
  );
};