const db = require("../models");
const { user: User, role: Role } = db;
const Op = db.Sequelize.Op;
var bcrypt = require("bcryptjs");

exports.employeeMe = async (req, res) => {
    try {
        const employee = await User.findByPk(req.userId, {
            attributes: ['name', 'lastname'] 
        });

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado." });
        }
        
        return res.status(200).json({ name: employee.name, lastname: employee.lastname });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}


exports.employeeMeProfile = async (req, res) => {
    try {
        const employee = await User.findByPk(req.userId);

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado." });
        }
        
        let authorities = [];

        employee.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
              authorities.push("ROL_" + roles[i].name.toUpperCase());
            }
            res.status(200).send({
              name: employee.name,
              lastname: employee.lastname,
              cellphone: employee.cellphone,
              email: employee.email,
              roles: authorities,
            });
          });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

exports.allEmployees = async (req, res) => {
    try {
        const employees = await User.findAll({
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'name']
            }]
        });

        const formattedEmployees = formatEmployees(employees)

        return res.status(200).json({
            cantidad: formattedEmployees.length,
            data: formattedEmployees
        });
        
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const { id, roles, password, ...updateData } = req.body;

        if(password){
            updateData.password = bcrypt.hashSync(password, 8)
        }

        const [rowsUpdated] = await User.update(updateData, { where: { id: employeeId } });

        if (rowsUpdated === 0) {
            return res.status(404).json({ message: "Empleado no encontrado." });
        }

        if (roles) {
            const employee = await User.findByPk(employeeId);
            if (!employee) {
                return res.status(404).json({ message: "Empleado no encontrado." });
            }

            const rolesFound = await Role.findAll({
                where: {
                    name: {
                        [Op.or]: roles
                    }
                }
            });

            if (!rolesFound || rolesFound.length === 0) {
                return res.status(404).json({ message: "No se encontraron roles válidos." });
            }

            await employee.setRoles(rolesFound);
        }

        return res.status(200).json({ message: "Usuario/empleado actualizado correctamente!" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}


exports.deleteEmployee = async (req, res) => {
    try {
        await User.destroy({ where: { id: req.params.id } });
        return res.json({ message: "Empleado eliminado correctamente" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params; 

        const employee = await User.findOne({
            where: { id: id },
            include: [{
                model: Role,
                as: 'roles', 
                attributes: ['id', 'name'] 
            }]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        return res.status(200).json({ data: formatEmployee(employee) });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getEmployeeByEmail = async (req, res) => {
    try {
        const { email } = req.body; 

        if (!email) {
            return res.status(400).json({ message: 'Email es requerido' });
        }

        const employee = await User.findOne({
            where: { email: email },
            include: [{
                model: Role,
                as: 'roles', 
                attributes: ['id', 'name'] 
            }]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        return res.status(200).json({ data: formatEmployee(employee) });
        
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getEmployeeByCellphone = async (req, res) => {
    try {
        const { cellphone } = req.body; 

        if (!cellphone) {
            return res.status(400).json({ message: 'Telefono es requerido' });
        }

        const employee = await User.findOne({
            where: { cellphone: cellphone },
            include: [{
                model: Role,
                as: 'roles', 
                attributes: ['id', 'name'] 
            }]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        return res.status(200).json({ data: formatEmployee(employee) });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.employeesByNameOrLastname = async (req, res) => {
    try {
        const { name } = req.body; 

        if (!name) {
            return res.status(400).json({ message: 'El campo "name" es requerido.' });
        }

        const employees = await User.findAll({
            where: {
                [Op.or]: [ 
                    { name: { [Op.like]: `%${name}%` } }, 
                    { lastname: { [Op.like]: `%${name}%` } } 
                ]
            },
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'name']
            }]
        });

        const formattedEmployees = formatEmployees(employees)

        return res.status(200).json({
            cantidad: formattedEmployees.length,
            data: formattedEmployees
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.employeesByRole = async (req, res) => {
    try {
        const { roleName } = req.body; 

        if (!roleName) {
            return res.status(400).json({ message: 'El campo "roleName" es requerido.' });
        }

        const employeesWithRole = await User.findAll({
            include: [{
                model: Role,
                as: 'roles',
                where: { name: { [Op.like]: `%${roleName}%` } }
            }]
        });

        //Estamos obteniendo los ids por que la anterior consulta no devuelve todos los roles
        const employeeIds = employeesWithRole.map(emp => emp.id);

        const employees = await User.findAll({
            where: {
                id: { [Op.in]: employeeIds } 
            },
            include: [{
                model: Role,
                as: 'roles', 
                attributes: ['id', 'name']
            }]
        });

        const formattedEmployees = formatEmployees(employees)

        return res.status(200).json({
            cantidad: formattedEmployees.length,
            data: formattedEmployees
        });

    } catch (err) {
        // Maneja errores y responde con estado 500 y el mensaje de error
        return res.status(500).json({ message: err.message });
    }
};

const formatEmployee = (employee) => {
    const formattedEmployee = {
        id: employee.id,
        name: employee.name,
        lastname: employee.lastname,
        email: employee.email,
        cellphone: employee.cellphone,
        roles: employee.roles.map(role => ({
            id: role.id,
            name: role.name
        }))
    };
    return formattedEmployee
}

const formatEmployees = (employees) =>{
    const formattedEmployees = employees.map(employee => {
        return {
            id: employee.id,
            name: employee.name,
            lastname: employee.lastname,
            email: employee.email,
            cellphone: employee.cellphone,
            roles: employee.roles.map(role => ({
                id: role.id,
                name: role.name
            }))
        };
    });

    return formattedEmployees
}