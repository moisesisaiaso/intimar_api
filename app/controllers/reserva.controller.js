const db = require("../models");
const moment = require('moment-timezone');
const whatsappHelper = require("../helpers/whatsapp.helpers.js");
const anticipoController = require("./anticipo.controller.js");
const { transformImagenAnticipo } = require("../helpers/anticipo.helpers.js");

moment.tz.setDefault('America/Lima');

const {
    user: User,
    role: Role,
    client: Client,
    mesa: Mesa,
    anticipo: Anticipo,
    reserva: Reserva,
    configuracion: Config
} = db;

const Op = db.Sequelize.Op;

exports.allReservas = async (req, res) => {
    try {
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
                { model: Mesa },
            ],
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        });

        // Transformar el atributo imagen_anticipo de cada reserva
        const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
            if (reserva.anticipo) {
                reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
            }
            return reserva;
        }));

        res.json({
            cantidad: reservasMapeadas.length,
            data: reservasMapeadas
        });

    } catch (error) {
        console.error("Error al obtener reservas con asociaciones:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

exports.createReserva = async (req, res) => {
    try {
        //Comprobando el cliente
        const { clienteId } = req.body;

        const client = await Client.findByPk(clienteId);

        if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

        //Anticipo
        let anticipoId = null;

        if (req.body.anticipo !== undefined && req.body.anticipo !== null) {
            console.log("Creando reserva con anticipo");
            const anticipo = await anticipoController.createAnticipo(req.file, JSON.parse(req.body.anticipo));
            anticipoId = anticipo.id;
        }

        console.log("Creando reserva");

        const reserva = await Reserva.create({
            fecha_reserva: req.body.fecha_reserva,
            hora_reserva: req.body.hora_reserva,
            hora_llegada: req.body.hora_llegada ?? null,
            hora_salida: req.body.hora_salida ?? null,
            cant_adultos: parseInt(req.body.cant_adultos),
            cant_ninos: parseInt(req.body.cant_ninos),
            anticipo_required: req.body.anticipo_required,
            motivo_reserva: req.body.motivo_reserva,
            clienteId: parseInt(clienteId),
            userId: parseInt(req.userId),
            anticipoId: anticipoId === null ? null : parseInt(anticipoId),
        });

        const reserva_guardada = await Reserva.findOne({
            where: { id: reserva.id },
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
                { model: Mesa },
            ],
        });

        if (reserva_guardada.length <= 0) {
            return res.status(400).json({
                message: "No se pudo crear la reserva"
            });
        }

        console.log("Reserva creada");

        //await whatsappHelper.sendReservaMessage(reserva_guardada);

        //API Whatsapp Business
        await whatsappHelper.sendReservaMessageWhastapp(reserva_guardada);

        if (reserva_guardada.anticipo) {
            reserva.anticipo = await transformImagenAnticipo(reserva.anticipo)
        }

        return res.status(201).json({
            message: anticipoId
                ? "Reserva con anticipo creada correctamente"
                : "Reserva creada correctamente",
            data: reserva_guardada,
        });
    } catch (err) {
        res.status(500).json({
            message: "Error al crear la reserva",
            error: err.message,
        });
    }
};

exports.updateReserva = async (req, res) => {
    try {
        const reservaId = req.params.id;
        const reserva = await Reserva.findByPk(reservaId);

        if (!reserva) {
            return res.status(404).json({
                message: "Reserva no encontrada",
            });
        }

        let anticipoId = reserva.anticipoId;
        let { anticipo } = req.body;

        anticipo = anticipo ? JSON.parse(anticipo) : null;

        if (anticipo) {
            const { id, ...dataAnticipo } = anticipo;
        
            if (anticipoId) {
                await anticipoController.updateAnticipo(req.file, dataAnticipo, anticipoId);
            } else {
                const nuevoAnticipo = await anticipoController.createAnticipo(req.file, dataAnticipo);
                anticipoId = nuevoAnticipo.id;
            }
        } else if (req.file && anticipoId) {
            await anticipoController.updateAnticipo(req.file, {}, anticipoId);
        }

        const { id, userId, ...updateDataReserva } = req.body;

        const [updatedRowsCount] = await Reserva.update({
            ...updateDataReserva,
            anticipoId: anticipoId,
        }, {
            where: { id: reservaId },
        });

        if (updatedRowsCount > 0) {
            const updatedReservaInstance = await Reserva.findByPk(reservaId, {
                include: [
                    { model: Anticipo },
                    { model: Client },
                    { model: User, as: 'usuario', attributes: { exclude: ['id', 'password', 'createdAt',] } },
                    { model: User, as: 'mozo', attributes: { exclude: ['id', 'password', 'createdAt',] } },
                    { model: Mesa },
                ],
            });

            if (updatedReservaInstance.anticipo) {
                updatedReservaInstance.anticipo = await transformImagenAnticipo(updatedReservaInstance.anticipo);
            }

            return res.status(200).json({
                message: "Reserva actualizada correctamente",
                data: updatedReservaInstance,
            });
        }

        return res.status(500).json({ message: "Error al actualizar la reserva" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Error al actualizar la reserva",
            error: err.message,
        });
    }
};

exports.deleteReserva = async (req, res) => {
    try {
        const reservaId = req.params.id;
        const deletedRowCount = await Reserva.destroy({
            where: { id: reservaId },
        });

        if (deletedRowCount === 1) {
            return res.json({ message: "Reserva eliminada correctamente" });
        } else {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }
    } catch (err) {
        res.status(500).json({
            message: "Error al eliminar la reserva",
            error: err.message,
        });
    }
};

//Añade mesas, no reemplaza
exports.asignarMesa = async (req, res) => {
    try {
        const reservaId = req.params.id;
        const mesasId = req.body;

        // Obtener la reserva
        const reserva = await Reserva.findOne({
            where: { id: reservaId }
        });

        if (!reserva) {
            return res.status(404).json({
                message: "Reserva no encontrada"
            });
        }

        // Obtener las instancias de mesas usando los IDs
        const mesasAsociar = await Mesa.findAll({ where: { id: mesasId, estado_mesa: true } });

        // Validar que todas las mesas estén disponibles
        if (mesasAsociar.length !== mesasId.length) {
            return res.status(400).json({
                message: "Una o más mesas no están disponibles",
            });
        }

        // Asociar las mesas a la reserva
        await reserva.addMesas(mesasAsociar);

        // Cambiar el estado de las mesas asociadas a false
        await Mesa.update({ estado_mesa: false }, { where: { id: mesasAsociar.map(mesa => mesa.id) } });

        // Recuperar la reserva actualizada con las mesas asociadas
        const reservaActualizada = await Reserva.findOne({
            where: { id: reservaId },
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
                { model: Mesa },
            ],
        });

        if (reservaActualizada.anticipo) {
            reservaActualizada.anticipo = await transformImagenAnticipo(reservaActualizada.anticipo)
        }

        return res.status(201).json({
            message: "Mesas asociadas a la reserva y estado de mesas actualizado",
            data: reservaActualizada,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al asignar mesas a la reserva",
            error: err.message,
        });
    }
};

