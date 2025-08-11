const { authJwt } = require("../middleware");
const controller = require("../controllers/employee.controller");


module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get(
        "/intimar/employee",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.allEmployees);

    app.delete(
        "/intimar/employee/:id",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.deleteEmployee);

    app.get(
        "/intimar/employee/me",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"])
        ],
        controller.employeeMe);

    app.get(
        "/intimar/employee/profile",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista", "anfitrion", "vigilante", "mesero"])
        ],
        controller.employeeMeProfile);

    app.put(
        "/intimar/employee/:id",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.updateEmployee
    )

    app.get(
        "/intimar/employee/:id",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.getEmployeeById);

    app.post(
        "/intimar/employee/email",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.getEmployeeByEmail);

    app.post(
        "/intimar/employee/cellphone",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.getEmployeeByCellphone);

    app.post(
        "/intimar/employee/name",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.employeesByNameOrLastname);
    
    app.post(
        "/intimar/employee/role",
        [
            authJwt.verifyToken,
            authJwt.checkRoles(["administrador", "recepcionista"]),
        ],
        controller.employeesByRole);
};