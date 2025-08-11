module.exports = (sequelize, DataTypes) => {
  const Configuracion = sequelize.define('configuracion', {
    aforo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    anticipo_persona: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },
    duracion_reserva: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    hora_min: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_max: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },{
    deletedAt: 'deletedAt',
    paranoid: true,
    timestamps: true,
  });

  return Configuracion;
};