exports.desasociarMesa = async (req, res) => {
    try {
        const reservaId = req.params.id;

        // Obtener la reserva con sus mesas asociadas
        const reserva = await Reserva.findOne({
            where: { id: reservaId },
            include: [{ model: Mesa }],
        });

        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        //Obtener las mesas asignadas a la reserva
        const mesasAsociadas = reserva.mesas;

        if (mesasAsociadas.length < 1) {
            return res.json({ message: "Esta reserva no tiene mesas asociadas" });
        }

        //Obtener los Ids de las mesas
        const mesasId = mesasAsociadas.map(mesa => mesa.id);

        // Actualizar el estado de las mesas antes de desasociarlas
        if (Array.isArray(mesasId) && mesasId.length > 0) {

            // Desasociar todas las mesas de la reserva
            await reserva.removeMesas(mesasId);

            // Actualizar el estado de las mesas a disponible
            await Mesa.update({ estado_mesa: true }, { where: { id: mesasId } });
        }

        return res.json({ message: "Mesas desasociadas de la reserva correctamente" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error al desasociar mesas de la reserva", error: err.message });
    }
};

// Endpoint que sea de terminar reservas
// Actualizar la hora de salida
// Liberar , cambiar el estado a true
exports.finalizarReserva = async (req, res) => {
    try {
        const reservaId = req.params.id;

        // Obtener la reserva con sus mesas asociadas
        const reserva = await Reserva.findOne({
            where: { id: reservaId },
            include: [{ model: Mesa }],
        });

        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        //Obtener las mesas asignadas a la reserva
        const mesasAsociadas = reserva.mesas;

        //Obtener los Ids de las mesas
        const mesasId = mesasAsociadas.map(mesa => mesa.id);

        // Actualizar el estado de las mesas para liberarlas
        if (Array.isArray(mesasId) && mesasId.length > 0) {

            // Actualizar el estado de las mesas a disponible
            await Mesa.update({ estado_mesa: true }, { where: { id: mesasId } });
        }

        // Obtener la hora actual en Lima (UTC-5 / GMT-5)
        const now = new Date();
        const horaLima = new Date(now.getTime() - 5 * 60 * 60 * 1000)
            .toISOString()
            .substr(11, 8);  // Formato HH:mm:ss

        // Actualizar la hora de salida y estado de la reserva
        await reserva.update({ hora_salida: horaLima, estado_reserva: 'Finalizada' });

        return res.json({ message: "Reserva finalizada correctamente" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error al finalizar la reserva", error: err.message });
    }
}

exports.asignarMozo = async (req, res) => {
    try {
        const reservaId = req.params.id;
        const { mozoId } = req.body;

        // Obtener la reserva
        const reserva = await Reserva.findByPk(reservaId);
        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Verificar que el mozo (usuario) existe
        const mozo = await User.findByPk(mozoId);
        if (!mozo) {
            return res.status(404).json({ message: "Mozo no encontrado" });
        }

        // Asignar el mozo a la reserva usando el método de Sequelize
        await reserva.setMozo(mozo);

        // Obtener la hora actual en Lima (UTC-5 / GMT-5)
        const now = new Date();
        const horaLima = new Date(now.getTime() - 5 * 60 * 60 * 1000)
            .toISOString()
            .substr(11, 8);  // Formato HH:mm:ss

        // Actualizar la hora de llegada y estado de la reserva
        await reserva.update({ hora_llegada: horaLima, estado_reserva: 'En proceso' });

        // Recuperar la reserva actualizada con las relaciones
        const updatedReservaInstance = await Reserva.findByPk(reservaId, {
            include: [
                { model: Anticipo },
                { model: Client },
                {
                    model: User,
                    as: 'usuario',
                    attributes: { exclude: ['password', 'createdAt'] }
                },
                {
                    model: User,
                    as: 'mozo',
                    attributes: { exclude: ['password', 'createdAt'] }
                },
                { model: Mesa },
            ],
        });

        if (updatedReservaInstance.anticipo) {
            updatedReservaInstance.anticipo = await transformImagenAnticipo(updatedReservaInstance.anticipo)
        }

        // Devolver la reserva actualizada
        return res.status(200).json({
            message: "Mozo asignado correctamente, hora de llegada actualizada",
            data: updatedReservaInstance,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Error al asignar mozo a la reserva",
            error: err.message,
        });
    }
};

//Reserva por id
exports.findReservasByID = async (req, res) => {
    try {

        const reservaId = req.params.id;
        const reserva = await Reserva.findByPk(Number(reservaId), {
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
                { model: Mesa },
            ],
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        });

        if (!reserva) {
            return res.status(200).json({
                message: "Reserva no encontrada",
            });
        }

        if (reserva.anticipo) {
            reserva.anticipo = await transformImagenAnticipo(reserva.anticipo)
        }

        return res.status(200).json({
            message: "Reserva encontrada",
            reserva
        });

    } catch (err) {
        res.status(500).json({
            message: "Error al consultar reservas por id",
            error: err.message,
        });
    }
}

//Reservas por id del cliente
exports.findReservasByClientID = async (req, res) => {
    try {
        const clientId = req.params.id;

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
                { model: Mesa },
            ],
            where: {
                clienteId: Number(clientId),
            },
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        })

        if (reservas.length > 0) {
            // Transformar el atributo imagen_anticipo de cada reserva
            const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
                if (reserva.anticipo) {
                    reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
                }
                return reserva;
            }));

            return res.status(200).json({
                cantidad: reservasMapeadas.length,
                data: reservasMapeadas,
            });
        }

        return res.status(200).json({ message: `No hay reservas para el cliente ` });

    } catch (err) {
        res.status(500).json({
            message: "Error al consultar reservas por id del cliente",
            error: err.message,
        });
    }
}

