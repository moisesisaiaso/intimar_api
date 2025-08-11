const db = require("../models");
const {
    anticipo: Anticipo,
} = db;

const s3methods =  require("../helpers/aws.helpers.js");

exports.createAnticipo = async (file, data) => {
    try {
        let key, body;

        if (file) {
            key = Date.now() + '-' + file.originalname;
            body = file.buffer;

            if (s3methods && s3methods.uploadImage) {
                await s3methods.uploadImage(key, body);
                data.imagen_anticipo = key;
            }
        }

        const anticipo = await Anticipo.create(data);
        return anticipo;
    } catch (err) {
        throw new Error(`Error interno del servidor: ${err.message}`);
    }
};

exports.updateAnticipo = async (file, data, anticipoId) => {
    try {
        let key, body;

        if (file) {
            key = Date.now() + '-' + file.originalname;
            body = file.buffer;

            if (s3methods && s3methods.uploadImage) {
                await s3methods.uploadImage(key, body);
                data.imagen_anticipo = key;
            }
        }

        const anticipo = await Anticipo.findByPk(anticipoId);

        if (!anticipo) {
            throw new Error("No se encontró el anticipo especificado.");
        }

        await anticipo.update(data);

        return anticipo;
    } catch (err) {
        throw new Error(`Error interno del servidor: ${err.message}`);
    }
};