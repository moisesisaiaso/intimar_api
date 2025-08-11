module.exports = (sequelize, Sequelize) => {
    const Mesa = sequelize.define("mesas", {
      ubicacion_mesa: {
        type: Sequelize.STRING,
        values: ['Comedor','Terraza']
      },
      numero_mesa: {
        type: Sequelize.STRING
      },
      estado_mesa: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      imagen_mesa: {
        type: Sequelize.STRING,
        allowNull: true,
      }
    },{
      deletedAt: 'deletedAt',
      paranoid: true,
      timestamps: true,
    });
  
    return Mesa;
  };