module.exports = (sequelize, dt) => {
	const alias = "navegsDiaProdCant"; // rutas navegadas por día
	const columns = {
		fecha: {type: dt.DATE},
		producto: {type: dt.STRING(80)},
		cant: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_navegs_dia_prod_cant",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};