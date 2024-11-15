module.exports = (sequelize, dt) => {
	const alias = "cantClientesAcum"; // cantidad de clientes en BD
	const columns = {
		fecha: {type: dt.STRING(10)},
		anoMes: {type: dt.STRING(3)},

		// Fidelidad de clientes
		tresDiez: {type: dt.INTEGER},
		onceTreinta: {type: dt.INTEGER},
		masDeTreinta: {type: dt.INTEGER},
		unoDos: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_cant_clientes_acum",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
