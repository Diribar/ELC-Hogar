module.exports = (sequelize, dt) => {
	const alias = "cantNavegsDia";// cantidad de navegantes por día
	const columns = {
		cliente_id: {type: dt.STRING(11)},
		usuario_id: {type: dt.INTEGER},
		fecha: {type: dt.STRING(10)},
		visitaCreadaEn: {type: dt.STRING(10)}, // para la estadística
		diasNaveg: {type: dt.INTEGER}, // para la estadística
	};
	const config = {
		tableName: "ind_cant_navegs_dia",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
