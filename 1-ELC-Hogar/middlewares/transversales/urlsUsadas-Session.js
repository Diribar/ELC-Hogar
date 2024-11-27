"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.originalMethod != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Si desconoce el url, muestra el cartel de error
	const distintivo = comp.distintivosDeRutas(req.originalUrl);
	const otrasRutasAceptadas = comp.otrasRutasAceptadas(req.originalUrl);
	if (!distintivo && !otrasRutasAceptadas) {
		console.log("¡Atención! - Ruta sin distintivo:", req.originalUrl);
		const informacion = {
			mensajes: ["No tenemos esa dirección en nuestro sistema"],
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
	const urlSinLogin = urlFueraDeUsuarios && urlSinCaptura && noAgregar && noGrafico;

	// urlsGuardadas
	const urlsGuardadas = {
		// Temas de usuario
		urlFueraDeUsuarios,
		urlSinLogin,
		urlFueraDeContactanos: urlFueraDeUsuarios && !urlAnterior.includes("/contactanos"),

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
	const rutasAceptadas = [
		...["/producto", "/rclv", "/links", "/usuarios"],
		...["/institucional", "/revision", "/mantenimiento", "/consultas", "/graficos", "/correccion"],
		...["/cookies", "/session"],
	];
	const ciertasRutas = ["/usuarios/garantiza-login-y-completo", "/usuarios/logout", "/api/"];

	// Validaciones
	const diferenteRutaAnterior = urlActual != urlAnterior; // Es diferente a la ruta urlAnterior
	const perteneceRutasAceptadas = rutasAceptadas.some((n) => urlActual.startsWith(n)) || urlActual == "/"; // Pertenece a las rutas aceptadas
	const noContieneCiertasRutas = !ciertasRutas.some((n) => urlActual.includes(n));

	// Fin
	return diferenteRutaAnterior && perteneceRutasAceptadas && noContieneCiertasRutas;
};
