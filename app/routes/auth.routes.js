const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const controller = require("../controllers/auth.controller");
const { body } = require('express-validator');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/intimar/auth/signup",
    [
      // Validaciones con express-validator
      body('name').notEmpty().withMessage('El nombre es obligatorio'),
      body('lastname').notEmpty().withMessage('El apellido es obligatorio'),
      body('email').isEmail().withMessage('El correo debe ser una dirección válida'),
      body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
      body('cellphone').optional().isMobilePhone('any').withMessage('El teléfono debe ser un número válido'),
      
      // Middleware existente
      verifySignUp.checkDuplicateEmailOrCellphone,
      verifySignUp.checkRolesExisted,
      authJwt.verifyToken,
      authJwt.isAdministrator
    ],
    controller.signup
  );

  app.post("/intimar/auth/signin", controller.signin);

  app.post("/intimar/auth/refreshtoken", controller.refreshToken);

  app.post("/intimar/auth/logout", controller.logout);

};