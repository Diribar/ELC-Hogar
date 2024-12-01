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
			// Variables
			const datosForm = req.query;

			// Si hubo errores, interrumpe la función
			const errores = await valida.contactanos(datosForm);
			req.session.contactanos = datosForm; // actualiza el contenido del formulario en 'session'
			if (errores.hay) return res.json(false);

			// Variables
			const {asunto, comentario} = datosForm;
			const usuario = req.session.usuario;
			const emailELC = "sp2015w@gmail.com";
			const asuntoMail = asuntosContactanos.find((n) => n.codigo == asunto).descripcion;
			const datosUsuario = usuario ? usuario.nombre + " " + usuario.apellido + "<br>" + usuario.email : null;
			const datosCliente = "La persona no estaba logueada, cliente_id " + req.session.cliente.cliente_id;
			const comentAdic = "<br><br><br>" + (datosUsuario || datosCliente);

			// Envía el mail a ELC
			const datosMail = {
				email: emailELC,
				asunto: asuntoMail,
				comentario: comentario + comentAdic,
			};
			const mailEnviado = await comp.enviaMail(datosMail);

			// Si el envío fue exitoso y la persona está logueada, le envía un email de confirmación
			if (mailEnviado && usuario) {
				const datosMail = {
					email: usuario.email,
					asunto: "Mail enviado a ELC",
					comentario:
						'Hemos enviado tu e-mail al equipo de ELC, con el asunto "' +
						asuntoMail +
						'", y el siguiente comentario:<br><em>' +
						comentario +
						"</em>",
				};
				comp.enviaMail(datosMail);
			}

			// Devuelve la info
			return res.json(mailEnviado);
		},
	},
};
