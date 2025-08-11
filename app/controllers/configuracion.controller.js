const db = require("../models");
const { configuracion: Config } = db;

exports.readConfiguration = async (req, res) => {
    try {
        const configuracion = await Config.findOne();
        return res.status(201).json({
            data: configuracion
        });

    } catch (err) {
        return res.status(500).json({
            message: 'Error al obtener configuracion'
        });
    }
}

exports.updateConfiguration = async (req, res) => {
    try {
        const configId = req.params.id

        const { id, ...updateData } =  req.body;

        const configuracionActual = await Config.update(updateData, { 
            where: { id: configId } 
        });

        if (configuracionActual.length > 0) {

            const configuracion = await Config.findOne();

            return res.json({
                message: "Configuracion actualizada correctamente",
                data: configuracion,
            });
        }

        return res.status(404).json({ message: "Configuracion no encontrada" });

    } catch (err) {
        return res.status(500).json({
            message: 'Error al actualizar configuracion'
        });
    }
}