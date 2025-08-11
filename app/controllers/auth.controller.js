const db = require("../models");
const config = require("../../config/auth.config");
const { validationResult } = require('express-validator');
const { user: User, role: Role, refreshToken: RefreshToken } = db;

const emailHelper = require("../helpers/email.helpers.js")

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  
  // Manejar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Verificar si el usuario con el mismo email ya ha sido eliminado
  User.findOne({ where: { email: req.body.email }, paranoid: false })
    .then(existingUser => {
      if (existingUser) {
        if (existingUser.deletedAt) {
          // Usuario encontrado y eliminado, restaurar y actualizar
          existingUser.restore()
            .then(() => {
              return existingUser.update({
                name: req.body.name,
                lastname: req.body.lastname,
                cellphone: req.body.cellphone || null,
                password: bcrypt.hashSync(req.body.password, 8)
              });
            })
            .then(user => {
              emailHelper.sendCredentialsEmail(req.body.email, req.body.password);
              assignRolesToUser(user, req, res, "Usuario restaurado correctamente!");
            })
            .catch(err => {
              res.status(500).send({ message: err.message });
            });
        } else {
          // Usuario existente, no se puede registrar de nuevo con el mismo correo
          res.status(400).send({ message: "El correo electrónico ya está en uso." });
        }
      } else {
        // Crear nuevo usuario
        User.create({
          name: req.body.name,
          lastname: req.body.lastname,
          cellphone: req.body.cellphone,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 8)
        })
          .then(user => {
            emailHelper.sendCredentialsEmail(req.body.email, req.body.password);
            assignRolesToUser(user, req, res, "Usuario creado correctamente!");
          })
          .catch(err => {
            res.status(500).send({ message: err.message });
          });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then(async (user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      const token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: config.jwtExpiration
      });

      let refreshToken = await RefreshToken.createToken(user);

      res.status(200).send({
          accessToken: token,
          refreshToken: refreshToken,
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (requestToken == null) {
    return res.status(403).json({ message: "Refresh Token is required!" });
  }

  try {
    let refreshToken = await RefreshToken.findOne({ where: { token: requestToken } });

    if (!refreshToken) {
      res.status(403).json({ message: "Refresh token is not in database!" });
      return;
    }

    if (RefreshToken.verifyExpiration(refreshToken)) {
      RefreshToken.destroy({ where: { id: refreshToken.id } });

      res.status(403).json({
        message: "Refresh token was expired. Please make a new signin request",
      });
      return;
    }

    const user = await refreshToken.getUser();
    let newAccessToken = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshToken.token,
    });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  try {
    // Buscar el token de actualización en la base de datos
    const refreshToken = await RefreshToken.findOne({ where: { token: requestToken } });

    // Si no se encuentra el token de actualización, enviar una respuesta 404
    if (!refreshToken) {
      return res.status(404).json({ message: "Refresh token not found in the database!" });
    }

    // Eliminar el token de actualización de la base de datos
    await RefreshToken.destroy({ where: { id: refreshToken.id } });

    // Enviar una respuesta 200 (OK) para indicar un logout exitoso
    return res.status(200).json({ message: "Logout successful" });

  } catch (error) {
    // Manejar errores
    console.error("Error during logout:", error);
    return res.status(500).json({ message: "Internal server error during logout" });
  }
};


function assignRolesToUser(user, req, res, message) {
  if (req.body.roles) {
    Role.findAll({
      where: {
        name: {
          [Op.or]: req.body.roles
        }
      }
    }).then(roles => {
      user.setRoles(roles).then(() => {
        res.send({ message: message });
      });
    });
  } else {
    // Rol de usuario = 1
    user.setRoles([1]).then(() => {
      res.send({ message: message });
    });
  }
}