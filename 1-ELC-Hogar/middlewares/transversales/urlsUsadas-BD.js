"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (comp.omitirMiddlewsTransv(req)) return next();
	if (req.originalMethod != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();

	// Obtiene el cliente
	const {cliente_id} = req.session.cliente;

	// Obtiene la ruta
	let {originalUrl: ruta} = req;
	if (ruta.includes("&")) ruta = ruta.split("&")[0];
	if (ruta.startsWith("/consultas")) ruta = "/consultas";
	const distintivo = comp.distintivosDeRutas(ruta);
	if (!distintivo) {
		console.log("¡Atención! - Ruta sin distintivo:", ruta);
		return next();
	}

	// Guarda el registro de navegación
	baseDeDatos.agregaRegistro("navegsDia", {cliente_id, ruta});

	// Fin
	next();
};
