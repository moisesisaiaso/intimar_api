const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const yourTwilioNumber = process.env.TWILIO_NUMBER;

const clientTwilio = require('twilio')(accountSid, authToken);

exports.sendReservaMessage = async (reserva) => {
    try {
        const client = reserva.client;
        const number = client.cellphone;
        const countryCode = client.countryCode;

        const mensaje = `
Información de la Reserva:
ID: ${reserva.id}
Fecha de Reserva: ${reserva.fecha_reserva}
Hora de Reserva: ${reserva.hora_reserva}
Cantidad de Adultos: ${reserva.cant_adultos}
Cantidad de Niños: ${reserva.cant_ninos}
Estado de Reserva: *${reserva.estado_reserva}*
Motivo de Reserva: ${reserva.motivo_reserva}

Cliente:
Nombre: ${client.name} ${client.lastname}
Email: ${client.email}
Teléfono: ${client.cellphone}
Dirección: ${client.address}

Para confirmar su reserva responda *CONFIRMO*, esto es necesario para validar su reserva.

¡Gracias por elegirnos!
`;

        await clientTwilio.messages.create({
            body: mensaje,
            from: `whatsapp:${yourTwilioNumber}`,
            to: `whatsapp:+${countryCode}${number}`
        });

    } catch (err) {
        console.error(err);
    }
};

exports.sendResponseMessage = async (message, senderID) => {
    try {
        clientTwilio.messages
            .create({
                body: message,
                from: `whatsapp:${yourTwilioNumber}`,
                to: senderID
            })
            .then(message => console.log(message));
    } catch (err) {
        console.error(err);
    }
}

//Whatsapp  API
const axios = require('axios');
const { whatsappToken, whatsappNumberID } = require("../../config/whatsapp.config.js");

exports.sendTemplateMessage = async (senderID, languageCode = 'en_US') => {
    try {
        const templateParams = [
            "Jacko",                // Nombre
            "43",                   // ID de reserva
            "11-12-2024",           // Fecha de reserva
            "14:00:00",             // Hora de reserva
            "5",                    // Cantidad de adultos
            "1",                    // Cantidad de niños
            "Pendiente a confirmar", // Estado de la reserva
            "Graduacion"            // Motivo de la reserva
        ];

        const data = {
            messaging_product: "whatsapp",
            to: senderID,
            type: "template",
            template: {
                name: "info_reserva",
                language: {
                    code: languageCode
                },
                components: [
                    {
                        type: "body",
                        parameters: templateParams.map(param => ({
                            type: "text",
                            text: param
                        }))
                    }
                ]
            }
        };

        const config = {
            method: 'post',
            url: `https://graph.facebook.com/v21.0/${whatsappNumberID}/messages`,
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            },
            data: data
        };

        const response = await axios(config);

        return response.data; // Devuelve la respuesta completa de la API
    } catch (err) {
        console.error('Error al enviar el mensaje:', err.response ? err.response.data : err.message);
        throw new Error(`Error al enviar el mensaje: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
    }
};

//WHATSAPP API WITH RESERVA
//Enviar mensaje para mostrar info reserva
exports.sendReservaMessageWhastapp = async (reserva) => {
    try {
        const { 
            client, 
            id, 
            fecha_reserva, 
            hora_reserva,
            cant_adultos,
            cant_ninos,
            estado_reserva,
            anticipo 
        } = reserva;

        const { languaje } = client;

        const templateParams = [
            client?.name ?? '',                // Nombre (usa '' si es nulo o undefined)
            id ?? '',                          // ID de reserva (usa '' si es nulo o undefined)
            `${client?.name ?? ''} ${client?.lastname ?? ''}`, // Nombre completo (maneja nulos en ambos campos)
            fecha_reserva ?? '',               // Fecha de reserva
            hora_reserva ?? '',                // Hora de reserva
            cant_adultos ?? 0,                 // Cantidad de adultos (usa 0 si es nulo o undefined)
            cant_ninos ?? 0,                   // Cantidad de niños (usa 0 si es nulo o undefined)
            estado_reserva ?? '',              // Estado de la reserva
            `${(anticipo?.monto_anticipo ?? 0).toString().trim()}${anticipo?.moneda ? ` ${anticipo.moneda.trim()}` : ''}`
        ];

        const number = `${client.countryCode}${client.cellphone}`;

        const languageCode = languaje === 'en_US' ? 'en' : languaje;

        await this.sendTemplateInfoReserva(number, templateParams, languageCode);

    } catch (err) {
        console.error(err);
    }
};

//Enviar mensaje para confirmar reserva
exports.sendReservaConfirmMessageWhastapp = async (reserva) => {
    try {
        const { 
            client, 
            id, 
            fecha_reserva, 
            hora_reserva,
            cant_adultos,
            cant_ninos,
            estado_reserva,
            motivo_reserva 
        } = reserva;

        const { languaje } = client;

        const templateParams = [
            client.name,                // Nombre
            id,                   // ID de reserva
            fecha_reserva,           // Fecha de reserva
            hora_reserva,             // Hora de reserva
            cant_adultos,                    // Cantidad de adultos
            cant_ninos,                    // Cantidad de niños
            estado_reserva, // Estado de la reserva
            motivo_reserva            // Motivo de la reserva
        ];

        const number = `${client.countryCode}${client.cellphone}`;

        const languageCode = languaje === 'en_US' ? 'en' : languaje;

        await this.sendTemplateConfirmacionReserva(number, templateParams, languageCode);

    } catch (err) {
        console.error(err);
    }
};

//Enviar mensaje para validar reserva
exports.sendReservaValidationMessageWhastapp = async (reserva) => {
    try {
        const { 
            client, 
        } = reserva;

        const { languaje } = client;

        const number = `${client.countryCode}${client.cellphone}`;

        const languageCode = languaje === 'en_US' ? 'en' : languaje;

        await this.sendTemplateValidacionReserva(number, languageCode);
    } catch (err) {
        console.error(err);
    }
};

//Template info reserva
exports.sendTemplateInfoReserva = async (senderID, templateParams, languageCode = 'es') => {
    try {
        console.log("Enviando mensaje de info_reserva")

        const data = {
            messaging_product: "whatsapp",
            to: senderID,
            type: "template",
            template: {
                name: "info_reserva",
                language: {
                    code: languageCode
                },
                components: [
                    {
                        type: "body",
                        parameters: templateParams.map(param => ({
                            type: "text",
                            text: (param || '-').toString()
                        }))
                    }
                ]
            }
        };

        const config = {
            method: 'post',
            url: `https://graph.facebook.com/v21.0/${whatsappNumberID}/messages`,
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            },
            data: data
        };

        const response = await axios(config);
        return response.data; // Devuelve la respuesta completa de la API
    } catch (err) {
        console.error('Error al enviar el mensaje:', err.response ? err.response.data : err.message);
    }
};

