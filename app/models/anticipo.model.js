const moment = require('moment-timezone');
moment.tz.setDefault('America/Lima');

module.exports = (sequelize, Sequelize) => {
  const Anticipo = sequelize.define("anticipos", {
    fecha_anticipo: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      validate: {
        isAfterOrEqualCurrentDate: function(value) {
          if (moment(value).isBefore(moment(), 'day')) {
            throw new Error("La fecha del anticipo debe ser posterior o igual a la fecha actual.");
          }
        },
      },
    },
    monto_anticipo: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: '0'
    },
    banco: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    moneda: {
      type: Sequelize.STRING,
      allowNull: true,
      values: ['Dólares', 'Soles']
    },
    estado_anticipo: {
      type: Sequelize.STRING,
      allowNull: false,
      values: ['Aprobado', 'Pendiente', 'Rechazado'],
    },
    imagen_anticipo: {
      type: Sequelize.STRING,
      allowNull: true
    }
  },{
    deletedAt: 'deletedAt',
    paranoid: true,
    timestamps: true,
  });
  return Anticipo;
};
