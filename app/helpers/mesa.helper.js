const s3methods =  require("../helpers/aws.helpers.js");

exports.transformImagenMesa = async (mesa) => {
    if (mesa && mesa.imagen_mesa) {
        const url = await s3methods.getObjectURL(mesa.imagen_mesa);
        mesa.imagen_mesa = url;
    }
    return mesa;
};