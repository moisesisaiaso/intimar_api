const moment = require('moment-timezone');
moment.tz.setDefault('America/Lima');

module.exports = (sequelize, Sequelize) => {
  const Reserva = sequelize.define("reservas", {
    fecha_reserva: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      validate: {
        isAfterOrEqualCurrentDateTime: function (value) {
          const currentDateTime = moment();
          const reservationDateTime = moment(`${value}T${this.hora_reserva}`, 'YYYY-MM-DDTHH:mm:ss');

          if (reservationDateTime.isBefore(currentDateTime)) {
            throw new Error("La fecha y hora de reserva deben ser posteriores o iguales a la fecha y hora actuales.");
          }
        },
      },
    },
    hora_reserva: {
      type: Sequelize.TIME,
      allowNull: false,
      validate: {
        isAfterOrEqualCurrentTime: function (value) {
          const currentDateTime = moment();
          const reservationDateTime = moment(`${this.fecha_reserva}T${value}`, 'YYYY-MM-DDTHH:mm:ss');

          if (reservationDateTime.isBefore(currentDateTime)) {
            throw new Error("La fecha y hora de reserva deben ser posteriores o iguales a la fecha y hora actuales.");
          }
        },
      },
    },
    hora_llegada: {
      type: Sequelize.TIME, // Utiliza TIME para almacenar solo la hora
      allowNull: true,
    },
    hora_salida: {
      type: Sequelize.TIME, // Utiliza TIME para almacenar solo la hora
      allowNull: true,
    },
    cant_adultos: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    cant_ninos: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    estado_reserva: {
      type: Sequelize.STRING,
      defaultValue: 'Pendiente a confirmar',
      allowNull: false,
      validate:{
        isIn: [['Pendiente a confirmar', 'Confirmada', 'Cancelada', 'Lista de espera', 'En proceso', 'Finalizada']]
      }
    },
    anticipo_required: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    motivo_reserva: {
      type: Sequelize.STRING,
      allowNull: true,
    }
  },{
    deletedAt: 'deletedAt',
    paranoid: true,
    timestamps: true,
  });

  return Reserva;
};
