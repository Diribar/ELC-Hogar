module.exports = (sequelize, dt) => {
	const alias = "cantNavegsAcum"; // cantidad de navegantes por día
	const columns = {
		fecha: {type: dt.STRING(10)},
		anoMes: {type: dt.STRING(3)},

		// Tipos de navegantes
		logins: {type: dt.INTEGER},
		usSinLogin: {type: dt.INTEGER},
		visitas: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_pers_web_dia_cant",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};