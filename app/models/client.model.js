module.exports = (sequelize, Sequelize) => {
  const Client = sequelize.define("clients", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastname: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: {
          msg: "Must be a valid email address",
        },
      },
    },
    dni:{
      type: Sequelize.STRING,
      allowNull: true
    },
    ruc:{
      type: Sequelize.STRING,
      allowNull: true
    },
    numero_pasaporte:{
      type: Sequelize.STRING,
      allowNull: true
    },
    cellphone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    countryCode: {
      type: Sequelize.STRING,
      defaultValue: '51'
    },
    address: {
      type: Sequelize.STRING,
    },
    allergies: {
      type: Sequelize.STRING,
    },
    languaje: {
      type: Sequelize.STRING,
      values: ['es', 'en_US'],
      validate: {
        isIn: [['es', 'en_US']]
      }
    }
  },{
    deletedAt: 'deletedAt',
    paranoid: true,
    timestamps: true,
  });

  return Client;
};
