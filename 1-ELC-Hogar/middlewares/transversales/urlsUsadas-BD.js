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
	if (ruta == "/institucional/inicio") return next(); // saltea, porque redirecciona a "/inicio"
	if (ruta.startsWith("/consultas")) return next(); // se guarda desde una API dedicada
	if (ruta.includes("&")) ruta = ruta.split("&")[0];

	// Obtiene el comentario
	let comentario;
	if (ruta.startsWith("/institucional")) {
		const vista = Object.keys(vistasInstitucs).find((n) => ruta.includes("/" + n));
		if (vista) comentario = vistasInstitucs[vista].titulo;
	}

	// Guarda el registro de navegación
	comp.guardaRegistroNavegac({cliente_id, ruta, comentario, reqHeaders: req.headers["user-agent"]});

	// Fin
	next();
};
