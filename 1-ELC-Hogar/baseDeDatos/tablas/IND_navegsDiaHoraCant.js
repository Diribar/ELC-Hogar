module.exports = (sequelize, dt) => {
	const alias = "navegsDiaHoraCant"; // cantidad de navegantes por hora de día de la semana
	const columns = {
		diaSem: {type: dt.STRING(3)},
		hora: {type: dt.INTEGER},
		semAnt: {type: dt.INTEGER},
		semAct: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_navegs_dia_hora_cant",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
