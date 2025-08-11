const db = require("../models");
const Client = db.client;

const checkDuplicateCellphoneOrEmail = async (req, res, next) => {
  try {
    // Verificar si el celular ya está en uso
    const existingClientByCellphone = await Client.findOne({
      where: { cellphone: req.body.cellphone },
    });

    if (existingClientByCellphone) {
      return res.status(400).send({ message: "Failed! Cellphone is already in use!" });
    }

    // Verificar si el email ya está en uso (si es que se envió)
    if (req.body.email) {
      const existingClientByEmail = await Client.findOne({
        where: { email: req.body.email },
      });

      if (existingClientByEmail) {
        return res.status(400).send({ message: "Failed! Email is already in use!" });
      }
    }

    next(); // Llamar a `next()` solo si no hubo errores
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

const verifyClient = {
  checkDuplicateCellphoneOrEmail: checkDuplicateCellphoneOrEmail
};

module.exports = verifyClient;
