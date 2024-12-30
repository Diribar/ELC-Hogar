// Muestra carteles que se activan con el acceso al sitio (no se usa con apis)
"use strict";

module.exports = async (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.originalMethod != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Variables
	const {usuario, cliente} = req.session;
	const {cliente_id} = cliente;
	const esUsuario = cliente_id.startsWith("U");
	const tabla = esUsuario ? "usuarios" : "visitas";
	let informacion;

	// Cartel de novedades
	if (!informacion && cliente.versionElc != versionElc) {
		// Variables
		const permisos = ["permInputs", "autTablEnts", "revisorPERL", "revisorLinks", "revisorEnts", "revisorUs"];
		let novedades = novedadesELC.filter((n) => n.versionElc > cliente.versionElc); // obtiene las novedades

		// Si la novedad especifica un permiso que el cliente no tiene, se la descarta
		for (let i = novedades.length - 1; i >= 0; i--)
			for (let permiso of permisos)
				if (novedades[i][permiso] && !cliente.rolUsuario[permiso]) {
					novedades.splice(i, 1);
					break;
				}

		// Si hubieron novedades, genera la información
		if (novedades.length)
			informacion = {
				mensajes: novedades.map((n) => n.comentario),
				iconos: [variables.vistaEntendido(req.originalUrl)],
				titulo: "Novedad" + (novedades.length > 1 ? "es" : "") + " del sitio",
				check: true,
			};

		// Actualiza la versión en la tabla usuario y en la variable usuario
		baseDeDatos.actualizaPorCondicion(tabla, {cliente_id}, {versionElc});
		cliente.versionElc = versionElc;
	}

	// Cartel de beneficios para clientes sin login
	if (!informacion && cliente.diasSinCartelBenefs >= 5 && !usuario) {
		// Opciones si es un usuario
		if (esUsuario)
			informacion = {
				iconos: [
					{...variables.vistaEntendido(req.session.urlActual), autofocus: true},
					{clase: iconos.login + " amarillo", link: "/usuarios/login", titulo: "Ir a login"},
				],
				titulo: "Beneficios de loguearte",
			};
		// Opciones si es una visita
		else
			informacion = {
				iconos: [
					{...variables.vistaEntendido(req.session.urlActual), autofocus: true},
					{clase: iconos.altaUser + " amarillo", link: "/usuarios/alta-mail", titulo: "Crear un usuario"},
				],
				titulo: "Beneficios de crearte un usuario",
			};
		informacion.mensajes = beneficiosLogin;
		informacion.trabajando = true;

		// Actualiza la tabla usuario/visita y la variable cliente
		baseDeDatos.actualizaPorCondicion(tabla, {cliente_id}, {diasSinCartelBenefs: 0});
		cliente.diasSinCartelBenefs = 0;
	}

	// Fin
	if (informacion) return res.render("CMP-0Estructura", {informacion});
	return next();
};
