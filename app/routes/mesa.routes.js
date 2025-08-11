const { authJwt } = require("../middleware");
const controller = require("../controllers/mesa.controller");

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
        "/intimar/mesa",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"])
        ],
        controller.allMesas
    );

    app.post(
        "/intimar/mesa",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
        ],
        upload.single('file'),
        controller.createMesa
    );

    app.put(
        "/intimar/mesa/:id",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
        ],
        upload.single('file'),
        controller.updateMesa
    );

    app.delete(
        "/intimar/mesa/:id",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
        ],
        controller.deleteMesa
    );

    app.post(
        "/intimar/mesa/:id/reserva",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista", "anfitrion"]),
        ],
        controller.allReservasByMesa
    );

    app.get(
        "/intimar/mesa/mesaId/:id",
        [
          authJwt.verifyToken,
          authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"]),
        ],
        controller.findMesaById
      );
}