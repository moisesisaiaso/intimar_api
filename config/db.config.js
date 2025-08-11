module.exports = {
  user: process.env.USER || 'admin',
  host: process.env.HOST || 'localhost',
  database: process.env.DATABASE || 'intimar',
  password: process.env.PASSWORD || 'admin',
  port: process.env.DBPORT || 5432,
  dialect: "postgres",
  logging: false,
  ssl: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};