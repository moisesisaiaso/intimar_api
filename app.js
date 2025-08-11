require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

const CORS_ALLOWED = process.env.CORS ? process.env.CORS.split(',').map(url => url.trim()) : [];

var corsOptions = {
  origin: function (origin, callback) {
    if (!origin || CORS_ALLOWED.includes('*') || CORS_ALLOWED.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS bloqueado para: ${origin}`);
      callback(new Error('CORS policy does not allow this origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/configuracion.routes")(app);
require("./app/routes/reserva.routes")(app);
require("./app/routes/client.routes")(app);
require("./app/routes/mesa.routes")(app);
require("./app/routes/whatsapp.routes")(app);
require("./app/routes/role.routes")(app);
require("./app/routes/employee.routes")(app);

app.get("/", (req, res) => [res.json({ message: "Bienvenido a Intimar" })]);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});