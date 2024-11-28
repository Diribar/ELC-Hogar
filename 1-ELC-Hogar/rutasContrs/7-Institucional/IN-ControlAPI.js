"use strict";
// Variables
const valida = require("./IN-FN-Validar");

// *********** Controlador ***********
module.exports = {
	contactanos: {
		valida: async (req, res) => {
			// Averigua los errores solamente para esos campos
			const errores = await valida.contactanos(req.query);

			// Devuelve el resultado
			return res.json(errores);
		},
		enviaMail: async (req, res) => {
			// Revisa errores
			const errores = await valida.contactanos(req.body);
			req.session.contactanos = req.body; // actualiza el contenido del formulario en 'session'

			// Si hay errores, redirige a la vista de errores
			if (errores.hay) {
				const informacion = {
					mensajes: [Object.values(errores)[0]],
					iconos: [variables.vistaEntendido("/institucional/contactanos")],
				};
				return res.render("CMP-0Estructura", {informacion});
			}

			// Variables
			const {asunto, comentario} = req.body;
			const usuario = req.session.usuario;
			const emailELC = "sp2015w@gmail.com";
			const asuntoMail = asuntosContactanos.find((n) => n.codigo == asunto).descripcion;
			const comentAdic =
				"<br><br><br>" +
				(usuario ? usuario.nombre + " " + usuario.apellido + "<br>" + usuario.email : "La persona no estaba logueada");
			let mailEnviado, datos;

			// Envía el mail a ELC
			datos = {
				email: emailELC,
				asunto: asuntoMail,
				comentario: comentario + comentAdic,
			};
			mailEnviado = await comp.enviaMail(datos);

			// Si el envío fue exitoso y la persona está logueada, le envía un email de confirmación
			if (mailEnviado && usuario) {
				datos = {
					email: usuario.email,
					asunto: "Mail enviado a ELC",
					comentario:
						'Hemos enviado tu e-mail al equipo de ELC, con el asunto "' +
						asuntoMail +
						'", y el siguiente comentario:<br><em>' +
						comentario +
						"</em>",
				};
				comp.enviaMail(datos);
			}

			// Fin
			const destino = mailEnviado ? "envio-exitoso" : "envio-fallido";
			return res.redirect("/institucional/contactanos/" + destino);
		},
	},
};
