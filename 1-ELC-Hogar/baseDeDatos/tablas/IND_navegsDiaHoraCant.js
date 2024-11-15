module.exports = (sequelize, dt) => {
	const alias = "cantDiaSemHora"; // cantidad de navegantes por hora de día de la semana
	const columns = {
	};
	const config = {
		tableName: "ind_navegs_dia_hora_cant",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
