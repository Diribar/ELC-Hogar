module.exports = (sequelize, dt) => {
	const alias = "navegsDia"; // navegaciones por rutas durante el día
	const columns = {
		cliente_id: {type: dt.STRING(11)},
		ruta: {type: dt.STRING(100)},
		fecha: {type: dt.DATE},
	};
	const config = {
		tableName: "ind_navegs_dia",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
