"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.originalMethod != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Si desconoce el url, muestra el cartel de error
	const rutaConHistorial = comp.rutasConHistorial(req.originalUrl);
	const rutaSinHistorial = comp.rutasSinHistorial(req.originalUrl);
	if (!rutaConHistorial && !rutaSinHistorial) {
		console.log("¡Atención! - Ruta desconocida:", req.originalUrl);
		const informacion = {
			mensajes: ["No tenemos esa dirección en nuestro sistema (url-historial)"],
			iconos: [variables.vistaInicio],
		};
		return res.render("CMP-0Estructura", {informacion});
	}

	// 'urlActual' y 'urlAnterior'
	const urlActual = req.originalUrl;
	const urlAnterior = req.session.urlActual
		? req.session.urlActual
		: req.cookies && req.cookies.urlActual
		? req.cookies.urlActual
		: "/";

	// Condiciones - urlFueraDeUsuarios
	const urlFueraDeUsuarios = !urlAnterior.startsWith("/usuarios/");

	// Condiciones - urlSinParametros y urlSinCaptura
	const urlSinParametros = urlAnterior.split("/?").length == 1 && urlFueraDeUsuarios;
	const urlSinCaptura =
		urlSinParametros || // las rutas sin parámetros
		["/detalle/", "/historial/"].some((n) => urlAnterior.includes(n)); // detalle e historial tienen parámetros pero son sin captura

	// Condiciones - urlSinLogin
	const noAgregar = !urlAnterior.includes("/agregar");
	const noGrafico = !urlAnterior.includes("/graficos/");
	const noContactanos = !urlAnterior.includes("/contactanos");
	const urlSinLogin = urlFueraDeUsuarios && urlSinCaptura && noAgregar && noGrafico && noContactanos;

	// urlsGuardadas
	const urlsGuardadas = {
		// Temas de usuario
		urlFueraDeUsuarios,
		urlSinLogin,
		urlFueraDeContactanos: urlFueraDeUsuarios && noContactanos,

		// Temas de captura
		urlSinParametros,
		urlSinCaptura,
	};

	// Averigua si es una ruta aceptada
	const rutaAceptada = FN_rutaAceptada(urlActual, urlAnterior);

	// Asigna las sessions
	const urlsBasicas = {urlActual, urlAnterior};
	for (let url in urlsBasicas) {
		req.session[url] = rutaAceptada
			? urlsBasicas[url]
			: req.session[url]
			? req.session[url]
			: req.cookies && req.cookies[url]
			? req.cookies[url]
			: "/";
		res.cookie(url, req.session[url], {maxAge: unDia});
	}
	for (let url in urlsGuardadas) {
		req.session[url] =
			rutaAceptada && urlsGuardadas[url]
				? urlAnterior
				: req.session[url]
				? req.session[url]
				: req.cookies && req.cookies[url]
				? req.cookies[url]
				: "/";
		res.cookie(url, req.session[url], {maxAge: unDia});
	}

	// Lleva info a locals
	res.locals.urlActual = req.session.urlActual;

	// Fin
	return next();
};

// Función
const FN_rutaAceptada = (urlActual, urlAnterior) => {
	// Variables
	const rutasIncludes = [
		...["/historial", "/inactivar", "/recuperar", "/eliminado", "/correccion"], // Familia
		...["/agregar", "/detalle/", "/edicion", "/calificar", "/productos-por-registro/r", "/abm-links/p", "/mirar/l"], // Productos, Rclvs y Links
	];

	const rutasStartsWith = [
		...["/usuarios", "/revision", "/consultas", "/graficos", "/institucional"],
		...["/mantenimiento", "/movimientos-del-dia", "/cookies", "/session", "/listados/links"], // Miscelaneas
	];
	const ciertasRutas = ["/usuarios/garantiza-login-y-completo", "/usuarios/logout", "/api/"];

	// Validaciones
	const diferenteRutaAnterior = urlActual != urlAnterior; // Es diferente a la ruta urlAnterior
	const perteneceRutasIN = rutasIncludes.some((n) => urlActual.includes(n)); // Pertenece a las rutas aceptadas
	const perteneceRutasSW = rutasStartsWith.some((n) => urlActual.startsWith(n)) || urlActual == "/"; // Pertenece a las rutas aceptadas
	const noContieneCiertasRutas = !ciertasRutas.some((n) => urlActual.includes(n));

	// Fin
	return diferenteRutaAnterior && (perteneceRutasIN || perteneceRutasSW) && noContieneCiertasRutas;
};
