"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.originalMethod != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Variables
	const {cliente_id} = req.session.cliente;
	let {originalUrl: ruta} = req;

	// Motivos para discontinuar la función
	if (ruta == "/institucional/inicio") return next(); // saltea, porque redirecciona a "/inicio"
	if (ruta.startsWith("/consultas")) return next(); // se guarda desde una API dedicada
	if (ruta.includes("/agregar-")) return next(); // saltea, porque se guarda desde la controladora

	// Quita el 'query' de la ruta
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
