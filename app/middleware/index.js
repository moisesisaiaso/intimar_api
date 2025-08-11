const authJwt = require("./authJwt");
const verifySignUp = require("./verifySignUp");
const {checkAforoMiddleware, updateReservaMiddleware} =  require("./reserva.middleware.js")
const verifyClient = require("./client.middleware.js")
module.exports = {
  authJwt,
  verifySignUp,
  checkAforoMiddleware,
  updateReservaMiddleware,
  verifyClient
};