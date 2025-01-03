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
	prodRclvNombre(ruta).then((nombre) => {
		if (!comentario && nombre) comentario = nombre.slice(0, 20);
		let dispCliente = req.headers["user-agent"];
		for (let metodo in requestsClientes) if (requestsClientes[metodo] == dispCliente) dispCliente = metodo; // convierte la descripción larga en un código
		baseDeDatos.agregaRegistro("navegsDia", {cliente_id, ruta, comentario, dispCliente});
	});

	// Fin
	next();
};

// Funciones
const prodRclvNombre = async (ruta) => {
	// Si no tiene id, interrumpe la función
	const tieneId = ruta.split("/?id=").length > 1;
	if (!tieneId) return;

	// Averigua la entidad y el id
	let entidad = variables.entidades.todos.find((n) => ruta.includes("/" + n + "/"));
	let id = ruta.split("/?id=")[1].split("&")[0];

	// Si es un link, averigua el producto
	if (ruta.startsWith("/links/mirar/l")) {
		const link = await baseDeDatos.obtienePorId("links", id);
		entidad = comp.obtieneDesdeCampo_id.entProd(link);
		const campo_id = comp.obtieneDesdeCampo_id.campo_id(link);
		id = link[campo_id];
	}

	// Obtiene el nombre
	const nombre = await baseDeDatos.obtienePorId(entidad, id).then((n) => n.nombreCastellano || n.nombreOriginal || n.nombre);

	// Fin
	return nombre;
};
