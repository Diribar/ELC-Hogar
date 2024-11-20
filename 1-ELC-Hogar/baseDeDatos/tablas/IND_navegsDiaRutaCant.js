module.exports = (sequelize, dt) => {
	const alias = "navegsDiaRutaCant"; // rutas navegadas por día
	const columns = {
		fecha: {type: dt.DATE},
		ruta: {type: dt.STRING(50)},
		cant: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_navegs_dia_ruta_cant",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
