"use strict";

module.exports = (req, res, next) => {
	// Variables
	const {cliente_id} = req.session.cliente;
	let {originalUrl: ruta} = req;
	let comentario;

	// Motivos para discontinuar la función
	if (cliente_id == "U000000001") return next();

	// Guarda el registro de navegación
	comp.guardaRegistroNavegac({cliente_id, ruta, comentario, reqHeaders: req.headers["user-agent"]});

	// Fin
	next();
};
