"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.originalMethod != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Obtiene el cliente
	const {cliente_id} = req.session.cliente;
	if (cliente_id == "U0000000011") return next();

	// Obtiene la ruta
	let {originalUrl: ruta} = req;
	if (ruta.startsWith("/consultas")) ruta = "/consultas";
	if (ruta.includes("&")) ruta = ruta.split("&")[0];

	// Guarda el registro de navegación
	baseDeDatos.agregaRegistro("navegsDia", {cliente_id, ruta});

	// Fin
	next();
};
