const db = require("../models");

const {
    user: User,
    role: Role,
    client: Client,
    mesa: Mesa,
    anticipo: Anticipo,
    reserva: Reserva,
    configuracion: Config
} = db;

const s3methods = require("../helpers/aws.helpers.js");

const { transformImagenAnticipo } = require("../helpers/anticipo.helpers.js");
const { transformImagenMesa } = require("../helpers/mesa.helper.js")

exports.createMesa = async (req, res) => {
    try {
        let { file } = req;
        let { id, ...data } = req.body;

        let key, body;

        if (file) {
            key = Date.now() + '-' + file.originalname;
            body = file.buffer;

            if (s3methods && s3methods.uploadImage) {
                await s3methods.uploadImage(key, body);
                data.imagen_mesa = key;
            }
        }

        const mesa = await Mesa.create(data);

        return res.status(201).json({
            message: "Mesa creada correctamente",
            data: await transformImagenMesa(mesa),
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

exports.updateMesa = async (req, res) => {
    try {
        const mesaId = req.params.id;

        const mesa = await Mesa.findOne({ where: { id: mesaId } });

        if (!mesa) {
            return res.status(404).json({ message: "Mesa no encontrada." });
        }

        const { id, ...updateData } = req.body;
        let { file } = req;

        let key, body;

        if (file) {
            key = Date.now() + '-' + file.originalname;
            body = file.buffer;

            if (s3methods && s3methods.uploadImage) {
                await s3methods.uploadImage(key, body);
                updateData.imagen_mesa = key;
            }
        }
        console.log(updateData);

        await Mesa.update(updateData, { where: { id: mesaId } });

        return res.status(200).json({ message: "Mesa actualizado correctamente!" });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

exports.allMesas = async (req, res) => {
    try {
        const mesas = await Mesa.findAll();

        // Transformar las imágenes de cada mesa en paralelo
        await Promise.all(mesas.map(async (mesa) => {
            await transformImagenMesa(mesa);
        }));

        return res.status(201).json({
            cantidad: mesas.length,
            data: mesas
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

exports.deleteMesa = async (req, res) => {
    try {
        await Mesa.destroy({
            where: { id: req.params.id },
        });
        return res.json({
            message: "Mesa eliminada correctamente",
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

exports.allReservasByMesa = async (req, res) => {
    try {
        const mesaId = req.params.id;

        // Buscar la mesa por su ID
        const mesa = await Mesa.findByPk(Number(mesaId));

        if (!mesa) {
            return res.status(404).json({ message: "Mesa no encontrada" });
        }

        // Buscar las reservas asociadas a la mesa
        const reservas = await Reserva.findAll({
            include: [
                { model: Anticipo },
                { model: Client },
                {
                    model: User,
                    as: 'usuario',
                    attributes: { exclude: ['id', 'password', 'createdAt', 'updatedAt'] }
                },
                {
                    model: User,
                    as: 'mozo',
                    attributes: { exclude: ['id', 'password', 'createdAt', 'updatedAt'] }
                },
                {
                    model: Mesa,
                    where: { id: mesaId }
                }
            ]
        });

        if (reservas.length === 0) {
            return res.status(404).json({ message: "Esta mesa no tiene reservas asociadas" });
        }

        // Transformar el atributo imagen_anticipo de cada reserva
        const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
            if (reserva.anticipo) {
                reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
            }
            return reserva;
        }));

        return res.json({ message: "Lista de reservas asociadas a la mesa", reservas: reservasMapeadas });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

exports.findMesaById = async (req, res) => {
    try {
        const mesaId = req.params.id;

        const mesa = await Mesa.findByPk(mesaId)

        if (!mesa) {
            return res.status(404).json({
                message: "Mesa no encontrada"
            });
        }

        return res.status(200).json({
            message: "Mesa encontrada",
            mesa: await transformImagenMesa(mesa)
        });

    } catch (err) {
        res.status(500).json({
            message: "Error al consultar mesas por id",
            error: err.message,
        });
    }
}