module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("users", {
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastname: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Must be a valid email address",
          },
        },
      },
      cellphone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      countryCode: {
        type: Sequelize.STRING,
        defaultValue: '51'
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      }
    },{
      deletedAt: 'deletedAt',
      paranoid: true,
      timestamps: true,
    });
    return User;
  };