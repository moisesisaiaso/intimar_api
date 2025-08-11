const jwt = require("jsonwebtoken");
const config = require("../../config/auth.config");
const db = require("../models");
const User = db.user;

const { TokenExpiredError } = jwt;

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res.status(401).send({ message: "Unauthorized! Access Token was expired!" });
  }

  return res.status(401).send({ message: "Unauthorized!" });
}

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return catchError(err, res);
    }
    req.userId = decoded.id;
    next();
  });
};

const checkRoles = (roles) => {
  return (req, res, next) => {
    User.findByPk(req.userId).then(user => {
      user.getRoles().then(userRoles => {
        for (let i = 0; i < userRoles.length; i++) {
          if (roles.includes(userRoles[i].name)) {
            next();
            return;
          }
        }

        res.status(403).send({
          message: `Requiere uno de los siguientes roles: ${roles.join(", ")}!`
        });
      });
    });
  };
};

const isAdministrator = checkRoles(["administrador"]);
const isReceptionist = checkRoles(["recepcionista"]);
const isHost = checkRoles(["anfitrion"]);
const isVigilant = checkRoles(["vigilante"]);
const isWaiter = checkRoles(["mesero"]);
const isReceptionistOrAdmin = checkRoles(["recepcionista", "administrador"]);
const isReceptionistOrAdminOrAnfitrion = checkRoles(["recepcionista", "administrador", "anfitrion"]);

const authJwt = {
  verifyToken: verifyToken,
  isAdministrator: isAdministrator,
  isReceptionist: isReceptionist,
  isHost: isHost,
  isVigilant: isVigilant,
  isWaiter: isWaiter,
  isReceptionistOrAdmin: isReceptionistOrAdmin,
  isReceptionistOrAdminOrAnfitrion: isReceptionistOrAdminOrAnfitrion,
  checkRoles: checkRoles
};

module.exports = authJwt;