exports.findReservasByDate = async (req, res) => {
    try {
        const fecha = req.body.fecha_reserva;
        const reservas = await Reserva.findAll({
            where: {
                fecha_reserva: fecha
            },
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
                { model: Mesa },
            ],
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        });

        if (reservas.length > 0) {
            // Transformar el atributo imagen_anticipo de cada reserva
            const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
                if (reserva.anticipo) {
                    reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
                }
                return reserva;
            }));

            return res.json({
                cantidad: reservasMapeadas.length,
                data: reservasMapeadas,
            });
        } else {
            return res.status(200).json({ message: `No hay reservas para el ${fecha} ` });
        }
    } catch (err) {
        res.status(500).json({
            message: "Error al consultar reservas por fecha",
            error: err.message,
        });
    }
}

exports.findReservasByStatus = async (req, res) => {
    try {
        const estado_reserva = req.body.estado_reserva;
        const reservas = await Reserva.findAll({
            where: {
                estado_reserva: estado_reserva
            },
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
                { model: Mesa },
            ],
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        });

        if (reservas.length > 0) {
            // Transformar el atributo imagen_anticipo de cada reserva
            const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
                if (reserva.anticipo) {
                    reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
                }
                return reserva;
            }));

            return res.json({
                cantidad: reservasMapeadas.length,
                data: reservasMapeadas
            });
        } else {
            return res.status(200).json({ message: `No hay reservas para el estado ${estado_reserva} ` });
        }
    } catch (err) {
        res.status(500).json({
            message: "Error al consultar reservas por estado",
            error: err.message,
        });
    }
}

