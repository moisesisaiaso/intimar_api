const s3methods =  require("../helpers/aws.helpers.js");

exports.transformImagenAnticipo = async (anticipo) => {
    if (anticipo && anticipo.imagen_anticipo) {
        const url = await s3methods.getObjectURL(anticipo.imagen_anticipo);
        anticipo.imagen_anticipo = url;
    }
    return anticipo;
};