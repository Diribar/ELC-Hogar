"use strict";
// Variables
const valida = require("./IN-FN-Validar");

// Controlador
module.exports = {
	institucional: (req, res) => {
		// Variables
		const {codigo} = req.params;
		const vistas = Object.keys(vistasInstitucs);
		const indice = vistas.indexOf(codigo);
		const vistaActual = vistasInstitucs[codigo];

		// Vistas anterior y posterior
		const urlAnt = indice ? vistas[indice - 1] : null;
		const urlPost = indice < vistas.length - 1 ? vistas[indice + 1] : "inicio";

		// Fin
		return res.render("CMP-0Estructura", {
			tema: "institucional",
			...vistaActual,
			...{urlAnt, urlPost, indice, vistas: vistas.length - 1},
		});
	},
	contactanos: {
		form: async (req, res) => {
			// Variables
			const tema = "institucional";
			const codigo = "contactanos";
			const titulo = "Contactanos";
			const urlAnterior = req.session.urlAnterior;

			// Obtiene información para la vista
			const dataEntry = req.session.contactanos || {};

			// Va a la vista
			return res.render("CMP-0Estructura", {tema, codigo, titulo, dataEntry, urlAnterior});
		},
		envioExitoso: (req, res) => {
			// Variables
			const direccion = req.session.urlFueraDeContactanos;
			if (!req.session.contactanos) return res.redirect(direccion);
			const {asunto} = req.session.contactanos;
			const asuntoMail = asuntosContactanos.find((n) => n.codigo == asunto).descripcion;
			delete req.session.contactanos;

			// Información
			const primerMensaje = ["Le hemos enviado tu mensaje a nuestro equipo, con el asunto <em>" + asuntoMail + "</em>."];
			const segundoMensaje = req.session.usuario
				? "Incluimos tu nombre y dirección de mail, para que puedas recibir una respuesta."
				: "Tené en cuenta que como no estabas logueado, no podremos responderte.";

			const informacion = {
				titulo: "Envío exitoso de mail",
				mensajes: [primerMensaje, segundoMensaje],
				iconos: [{...variables.vistaEntendido(direccion), titulo: "Entendido"}],
				check: true,
			};

			// Vista
			return res.render("CMP-0Estructura", {informacion});
		},
		envioFallido: (req, res) => {
			// Variables
			const informacion = {
				mensajes: [
					"No pudimos enviar el mail.",
					"Revisá tu conexión a internet y volvé a intentarlo.",
					"Con el ícono de abajo regresás a la vista anterior.",
				],
				iconos: [{...variables.vistaEntendido("/institucional/contactanos"), titulo: "Entendido"}],
				titulo: "Envío fallido de mail",
			};

			// Vista
			return res.render("CMP-0Estructura", {informacion});
		},
	},
};
