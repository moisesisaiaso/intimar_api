const db = require("../models");
const whatsappHelper = require("../helpers/whatsapp.helpers");
const mysecretkey = process.env.SECRET_KEY;

const {
    user: User,
    role: Role,
    client: Client,
    mesa: Mesa,
    anticipo: Anticipo,
    reserva: Reserva,
    configuracion: Config,
    Sequelize
} = db;

exports.confirmarReserva = async (req, res) => {
    try {
        const secretkey = req.params.secretkey;

        // Comprobar si la clave secreta coincide
        if (secretkey !== mysecretkey) {
            throw new Error("Clave secreta incorrecta");
        }

        console.log(req.body);

        const message = req.body.Body;
        const senderID = req.body.From;
        const number = req.body.From;
        const numberclean = number.replace(/^whatsapp:\+?51/, '');

        console.log(numberclean);

        if (message.toLowerCase() === 'confirmo') {
            const client = await Client.findOne({
                where: { cellphone: numberclean }
            });

            if (client) {
                const reserva = await Reserva.findOne({
                    where: {
                        clienteId: client.id,
                        estado_reserva: "Pendiente a confirmar",
                    },
                    order: [['createdAt', 'DESC']],
                });

                if (reserva) {
                    // Actualizar la reserva con el estado_reserva confirmada
                    // Actualiza el estado de la reserva a "Confirmada"
                    await Reserva.update({ estado_reserva: "Confirmada" }, { where: { id: reserva.id } });

                    // Recarga la reserva después de la actualización
                    const reservaActualizada = await Reserva.findByPk(reserva.id);

                    // Construye el mensaje con la información actualizada
                    const mensaje = `
Información de la Reserva:
ID: ${reservaActualizada.id}
Fecha de Reserva: ${reservaActualizada.fecha_reserva}
Hora de Reserva: ${reservaActualizada.hora_reserva}
Cantidad de Adultos: ${reservaActualizada.cant_adultos}
Cantidad de Niños: ${reservaActualizada.cant_ninos}
Estado de Reserva: *${reservaActualizada.estado_reserva}*
Motivo de Reserva: ${reservaActualizada.motivo_reserva}

Cliente:
Nombre: ${client.name} ${client.lastname}
Email: ${client.email}
Teléfono: ${client.cellphone}
Dirección: ${client.address}

*Reserva confirmada*, la tolerancia es de 15 minutos desde la hora de reserva

¡Gracias por elegirnos!
`;
                    await whatsappHelper.sendResponseMessage(mensaje, senderID);
                } else {
                    await whatsappHelper.sendResponseMessage(`Bienvenido a Intimar, no encontramos una reserva pendiente registrada para  ti`, senderID);
                }
            } else {
                await whatsappHelper.sendResponseMessage(`Bienvenido a Intimar, no encontramos tu información en nuestros registros`, senderID);
            }
        } else {
            await whatsappHelper.sendResponseMessage(`Bienvenido a Intimar, comunicate con nosotros ....`, senderID);
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al responder el mensaje de reserva",
            error: err.message,
        });
    }
};

//Whatsapp API test
exports.sendMessage = async (req, res) => {
    try {
        const { number } = req.body;

        if (!number) {
            return res.status(400).json({
                error: "El número de teléfono es requerido."
            });
        }

        const response = await whatsappHelper.sendTemplateMessage(number, 'es');
        res.status(200).json({
            response
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

exports.getWebhook = async (req, res) => {
    try {
        const verifyToken = mysecretkey;

        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log(mode, token, challenge);

        if (mode && token === verifyToken) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
}

//Funcion que mapea los mensajes whatsapp bussiness
exports.postWebhook = async (req, res) => {
    try {
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            await Promise.all(body.entry.map(async entry => {
                await Promise.all(entry.changes.map(async change => {
                    if (change.field === 'messages') {
                        const messageData = change.value.messages[0];
                        const contact = change.value.contacts[0];

                        const from = messageData.from; // ID del remitente
                        const name = contact.profile.name; // Nombre del remitente
                        const messageText = messageData.text.body; // Texto del mensaje
                        const timestamp = messageData.timestamp; // Marca de tiempo del mensaje
                        const messageId = messageData.id; // ID del mensaje

                        console.log('Número del remitente:', from);
                        console.log('Nombre del remitente:', name);
                        console.log('Contenido del mensaje:', messageText);
                        console.log('Marca de tiempo:', timestamp);
                        console.log('ID del mensaje:', messageId);

                        // Procesando el mensaje

                        if 
                        (
                            messageText.toLowerCase() === 'confirmo' || 
                            messageText.toLowerCase() === 'confirm' ||
                            messageText.toLowerCase() === 'ok'
                        ) 
                        {
                            // Busca el cliente en la base de datos
                            const client = await Client.findOne({
                                where: Sequelize.where(
                                    Sequelize.fn('concat', Sequelize.col('countryCode'), Sequelize.col('cellphone')),
                                    from
                                )
                            });

                            if (client) 
                            {
                                const reserva = await Reserva.findOne({
                                    where: {
                                        clienteId: client.id,
                                        estado_reserva: "Pendiente a confirmar",
                                    },
                                    order: [['createdAt', 'DESC']],
                                });

                                if (reserva) 
                                {
                                    // Actualizar la reserva con el estado_reserva confirmada
                                    await Reserva.update({ estado_reserva: "Confirmada" }, { where: { id: reserva.id } });

                                    // Recarga la reserva después de la actualización
                                    const reservaActualizada = await Reserva.findByPk(reserva.id, {
                                        include: [
                                            { model: Client },
                                        ]
                                    });

                                    // Enviando mensaje
                                    //await whatsappHelper.sendReservaConfirmMessageWhastapp(reservaActualizada);
                                    await whatsappHelper.sendReservaValidationMessageWhastapp(reservaActualizada);
                                } 
                                else 
                                {
                                    await whatsappHelper.sendTemplateDefault(from);
                                }
                            } 
                            else 
                            { 
                                await whatsappHelper.sendTemplateDefault(from);
                            }
                        } 
                        else 
                        {
                            await whatsappHelper.sendTemplateDefault(from);
                        }
                    }
                }));
            }));
        }
        res.sendStatus(200);
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
};