module.exports = (sequelize, dt) => {
	const alias = "navegsDiaProdCant"; // rutas navegadas por día
	const columns = {
		fecha: {type: dt.DATE},
		nombreCastellano: {type: dt.STRING(80)},
		entidad: {type: dt.STRING(11)},
		prodId: {type: dt.INTEGER},
		cant: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_navegs_dia_prod_cant",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
