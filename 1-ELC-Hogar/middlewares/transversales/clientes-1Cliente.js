// Obtiene 'usuario' y 'cliente'
"use strict";

module.exports = async (req, res, next) => {
	// Si es una de las aplicaciones triviales, avanza
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Variables
	let {usuario, cliente} = req.session;
	let cliente_id;

	// Si el 'cliente_id' tiene un valor y coincide en ambas variables, interrumpe la función
	if (usuario && cliente && usuario.cliente_id && usuario.cliente_id == cliente.cliente_id) {
		res.locals.usuario = usuario;
		return next();
	}

	// Obtiene el usuario de su cookie 'mail'
	if (!usuario && req.cookies && req.cookies.email) {
		// Obtiene el usuario
		const {email} = req.cookies;
		usuario = await comp.obtieneUsuarioPorMail(email);

		// Si existe el usuario, lleva a cero el campo 'diasSinCartelBenefs'
		if (usuario) {
			baseDeDatos.actualizaPorId("usuarios", usuario.id, {diasSinCartelBenefs: 0});
			usuario.diasSinCartelBenefs = 0;
		}
		// De lo contrario, borra esa cookie
		else res.clearCookie("email");
	}

	// Cliente - 1. Usuario logueado: lo obtiene del usuario
	if (usuario && (!cliente || usuario.cliente_id != cliente.cliente_id)) {
		// Obtiene el cliente
		cliente = obtieneCamposNecesarios(usuario);

		// Si corresponde, actualiza la cookie
		const {cliente_id} = cliente;
		if (!req.cookies.cliente_id || req.cookies.cliente_id != cliente_id)
			res.cookie("cliente_id", cliente_id, {maxAge: unAno});
	}

	// Cliente - 2. Visita con cookie 'cliente_id': lo obtiene de esa cookie
	if (!cliente && req.cookies && req.cookies.cliente_id) {
		// Variables
		cliente_id = req.cookies.cliente_id;
		const esUsuario = cliente_id.startsWith("U");

		// Obtiene el cliente
		const tabla = esUsuario ? "usuarios" : "visitas";
		cliente = await baseDeDatos
			.obtienePorCondicion(tabla, {cliente_id}, "rolUsuario")
			.then((n) => (n ? obtieneCamposNecesarios(n) : null));
	}

	// Cliente - 3. No existe en BD: lo crea
	if (!cliente) {
		// Variables
		const datos = {versionElc};
		if (cliente_id) datos.diasNaveg = 1; // si existe el cliente_id, es que alguna vez hizo una navegación

		// Crea el cliente
		cliente = await baseDeDatos.agregaRegistroIdCorrel("visitas", datos);
		req.session.recienCreado = true;

		// Crea un nuevo 'cliente_id'
		cliente_id = "V" + String(cliente.id).padStart(10, "0");

		// Actualiza o crea la cookie
		res.cookie("cliente_id", cliente_id, {maxAge: unAno});

		// Actualiza el 'cliente_id' en la BD
		await baseDeDatos.actualizaPorId("visitas", cliente.id, {cliente_id}); // es crítico el 'await'

		// Actualiza el cliente con los campos necesarios
		cliente = await baseDeDatos.obtienePorId("visitas", cliente.id, "rolUsuario").then((n) => obtieneCamposNecesarios(n));
	}

	// Actualiza usuario y cliente
	req.session.cliente = cliente;
	if (usuario) {
		req.session.usuario = usuario;
		res.locals.usuario = usuario;
	}

	// Fin
	return next();
};

const obtieneCamposNecesarios = (usuario) => {
	// Variables
	const camposNecesarios = [
		...["id", "cliente_id"], // identificación
		"fechaUltNaveg", // para el 'contador de navegaciones'
		...["diasNaveg", "visitaCreadaEn"], // para la tabla 'cantNavegsAcum'
		...["versionElc", "diasSinCartelBenefs"], // para mostrar carteles
		"rolUsuario", // para mostrar carteles
	];

	// Obtiene los datos para la variable cliente
	const cliente = {};
	for (const campo of camposNecesarios) cliente[campo] = usuario[campo];

	// Adecua el campo 'visitaCreadaEn'
	cliente.visitaCreadaEn = comp.fechaHora.fechaSinHora(cliente.visitaCreadaEn);

	// Fin
	return cliente;
};
