module.exports = {
    secret: process.env.SECRET_KEY || "mysecretkey",
    jwtExpiration: Number(process.env.JWT_EXPIRATION) || 3600,
    jwtRefreshExpiration: Number(process.env.JWT_REFRESH_EXPIRATION) || 86400,
};