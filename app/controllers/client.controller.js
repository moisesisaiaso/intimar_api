const db = require("../models");
const { client: Client } = db;
const Op = db.Sequelize.Op;

exports.createClient = async (req, res) => {
  try {
    // Verificar si el cliente con el mismo número de teléfono ha sido eliminado
    let client = await Client.findOne({
      where: { cellphone: req.body.cellphone },
      paranoid: false  // Incluir registros eliminados lógicamente
    });

    if (client) {
      if (client.deletedAt) {
        // Cliente encontrado y eliminado, restaurar y actualizar
        await client.restore();
        await client.update(req.body);
        return res.status(200).json({
          message: "Cliente restaurado y actualizado correctamente!",
          data: client
        });
      } else {
        return res.status(400).send({ message: "El número de teléfono ya está en uso." });
      }
    }


    let clientEmail = await Client.findOne({
      where: { email: req.body.email },
      paranoid: false  // Incluir registros eliminados lógicamente
    });

    if (clientEmail) {
      if (clientEmail.deletedAt) {
        // Cliente encontrado y eliminado, restaurar y actualizar
        await clientEmail.restore();
        await clientEmail.update(req.body);
        return res.status(200).json({
          message: "Cliente restaurado y actualizado correctamente!",
          data: clientEmail
        });
      } else {
        return res.status(400).send({ message: "El correo ya está en uso." });
      }
    }
    // Crear nuevo cliente si no se encontró un cliente existente
    client = await Client.create(req.body);
    return res.status(201).json({
      message: "Cliente creado correctamente!",
      data: client
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const existingClient = await Client.findOne({ where: { id: clientId } });

    if (!existingClient) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Desestructurar req.body y excluir el campo 'id'
    const { id, ...updateData } = req.body;

    // Actualizar el cliente con los datos actualizados
    await Client.update(updateData, { where: { id: clientId } });
    
    return res
      .status(200)
      .json({ message: "Cliente actualizado correctamente!" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


exports.deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    await Client.destroy({ where: { id: clientId } });
    return res.json({ message: "Cliente eliminado correctamente" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.allClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    return res.status(201).json({
      cantidad: clients.length,
      data: clients
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//Find client by name or lastname
exports.findClientByNameOrLastName = async (req, res) => {
  try {
    const name = req.body.name;
    const clients = await Client.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${name}%` } },
          { lastname: { [Op.iLike]: `%${name}%` } },
        ],
      },
    });
    return res.status(200).json({ clients });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// find client by id
exports.findClientById = async (req, res) => {
  try {
    const id = req.params.id;
    const client = await Client.findByPk(id);

    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

    return res.status(200).json({ client });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//Find client by cellphone
exports.findClientByCellphone = async (req, res) => {
  try {
    const cellphone = req.body.cellphone;
    const clients = await Client.findAll({
      where: {
        cellphone: { [Op.iLike]: `%${cellphone}%` } 
      },
    });
    return res.status(200).json({ clients });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//Find client by email
exports.findClientByEmail = async (req, res) => {
  try {
    const email = req.body.email;
    const clients = await Client.findAll({
      where: {
        email: { [Op.iLike]: `%${email}%` } 
      },
    });
    return res.status(200).json({ clients });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};