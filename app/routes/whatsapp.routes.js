const controller = require("../controllers/whatsapp.controller");
const { authJwt } = require("../middleware");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/intimar/whatsapp/:secretkey",
    controller.confirmarReserva
  )

  //Whatsapp API test
  app.post(
    "/intimar/whatsapp/api/test",
    [authJwt.verifyToken],
    controller.sendMessage
  )

  app.get(
    '/intimar/whatsapp/api/webhook', 
    controller.getWebhook
  );

  app.post(
    '/intimar/whatsapp/api/webhook', 
    controller.postWebhook
  );
};