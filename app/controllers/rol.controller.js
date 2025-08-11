const db = require("../models");
const { role: Role } = db;
const Op = db.Sequelize.Op;

exports.allRols = async (req, res) => {
    try {
        const rols = await Role.findAll();
        return res.status(201).json({
            cantidad: rols.length,
            data: rols
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};