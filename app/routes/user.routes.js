const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/intimar/test/all", controller.allAccess);

  app.get(
    "/intimar/test/user",
    [authJwt.verifyToken],
    controller.userBoard
  );

  app.get(
    "/intimar/test/receptionist",
    [authJwt.verifyToken, authJwt.isReceptionist],
    controller.receptionistBoard
  );

  app.get(
    "/intimar/test/administrator",
    [authJwt.verifyToken, authJwt.isAdministrator],
    controller.adminBoard
  );

  app.get(
    "/intimar/test/host",
    [authJwt.verifyToken, authJwt.isHost],
    controller.hostBoard
  );

  app.get(
    "/intimar/test/vigilant",
    [authJwt.verifyToken, authJwt.isVigilant],
    controller.vigilantBoard
  );

  app.get(
    "/intimar/test/waiter",
    [authJwt.verifyToken, authJwt.isWaiter],
    controller.waiterBoard
  );
};