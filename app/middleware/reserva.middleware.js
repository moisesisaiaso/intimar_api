const db = require("../models");
const moment = require('moment-timezone');
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

const checkAforoMiddleware = async (req, res, next) => {
  try {
    const configuracion = await Config.findOne();
    let { fecha_reserva, hora_reserva, cant_adultos, cant_ninos } = req.body;

    //formateo
    cant_adultos = parseInt(cant_adultos);
    cant_ninos = parseInt(cant_ninos);

    //Validar hora de reserva
    const reservationTime = moment(req.body.hora_reserva, 'HH:mm:ss');
    const openingTime = moment(configuracion.hora_min, 'HH:mm:ss');
    const closingTime = moment(configuracion.hora_max, 'HH:mm:ss');

    if (!reservationTime.isBetween(openingTime, closingTime, null, '[]')) {
      return res.status(400).json({
        message: `La hora de reserva debe estar entre las ${configuracion.hora_min} y las ${configuracion.hora_max}.`,
      });
    }

    //Validar si el anticipo es requerido o existe

    if ((cant_adultos + cant_ninos) >= parseInt(configuracion.anticipo_persona)) {
      req.body.anticipo_required = true;
    }

    if ((cant_adultos + cant_ninos) >= parseInt(configuracion.anticipo_persona) && (req.body.anticipo == undefined || req.body.anticipo == null)) {
      return res.status(400).json({ message: `Se requiere un anticipo para esta reserva, número de personas mayor igual a ${parseInt(configuracion.anticipo_persona)}` });
    }

    //Validacion de aforo reservas

    const horaMin = restarHoras(hora_reserva, configuracion.duracion_reserva);
    const horaMax = sumarHoras(hora_reserva, configuracion.duracion_reserva)
    const reservasExistententesFechaHora = await obtenerReservasPorFechaYHora(fecha_reserva, horaMin, horaMax);

    let aforo = 0

    reservasExistententesFechaHora.forEach(reserva => {
      aforo += (reserva.cant_ninos + reserva.cant_adultos);
    });

    const personas = cant_adultos + cant_ninos;

    if ((personas + aforo) > configuracion.aforo) {
      return res.status(401).json({ message: 'Aforo excedido en un punto de la reserva, pruebe con otra hora u fecha disponible' });
    }

    next();
  } catch (error) {
    console.error('Error en el middleware checkAforo:', error);
    return res.status(500).json({ message: 'Error en el middleware reserva' });
  }
};

const updateReservaMiddleware = async (req, res, next) => {
  try {
    const configuracion = await Config.findOne();

    // Obtener los datos de la solicitud
    let { fecha_reserva, hora_reserva, cant_adultos, cant_ninos } = req.body;

    const reservaId = req.params.id;
    const reserva = await Reserva.findByPk(reservaId, {
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
      ]
  });

    if (!reserva) {
      return res.status(404).json({
        message: "Reserva no encontrada",
      });
    }

    // Verificar si se ha proporcionado al menos uno de los valores
    if (!fecha_reserva && !hora_reserva && cant_adultos === undefined && cant_ninos === undefined) {
      return next();
    }

    // Si alguna de las variables no se envía en la solicitud, se utiliza el valor actual de la reserva
    if (!fecha_reserva) {
      fecha_reserva = reserva.fecha_reserva;
    }
    if (!hora_reserva) {
      hora_reserva = reserva.hora_reserva;
    }
    if (cant_adultos === undefined) {
      cant_adultos = reserva.cant_adultos;
    }
    if (cant_ninos === undefined) {
      cant_ninos = reserva.cant_ninos;
    }

    // Formatear los valores
    cant_adultos = parseInt(cant_adultos);
    cant_ninos = parseInt(cant_ninos);

    const totalPersonas = cant_adultos + cant_ninos;

    // Validar hora de reserva
    const reservationTime = moment(hora_reserva, 'HH:mm:ss');
    const openingTime = moment(configuracion.hora_min, 'HH:mm:ss');
    const closingTime = moment(configuracion.hora_max, 'HH:mm:ss');

    if (!reservationTime.isBetween(openingTime, closingTime, null, '[]')) {
      return res.status(400).json({
        message: `La hora de reserva debe estar entre las ${configuracion.hora_min} y las ${configuracion.hora_max}.`,
      });
    }

    //Validar si el anticipo es requerido o existe
    if ((cant_adultos + cant_ninos) >= parseInt(configuracion.anticipo_persona)) {
      req.body.anticipo_required = true;
    }

    // Validar si el anticipo es requerido o existe
    const { anticipo } = reserva;

    if (totalPersonas >= parseInt(configuracion.anticipo_persona) && (req.body.anticipo === undefined || req.body.anticipo === null) && (anticipo === null || anticipo === undefined)) {
      return res.status(400).json({
        message: `Se requiere un anticipo para actualizar esta reserva, número de personas mayor o igual a ${parseInt(configuracion.anticipo_persona)}.`,
      });
    }

    // Validacion de aforo reservas
    const horaMin = restarHoras(hora_reserva, configuracion.duracion_reserva);
    const horaMax = sumarHoras(hora_reserva, configuracion.duracion_reserva)
    const reservasExistententesFechaHora = await obtenerReservasPorFechaYHora(fecha_reserva, horaMin, horaMax);

    let aforo = 0

    reservasExistententesFechaHora.forEach(reserva => {
      aforo += (reserva.cant_ninos + reserva.cant_adultos);
    });

    // Si la actualización es para el mismo día y hora, restar el aforo anterior
    if (!req.body.fecha_reserva && !req.body.hora_reserva) {
      aforo -= (reserva.cant_adultos + reserva.cant_ninos);
    }

    if ((totalPersonas + aforo) > configuracion.aforo) {
      return res.status(401).json({ message: 'Aforo excedido en un punto de la reserva, pruebe con otra hora u fecha disponible' });
    }

    next();
  } catch (error) {
    console.error('Error en el middleware update reserva:', error);
    return res.status(500).json({ message: 'Error en el middleware update reserva' });
  }
};

// Función para obtener reservas en una fecha y rango de horas específicos
//Si la hora es 12:00:00
//Sera entre las 10:01:00 y las 13:59:00
const obtenerReservasPorFechaYHora = async (fecha, horaInicio, horaFin) => {
  try {
    const reservas = await Reserva.findAll({
      where: {
        fecha_reserva: {
          [Op.eq]: fecha,
        },
        hora_reserva: {
          [Op.gt]: horaInicio,  // Mayor que
          [Op.lt]: horaFin,    // Menor que
        },
      },
    });

    return reservas;
  } catch (error) {
    console.error('Error al obtener reservas por fecha y rango de horas:', error);
    throw error;
  }
};

// Función para sumar horas a una cadena de tiempo
const sumarHoras = (hora, horasASumar) => {
  const horaMoment = moment(hora, 'HH:mm:ss');
  const resultado = horaMoment.add(horasASumar, 'hours').format('HH:mm:ss');
  return resultado;
};

// Función para restar horas a una cadena de tiempo
const restarHoras = (hora, horasARestar) => {
  const horaMoment = moment(hora, 'HH:mm:ss');
  const resultado = horaMoment.subtract(horasARestar, 'hours').format('HH:mm:ss');
  return resultado;
};

module.exports = {
  checkAforoMiddleware,
  updateReservaMiddleware
};