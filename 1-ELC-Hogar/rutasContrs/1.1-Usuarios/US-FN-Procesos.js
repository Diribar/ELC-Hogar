"use strict";
// Definir variables
const bcryptjs = require("bcryptjs");

module.exports = {
	// Middleware
	infoNoPerenne: (req) => {
		// Variables
		const entidad = comp.obtieneEntidadDesdeUrl(req);
		const {id, origen} = req.query;
		const linkVolver =
			entidad && id
				? "/" + entidad + "/inactivar-captura/?id=" + id + "&origen=" + (origen || "DT")
				: req.session.urlSinCaptura;

		// Fin
		return {
			mensajes: [
				"Nos agrada que nuestros usuarios nos aporten información.",
				"Esa posibilidad requiere responsabilidad.",
				"Necesitamos algunos datos tuyos, para validar tu identidad en el futuro.",
				"Para avanzar, elegí el ícono de la flecha hacia la derecha.",
			],
			iconos: [
				variables.vistaAnterior(linkVolver),
				{
					clase: iconos.derecha,
					link: "/usuarios/perennes",
					titulo: "Obtener el rol 'Apto Input'",
					autofocus: true,
				},
			],
			titulo: "Rol 'Apto Input'",
			trabajando: true,
		};
	},

	// ControlVista: loginGuardar, altaPerennesGuardar, altaEditablesGuardar
	actualizaElStatusDelUsuario: async (usuario, status, novedades) => {
		// Obtiene el nuevo status
		let statusNuevo = statusRegistrosUs.find((n) => n.codigo == status);

		// Genera la info a actualizar
		novedades = {...novedades, statusRegistro_id: statusNuevo.id};

		// Actualiza la info
		await baseDeDatos.actualizaPorId("usuarios", usuario.id, novedades);

		// Fin
		return;
	},
	eliminaDuplicados: async (usuario_id) => {
		// Obtiene los registros
		const registros = await baseDeDatos.obtieneTodosPorCondicion("persWebDia", {usuario_id});

		// Elimina los duplicados
		for (let i = registros.length - 1; i > 0; i--)
			if (registros[i].fecha == registros[i - 1].fecha) baseDeDatos.eliminaPorId("persWebDia", registros[i].id);

		// Fin
		return;
	},
	logout: (req, res) => {
		// Borra los datos de session y cookie
		for (let prop in req.session) if (prop != "cookie") delete req.session[prop];
		res.clearCookie("email");

		// Fin
		return;
	},

	// ControlAPI
	envioDeMailConContrasena: async ({email, altaMail}) => {
		// Variables
		const asunto = "Contraseña para ELC";

		// Contraseña
		let contrasena = Math.round(Math.random() * Math.pow(10, 6))
			.toString()
			.padStart(6, "0"); // más adelante cambia por la codificada

		// Comentario
		let comentario = "";
		comentario += "¡Hola!";
		if (altaMail) {
			comentario += "<br>" + "Ya tenés tu usuario para usar en nuestro sitio.";
			comentario += "<br>" + "Necesitamos que completes el alta antes de que transcurran 24hs.";
			comentario += "<br>" + "Si no se completa en ese plazo, se dará de baja.";
		}
		comentario += "<br>" + "La contraseña de tu usuario es: <bold><u>" + contrasena + "</u></bold>";

		// Envía el mail al usuario y actualiza la contraseña
		const mailEnviado = await comp.enviaMail({email, asunto, comentario});

		// Fin
		console.log("Contraseña: " + contrasena);
		contrasena = bcryptjs.hashSync(contrasena, 10);
		return {contrasena, mailEnviado};
	},
	creaElUsuario: async () => {
		const usuario = await baseDeDatos.agregaRegistroIdCorrel("usuarios", {
			...{email, contrasena},
			...{diasNaveg, visitaCreadaEn},
			statusRegistro_id: mailPendValidar_id,
			versionElc,
		});

		// Actualiza 'cliente_id' en la BD 'usuarios' y en la cookie 'cliente_id'
		const cliente_id = "U" + String(usuario.id).padStart(10, "0");
		await baseDeDatos.actualizaPorId("usuarios", usuario.id, {cliente_id}); // es necesario el 'await' para session
	},

	// Ambos
	comentarios: {
		credsInvalidas: {
			altaMail: "Esa dirección de email ya existe en nuestra base de datos.",
			login: "Credenciales inválidas.",
			olvidoContr: "Algún dato no coincide con el de nuestra base de datos.",
			datosPer: "Ya existe un usuario con esas credenciales. De ser necesario, comunicate con nosotros.",
		},
		accesoSuspendido: (tema) =>
			"Por motivos de seguridad debido a los intentos fallidos " +
			tema +
			", te pedimos que esperes para volver a intentarlo.",
	},
};