//especificamente empiezen a las n horas 
exports.findReservasByDateandHour = async (req, res) => {
    try {
        const fecha = req.body.fecha_reserva;
        const hora = req.body.hora_reserva;

        const reservas = await Reserva.findAll({
            where: {
                fecha_reserva: {
                    [Op.eq]: fecha,
                },
                hora_reserva: {
                    [Op.eq]: hora,
                },
            },
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
                { model: Mesa },
            ],
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        });

        if (reservas.length > 0) {
            // Transformar el atributo imagen_anticipo de cada reserva
            const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
                if (reserva.anticipo) {
                    reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
                }
                return reserva;
            }));

            return res.json({
                message: `Hay ${reservasMapeadas.length} reservas para el ${fecha} que empiezen a las ${hora}`,
                cantidad: reservasMapeadas.length,
                data: reservasMapeadas
            });

        } else {
            return res.status(200).json({
                message: `No hay reservas para el ${fecha} que empiezen a las ${hora}`
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al consultar reservas por fecha y hora",
            error: err.message,
        });
    }
};

//rango de horas no importa si es hora de salida o entrada, es un igual que
exports.findReservasByDateandHours = async (req, res) => {
    try {
        const fecha = req.body.fecha_reserva;
        const hora_entrada = req.body.hora_entrada;
        const hora_salida = req.body.hora_salida;
        let aforo = 0;

        const reservas = await Reserva.findAll({
            where: {
                fecha_reserva: {
                    [Op.eq]: fecha,
                },
                hora_reserva: {
                    [Op.gte]: hora_entrada,
                    [Op.lte]: hora_salida,
                },
            },
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
                { model: Mesa },
            ],
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        });

        if (reservas.length > 0) {

            reservas.forEach(reserva => {
                aforo += (reserva.cant_ninos + reserva.cant_adultos);
            });

            // Transformar el atributo imagen_anticipo de cada reserva
            const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
                if (reserva.anticipo) {
                    reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
                }
                return reserva;
            }));

            return res.json({
                message: `Hay ${reservasMapeadas.length} reservas entre las ${hora_entrada} y las ${hora_salida}`,
                personas: aforo,
                cantidad: reservasMapeadas.length,
                data: reservasMapeadas
            });

        } else {
            return res.status(200).json({
                message: `No hay reservas para el ${fecha} en ese rango de horas`
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al consultar reservas por fecha y hora",
            error: err.message,
        });
    }
};

//Si coloco las 12:00.00, me retorna las personas que hay en esa hora o llegan en esa hora, si alguien reservo de 10 a 12 no lo cuenta porque en teoria se retiran.
//Sera entre las 10:00:01 y las 12:00
exports.obtenerAforoPorFechaYHora = async (req, res) => {
    try {
        const configuracion = await Config.findOne();

        const fecha = req.body.fecha_reserva;
        const hora = req.body.hora_reserva;
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
                { model: Mesa },
            ],
            where: {
                fecha_reserva: fecha,
                hora_reserva: {
                    //hora maxima
                    [Op.lte]: hora,
                    //hora minima
                    [Op.gt]: restarHoras(hora, configuracion.duracion_reserva),
                },
            },
            order: [
                ['fecha_reserva', 'ASC'],
                ['hora_reserva', 'ASC'],
            ]
        });

        let aforoTotal = 0;

        if (reservas.length > 0) {
            reservas.forEach(reserva => {
                aforoTotal += (reserva.cant_ninos + reserva.cant_adultos);
            });

            // Transformar el atributo imagen_anticipo de cada reserva
            const reservasMapeadas = await Promise.all(reservas.map(async (reserva) => {
                if (reserva.anticipo) {
                    reserva.anticipo = await transformImagenAnticipo(reserva.anticipo);
                }
                return reserva;
            }));

            return res.json({
                message: `Hay ${aforoTotal} personas a las ${hora} el ${fecha}`,
                personas: aforoTotal,
                cantidad: reservasMapeadas.length,
                data: reservasMapeadas
            });
        }

        return res.status(200).json({
            message: `No hay personas para el ${fecha} a las ${hora}`
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Error al consultar reservas por fecha y hora",
            error: err.message,
        });
    }
};

const sumarHoras = (hora, horasASumar) => {
    const horaMoment = moment(hora, 'HH:mm:ss');
    const resultado = horaMoment.add(horasASumar, 'hours').format('HH:mm:ss');
    return resultado;
};

const restarHoras = (hora, horasARestar) => {
    const horaMoment = moment(hora, 'HH:mm:ss');
    const resultado = horaMoment.subtract(horasARestar, 'hours').format('HH:mm:ss');
    return resultado;
};
