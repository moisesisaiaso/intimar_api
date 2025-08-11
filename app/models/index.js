const config = require("../../config/db.config");
const { Sequelize } = require("sequelize");
var bcrypt = require("bcryptjs");

const sequelize = new Sequelize({
  database: config.database,
  username: config.user,
  password: config.password,
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
  dialectOptions: {
    supportBigNumbers: true,
    bigNumberStrings: true,
    ssl: false
  },
  timezone: '-05:00', // Zona horaria GMT-5
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.configuracion = require("../models/configuracion.model")(sequelize, Sequelize);
db.user = require("../models/user.model")(sequelize, Sequelize);
db.role = require("../models/role.model")(sequelize, Sequelize);
db.client = require("../models/client.model")(sequelize, Sequelize);
db.reserva = require("../models/reserva.model")(sequelize, Sequelize);
db.mesa = require("../models/mesa.model")(sequelize, Sequelize);
db.anticipo = require("../models/anticipo.model")(sequelize, Sequelize);
db.refreshToken = require("../models/refreshToken.model")(sequelize, Sequelize);

//Relacion reserva y anticipo
db.reserva.belongsTo(db.anticipo, {
  foreignKey: "anticipoId",
  targetKey: 'id',
  allowNull: true,
  onDelete: 'SET NULL',
});

// Relacion reserva y cliente
db.reserva.belongsTo(db.client, {
  foreignKey: "clienteId", targetKey: 'id',
  allowNull: false
});

// Relacion reserva y empleado(usuario)
db.reserva.belongsTo(db.user, {
  foreignKey: "userId", targetKey: 'id', as: 'usuario',
  allowNull: true
});

// Relacion reserva y mozo(usuario)
db.reserva.belongsTo(db.user, {
  foreignKey: "mozoId", targetKey: 'id', as: 'mozo',
  allowNull: true
});

//Relacion reserva y mesa
//Una mesa le pertenece a muchas reservas, todo es en asignacion , no en el momento de reservar
db.mesa.belongsToMany(db.reserva, {
  through: "mesas_reservas",
  foreignKey: "mesaId",
  otherKey: "reservaId"
});

//Una reserva puede tener muchas mesas , todo es en asignacion , no en el momento de reservar
db.reserva.belongsToMany(db.mesa, {
  through: "mesas_reservas",
  foreignKey: "reservaId",
  otherKey: "mesaId"
});

//Relacion de usuario y rol
//Un rol le pertenece a muchos usuarios
db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId"
});

//Un usuario puede tener muchos roles
db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId"
});

//Relacion de usuario y refreshtoken
//El refresh token le pertenece a un solo usuario
db.refreshToken.belongsTo(db.user, {
  foreignKey: 'userId', targetKey: 'id'
});

//El usuario solo tiene un refresh token
db.user.hasOne(db.refreshToken, {
  foreignKey: 'userId', targetKey: 'id'
});

db.ROLES = ["usuario", "administrador", "recepcionista", "anfitrion", "vigilante", "mesero"];

//En desarrollo
// db.sequelize.sync({ force: true }).then(async () => {
//   console.log("Database and tables created!");
//   await initialRequired();
//   await initial();
// });

//En producción
db.sequelize.sync();

const {
  user: User,
  role: Role,
  client: Client,
  mesa: Mesa,
  anticipo: Anticipo,
  reserva: Reserva,
  configuracion: Configuracion,
} = db;

const Op = db.Sequelize.Op;

//Usar en develop, en producción insertar manualmente
const initialRequired = async () => {
  await Configuracion.create({
    aforo: 50,
    duracion_reserva: 1.5,
    hora_min: '07:00:00',
    hora_max: '18:00:00',
  })

  await Role.create({
    id: 1,
    name: "usuario",
  });

  await Role.create({
    id: 2,
    name: "recepcionista",
  });

  await Role.create({
    id: 3,
    name: "administrador",
  });

  await Role.create({
    id: 4,
    name: "anfitrion",
  });

  await Role.create({
    id: 5,
    name: "vigilante",
  });

  await Role.create({
    id: 6,
    name: "mesero",
  });

  //Usuario
  await User.create({
    name: "Jacko",
    lastname: "Tinoco",
    password: bcrypt.hashSync("admin", 8),
    email: "jackopro88@gmail.com",
    cellphone: "964950100",
  })
    .then((user) => {
      if (["mesero", "anfitrion", "administrador"]) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: ["mesero", "anfitrion", "administrador"],
            },
          },
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            console.log({ message: "User was registered successfully!" });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          console.log({ message: "User was registered successfully!" });
        });
      }
    })
    .catch((err) => {
      console.log({ message: err.message });
    });

  await User.create({
    name: "Nicole",
    lastname: "Arguedas",
    password: bcrypt.hashSync("admin", 8),
    email: "nicole.arguedas@tecsup.edu.pe",
    cellphone: "954786123",
  })
    .then((user) => {
      if (["mesero", "anfitrion", "admin"]) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: ["mesero", "anfitrion", "administrador"],
            },
          },
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            console.log({ message: "User was registered successfully!" });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          console.log({ message: "User was registered successfully!" });
        });
      }
    })
    .catch((err) => {
      console.log({ message: err.message });
    });
}

