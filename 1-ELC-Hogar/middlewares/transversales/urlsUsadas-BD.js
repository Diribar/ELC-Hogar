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
	const tieneQuery = ruta.includes("/?");
	const condicion = {cliente_id, ruta};
	tieneQuery
		? baseDeDatos // si tiene query, se fija que no esté repetido
				.obtienePorCondicion("rutasDelDia", condicion)
				.then((n) => (!n ? baseDeDatos.agregaRegistro("rutasDelDia", condicion) : null))
		: baseDeDatos // si no tiene query, se fija que no sea un 'refresh'
				.obtienePorCondicionElUltimo("rutasDelDia", {cliente_id})
				.then((n) => (!n || n.ruta != ruta ? baseDeDatos.agregaRegistro("rutasDelDia", condicion) : null));

	// Fin
	next();
};
