const { authJwt } = require("../middleware");
const controller = require("../controllers/client.controller");
const { verifyClient } = require("../middleware");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/intimar/client",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.allClients
  );

  app.post(
    "/intimar/client",
    controller.createClient
  );

  app.post(
    "/intimar/client/v2",
    [
      verifyClient.checkDuplicateCellphoneOrEmail
    ],
    controller.createClient
  );

  app.put(
    "/intimar/client/:id",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.updateClient
  );

  app.delete(
    "/intimar/client/:id",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
    ],
    controller.deleteClient
  );
  
  app.post(
    "/intimar/client/findByName",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"])
    ],
    controller.findClientByNameOrLastName
  );

  app.get(
    "/intimar/client/findById/:id",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findClientById
  );

  app.post(
    "/intimar/client/findByEmail",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findClientByEmail
  );

  app.post(
    "/intimar/client/findByCellphone",
    [
      authJwt.verifyToken,
      authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
    ],
    controller.findClientByCellphone
  );
};