const initial = async () => {
  //Clientes
  await Client.create({
    name: "Juan",
    lastname: "Ortiz",
    age: 30,
    email: "cliente1@example.com",
    cellphone: "145236589",
    address: "Dirección 1",
    allergies: "Ninguna",
  })
    .then((client1) => {
      //console.log("Cliente 1 creado:", client1.get());
    })
    .catch((error) => {
      console.error("Error al crear Cliente 1:", error);
    });

  await Client.create({
    name: "Pedro",
    lastname: "Peña",
    age: 25,
    email: "cliente2@example.com",
    cellphone: "987654321",
    address: "Dirección 2",
    allergies: "Alergia a Nuez",
  })
    .then((client2) => {
      //console.log("Cliente 2 creado:", client2.get());
    })
    .catch((error) => {
      console.error("Error al crear Cliente 2:", error);
    });

  await Client.create({
    name: "Ana",
    lastname: "Pereira",
    age: 35,
    email: "cliente3@example.com",
    cellphone: "555555555",
    address: "Dirección 3",
    allergies: "Alergia a Mariscos",
  })
    .then((client3) => {
      //console.log("Cliente 3 creado:", client3.get());
    })
    .catch((error) => {
      console.error("Error al crear Cliente 3:", error);
    });

  await Client.create({
    name: "Inez",
    lastname: "De La Cruz",
    age: 19,
    email: "cliente4@example.com",
    cellphone: "123456789",
    address: "Dirección 4",
    allergies: "Alergia a Mariscos",
  })
    .then((client3) => {
      //console.log("Cliente 3 creado:", client3.get());
    })
    .catch((error) => {
      console.error("Error al crear Cliente 3:", error);
    });

  await Client.create({
    name: "Robert",
    lastname: "Sanchez",
    age: 35,
    email: "cliente5@example.com",
    cellphone: "954682130",
    address: "Dirección 5",
    allergies: "Alergia a Mariscos",
  })
    .then((client3) => {
      //console.log("Cliente 3 creado:", client3.get());
    })
    .catch((error) => {
      console.error("Error al crear Cliente 3:", error);
    });

  //Mesas
  // Crear 3 mesas en el comedor
  for (let i = 1; i <= 10; i++) {
    await Mesa.create({
      ubicacion_mesa: "Comedor",
      numero_mesa: `C${i}`,
      estado_mesa: true,
    })
      .then((mesa) => {
        //console.log(`Mesa en el comedor creada: ${mesa.get()}`);
      })
      .catch((error) => {
        console.error("Error al crear mesa en el comedor:", error);
      });
  }

  // Crear 3 mesas en la terraza
  for (let i = 11; i <= 21; i++) {
    await Mesa.create({
      ubicacion_mesa: "Terraza",
      numero_mesa: `T${i}`,
      estado_mesa: true,
    })
      .then((mesa) => {
        //console.log(`Mesa en la terraza creada: ${mesa.get()}`);
      })
      .catch((error) => {
        console.error("Error al crear mesa en la terraza:", error);
      });
  }

  //Crea la reserva
  await Reserva.create({
    fecha_reserva: "2024-12-20",
    hora_reserva: "12:00:00",
    hora_llegada: null,
    hora_salida: null,
    cant_adultos: 2,
    cant_ninos: 1,
    estado_reserva: "Confirmada",
    anticipo_required: false,
    motivo_reserva: "Celebración",
    clienteId: 1,
    userId: 1,
  });

  await Reserva.create({
    fecha_reserva: "2024-12-25",
    hora_reserva: "12:00:00",
    hora_llegada: null,
    hora_salida: null,
    cant_adultos: 2,
    cant_ninos: 1,
    anticipo_required: false,
    motivo_reserva: "Celebración",
    clienteId: 2,
    userId: 1,
    anticipoId: null
  }).then((reserva) => {
    //console.log(reseva);
  }
  );

  await Reserva.create({
    fecha_reserva: "2024-12-25",
    hora_reserva: "18:00:00",
    hora_llegada: null,
    hora_salida: null,
    cant_adultos: 2,
    cant_ninos: 1,
    anticipo_required: false,
    motivo_reserva: "Celebración",
    clienteId: 3,
    userId: 1,
    anticipoId: null
  }).then((reserva) => {
    //console.log(reserva);
  }
  )
  // Suponiendo que ya tienes configurada la conexión a la base de datos y los modelos

  // Datos de clientes y usuarios
  const clientesIds = [1, 2, 3, 4, 5];
  const usuariosIds = [1, 2];

  // Crear 10 reservas con fechas y horas diferentes
  for (let i = 0; i < 10; i++) {
    // Generar fechas y horas diferentes para cada reserva
    const fechaReserva = new Date(2024, 11, 20 + i); // Empieza en diciembre 20 y aumenta un día para cada reserva
    const horaReserva = `${10 + i}:00:00`; // Empieza a las 10:00 y aumenta una hora para cada reserva

    await Reserva.create({
      fecha_reserva: fechaReserva.toISOString().split('T')[0], // Formatear la fecha como 'YYYY-MM-DD'
      hora_reserva: horaReserva,
      hora_llegada: null,
      hora_salida: null,
      cant_adultos: 2,
      cant_ninos: 1,
      estado_reserva: "Confirmada",
      anticipo_required: false,
      motivo_reserva: "Celebración",
      clienteId: clientesIds[i % clientesIds.length], // Ciclo entre los clientes
      userId: usuariosIds[i % usuariosIds.length],   // Ciclo entre los usuarios
    });
  }
}

module.exports = db;