//Template confirmacion reserva
exports.sendTemplateConfirmacionReserva = async (senderID, templateParams, languageCode = 'es') => {
    try {
        const headerImageUrl = "https://res.cloudinary.com/ddgwgczsf/image/upload/v1716311724/flyer-Intimar.jpg";

        const data = {
            messaging_product: "whatsapp",
            to: senderID,
            type: "template",
            template: {
                name: "confirmacion_reserva",
                language: {
                    code: languageCode
                },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "image",
                                image: {
                                    link: headerImageUrl
                                }
                            }
                        ]
                    },
                    {
                        type: "body",
                        parameters: templateParams.map(param => ({
                            type: "text",
                            text: (param || '-').toString()
                        }))
                    }
                ]
            }
        };

        const config = {
            method: 'post',
            url: `https://graph.facebook.com/v21.0/${whatsappNumberID}/messages`,
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            },
            data: data
        };

        const response = await axios(config);
        return response.data; // Devuelve la respuesta completa de la API
    } catch (err) {
        console.error('Error al enviar el mensaje:', err.response ? err.response.data : err.message);
    }
};

//Template validacion reserva
exports.sendTemplateValidacionReserva = async (senderID, languageCode = 'es') => {
    try {
        const headerImageUrl = "https://res.cloudinary.com/ddgwgczsf/image/upload/v1716311724/flyer-Intimar.jpg";

        console.log("Enviando mensaje de reserva_validada")

        const data = {
            messaging_product: "whatsapp",
            to: senderID,
            type: "template",
            template: {
                name: "reserva_validada",
                language: {
                    code: languageCode
                },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "image",
                                image: {
                                    link: headerImageUrl
                                }
                            }
                        ]
                    },
                    {
                        type: "body",
                        parameters: [] // No se requieren parámetros en el cuerpo
                    }
                ]
            }
        };

        const config = {
            method: 'post',
            url: `https://graph.facebook.com/v21.0/${whatsappNumberID}/messages`,
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            },
            data: data
        };

        const response = await axios(config);
        return response.data; // Devuelve la respuesta completa de la API
    } catch (err) {
        console.error('Error al enviar el mensaje:', err.response ? err.response.data : err.message);
    }
};

//Template validacion reserva
exports.sendTemplateDefault = async (senderID, languageCode = 'es') => {
    try {
        
        console.log("Enviando mensaje de default")

        const data = {
            messaging_product: "whatsapp",
            to: senderID,
            type: "template",
            template: {
                name: "default",
                language: {
                    code: languageCode
                },
                components: [
                    {
                        type: "body",
                        parameters: [] // No se requieren parámetros en el cuerpo
                    }
                ]
            }
        };
        
        const config = {
            method: 'post',
            url: `https://graph.facebook.com/v21.0/${whatsappNumberID}/messages`,
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            },
            data: data
        };

        const response = await axios(config);
        return response.data; // Devuelve la respuesta completa de la API
    } catch (err) {
        console.error('Error al enviar el mensaje:', err.response ? err.response.data : err.message);
    }
};