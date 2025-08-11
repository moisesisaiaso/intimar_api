const controller = require("../controllers/configuracion.controller");
const { authJwt } = require("../middleware");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get(
        "/intimar/configuracion",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.readConfiguration);

    app.put(
        "/intimar/configuracion/:id",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.updateConfiguration);
};