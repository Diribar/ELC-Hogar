module.exports = (sequelize, dt) => {
	const alias = "navegsDiaRutaCant"; // rutas navegadas por día
	const columns = {
		id: {type: dt.STRING(2), primaryKey: true},
		fecha: {type: dt.DATE},

		// Rutas
		inicio: {type: dt.INTEGER},
		busquedaRapida: {type: dt.INTEGER},
		consultas: {type: dt.INTEGER},
		detalleDeProd: {type: dt.INTEGER},
		detalleDeRclv: {type: dt.INTEGER},
		edicionDeProd: {type: dt.INTEGER},
		edicionDeRclv: {type: dt.INTEGER},
		calificarProd: {type: dt.INTEGER},
		mirarLinks: {type: dt.INTEGER},
		institucional: {type: dt.INTEGER},
		revisionTablero: {type: dt.INTEGER},
		mantenimiento: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_navegs_dia_ruta_cant",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
