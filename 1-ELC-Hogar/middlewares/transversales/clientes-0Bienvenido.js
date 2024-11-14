"use strict";

module.exports = async (req, res, next) => {
	// Publica la aplicación desde la que se accede al sitio
	if (entorno != "development") console.log(req.headers["user-agent"]);

	// Verifica y avanza
	if (
		comp.omitirMiddlewsTransv(req) ||
		req.session.cliente || // Si ya hay una visita previa
		(req.cookies && req.cookies.cliente_id) || // Si ya hay una visita previa
		req.session.bienvenido // Si ya se accedió al cartel de 'Bienvenido'
	)
		return next();
	else req.session.bienvenido = true;

	// Prepara los mensajes y el ícono
	const mensajes = [
		"¡Bienvenido/a a nuestro sitio gratuito de <em>Recomendación de Películas</em>!",
		"Queremos ayudarte a resolver el típico problema de:<ul><li><em>No sé qué película ver</em></li><li><em>Quiero ver una película que me deje algo bueno</em></li></ul>",
		"Acá te ayudamos a elegir una película con valores afines a la Fe Católica Apostólica Romana, y te derivamos a dónde verla.",
		"Intentamos tener en catálogo todas las películas que existan con ese perfil. Si nos falta alguna, nos la podés agregar creándote un usuario.",
		"Usamos cookies para que tengas una mejor experiencia de navegación.",
		"Para avanzar, apretá el ícono de <em>entendido</em> que está a continuación.",
	];
	const icono = {...variables.vistaEntendido(req.session.urlActual), autofocus: true};

	// Prepara la información
	const informacion = {mensajes, iconos: [icono], titulo: "Te damos la Bienvenida", check: true};

	// Fin
	return res.render("CMP-0Estructura", {informacion});
};
