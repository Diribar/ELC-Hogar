module.exports = (sequelize, dt) => {
	const alias = "rutasDelDia";
	const columns = {
		cliente_id: {type: dt.STRING(11)},
		ruta: {type: dt.STRING(100)},
		fecha: {type: dt.DATE},
	};
	const config = {
		tableName: "ind_rutas_del_dia",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
