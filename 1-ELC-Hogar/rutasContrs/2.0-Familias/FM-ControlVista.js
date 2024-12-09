"use strict";
// Variables
const procesos = require("./FM-FN-Procesos");

module.exports = {
	form: {
		motivos: async (req, res) => {
			// Variables
			const datos = await procesos.obtieneDatos(req);

			// Obtiene datos para la vista
			const ayudasTitulo = "Por favor decinos por qué sugerís " + datos.codigo + " este registro.";
			const motivos = statusMotivos.filter((n) => n[datos.petitFamilias]);
			const entidades = variables.entidades[datos.petitFamilias];

			// Render del formulario
			return res.render("CMP-0Estructura", {...datos, ayudasTitulo, motivos, entidades});
		},
		historial: async (req, res) => {
			// Variables
			const {statusAlineado, prodRclv} = req.body;
			const datos = await procesos.obtieneDatos(req);

			// Obtiene el ayuda para el título
			const ayudasTitulo =
				datos.codigo == "historial"
					? false
					: datos.tema == "revisionEnts"
					? ["Para tomar una decisión contraria a la del usuario, necesitamos tu comentario para darle feedback."]
					: ["inactivar", "recuperar"].includes(datos.codigo)
					? ["Por favor decinos por qué sugerís " + datos.codigo + " este registro."]
					: datos.codigo == "eliminar"
					? ["Este registro se eliminará en forma definitiva"]
					: null;

			// Obtiene datos para la vista
			const historialStatus = await procesos.historialDeStatus.obtiene({entidad: datos.entidad, ...datos.registro});
			const {usuario} = req.session;
			const revisorPERL = usuario && usuario.rolUsuario.revisorPERL;
			const anchorEncab = datos.tema == "fmCrud";

			// Render del formulario
			return res.render("CMP-0Estructura", {
				...{...datos, ayudasTitulo, revisorPERL},
				...{historialStatus, statusAlineado, prodRclv, anchorEncab},
			});
		},
		elimina: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id} = req.query;
			const include = entidad == "colecciones" ? "capitulos" : "";
			const original = await baseDeDatos.obtienePorId(entidad, id, include);

			// Elimina sus registros dependientes
			await procesos.elimina.dependientes(entidad, id);

			// Elimina el registro
			await baseDeDatos.eliminaPorId(entidad, id);

			// Elimina registros vinculados (no dependientes)
			for (let tabla of eliminarCuandoSinEntidadId) baseDeDatos.eliminaPorCondicion(tabla, {entidad, entidad_id: id});

			// Actualiza solapamiento y la variable 'fechasDelAno'
			if (entidad == "epocasDelAno") comp.actualizaSolapam();

			// Variables para la vista
			const nombre = comp.nombresPosibles(original);
			const articFinal = comp.obtieneDesdeEntidad.oa(entidad);
			const articInicial = articFinal == "a" ? "La " : "El ";
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad).toLowerCase();
			const capitulos = entidad == "colecciones" ? "y sus capítulos, " : "";
			const plural1 = entidad == "colecciones" ? "ron" : "";
			const plural2 = entidad == "colecciones" ? "s" : "";
			const titulo = comp.letras.inicialMayus(entidadNombre) + " eliminad" + articFinal + plural2;
			const vistaEntendido = variables.vistaEntendido(req.session.urlSinParametros);

			// Cartel de registro eliminado
			let mensaje = articInicial + entidadNombre + " <em>" + nombre + "</em> " + capitulos;
			mensaje += "fue" + plural1 + " eliminad" + articFinal + plural2 + " de nuestra base de datos";
			const informacion = {mensajes: [mensaje], iconos: [vistaEntendido]};

			// Fin
			return res.render("CMP-0Estructura", {informacion, titulo});
		},
	},
	inacRecupGuardar: async (req, res) => {
		//  Variables
		let datos = await procesos.obtieneDatosGuardar(req);
		const {familia, siglaFam, entidad, id} = datos;
		const {motivo_id, codigo, usuario_id, ahora, campo_id, original, statusFinal_id, comentario} = datos;

		// CONSECUENCIAS - Actualiza el status en el registro original
		datos = {
			statusSugeridoPor_id: usuario_id,
			statusSugeridoEn: ahora,
			statusRegistro_id: statusFinal_id,
		};
		await baseDeDatos.actualizaPorId(entidad, id, datos);

		// CONSECUENCIAS - Agrega un registro en el statusHistorial
		let datosHist = {
			...{entidad, entidad_id: id}, // entidad
			...{statusOriginalPor_id: original.statusSugeridoPor_id, statusFinalPor_id: usuario_id}, // personas
			...{statusOriginal_id: original.statusRegistro_id, statusFinal_id}, // status
			...{statusOriginalEn: original.statusSugeridoEn}, // fecha
			comentario,
		};
		if (codigo == "inactivar") datosHist.motivo_id = motivo_id;
		else if (codigo == "recuperar") {
			const ultHist = await procesos.historialDeStatus.ultimoRegistro(entidad, id);
			if (ultHist) datosHist.motivo_id = ultHist.motivo_id;
		}
		await baseDeDatos.agregaRegistro("statusHistorial", datosHist); // es crítico el uso del await, para actualizar la variable 'statusErrores'

		// CONSECUENCIAS - Actualiza la variable 'statusErrores'
		await comp.actualizaStatusErrores.consolidado();

		// CONSECUENCIAS - Acciones si es un producto
		if (familia == "producto") {
			// 1. Actualiza en los links el campo 'prodAprob'
			const asoc = comp.obtieneDesdeEntidad.asociacion(entidad);
			const links = await baseDeDatos.obtieneTodosPorCondicion("links", {[campo_id]: id}, asoc);
			comp.actualizaProdAprobEnLink(links);

			// 2. Acciones si es una colección
			if (entidad == "colecciones") {
				// 2.1. Actualiza sus capítulos con el mismo status
				await baseDeDatos.actualizaPorCondicion(
					"capitulos",
					{coleccion_id: id},
					{...datos, statusColeccion_id: statusFinal_id, statusSugeridoPor_id: usAutom_id}
				);

				// 2.2. Actualiza en los links de sus capítulos el campo 'prodAprob'
				baseDeDatos
					.obtieneTodosPorCondicion("capitulos", {coleccion_id: id})
					.then((n) => n.map((m) => m.id))
					.then((ids) =>
						baseDeDatos
							.obtieneTodosPorCondicion("links", {capitulo_id: ids}, "capitulo")
							.then((links) => comp.actualizaProdAprobEnLink(links))
					);
			}

			// 3. Si es un capítulo, actualiza el status de link de su colección
			if (entidad == "capitulos") comp.actualizaCalidadesDeLinkEnCole(original.coleccion_id);

			// 4. Actualiza los RCLV, en el campo 'prodsAprob'
			procesos.accsEnDepsPorCambioDeStatus(entidad, original);
		}

		// Fin
		const destino = "/" + entidad + "/detalle/" + siglaFam + "/?id=" + id;
		return res.redirect(destino);
	},
	correcs: {
		motivoForm: async (req, res) => {
			// Variables
			const tema = "fmCrud";
			const codigo = "cambiarMotivo";
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, origen, prodRclv, ultHist} = {...req.query, ...req.body};
			const petitFamilias = comp.obtieneDesdeEntidad.petitFamilias(entidad);
			const titulo = "Cambiar el Motivo";

			// Datos para la vista
			const motivo = ultHist.motivo_id ? statusMotivos.find((n) => n.id == ultHist.motivo_id) : null;
			const motivos = statusMotivos.filter((n) => n[petitFamilias]);
			const entidades = variables.entidades[petitFamilias];
			const entsNombre = variables.entidades[petitFamilias + "Nombre"];
			const imgDerPers = procesos.obtieneAvatar(prodRclv).orig;
			const familia = comp.obtieneDesdeEntidad.familia(entidad);

			// Envía la info a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, origen},
				...{familia, entidad, id, registro: prodRclv, motivo, ultHist, imgDerPers},
				...{entidades, entsNombre, motivos},
				cartelGenerico: true,
			});
		},
		motivoGuardar: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, motivo_id, entDupl, idDupl, ultHist, origen} = {...req.query, ...req.body};
			const {statusFinal_id} = ultHist;

			// Genera el comentario
			let {comentario} = req.body;
			comentario = await procesos.comentario({entidad, id, motivo_id, comentario, entDupl, idDupl, statusFinal_id});

			// Actualiza el motivo en el último registro del historial
			await baseDeDatos.actualizaPorId("statusHistorial", ultHist.id, {motivo_id, comentario});

			// Genera la 'cola'
			let cola = "/?id=" + id;
			if (origen) cola += "&origen=" + origen;

			// Fin
			return res.redirect("/" + entidad + "/historial" + cola);
		},
		statusForm: async (req, res) => {
			// Variables
			const tema = "fmCrud";
			const codigo = "corregirStatus";
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const esLink = entidad == "links";
			const titulo = "Corregir el Status";
			const {id, origen} = req.query;
			let {prodRclv: registro} = req.body;

			// Obtiene el historial
			const historialStatus = await procesos.historialDeStatus.obtiene({entidad, ...registro});

			// Datos para la vista
			const imgDerPers = esLink ? "/publico/imagenes/Varios/Link.jpg" : procesos.obtieneAvatar(registro).orig;
			const familia = comp.obtieneDesdeEntidad.familia(entidad);

			// Producto o Rclv
			if (esLink) {
				const prodEntidad = comp.obtieneDesdeCampo_id.entidadProd(registro);
				const campo_idProd = comp.obtieneDesdeCampo_id.campo_idProd(registro);
				const prodId = registro[campo_idProd];
				const producto = await baseDeDatos.obtienePorId(prodEntidad, prodId);
				registro.nombreCastellano = "Link - " + producto.nombreCastellano;
			}

			// Fin
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, origen},
				...{entidad, id, registro, imgDerPers},
				...{historialStatus, familia},
				cartelGenerico: true,
			});
		},
		statusGuardar: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, opcion, prodRclv: prodRclvLink, ultHist} = {...req.query, ...req.body};
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			let destino;

			// Acciones si se aprueba el status del prodRclvLink
			if (opcion == "prodRclvLink") await baseDeDatos.eliminaPorCondicion("statusHistorial", {entidad, entidad_id: id}); // elimina el historial de ese 'prodRclvLink'

			// Acciones si se aprueba el status del historial
			if (opcion == "historial") {
				const datos = {statusRegistro_id: ultHist.statusFinal_id, statusSugeridoEn: ultHist.statusFinalEn};
				await baseDeDatos.actualizaPorId(entidad, id, datos); // actualiza el status del prodRclvLink
			}

			// Obtiene el destino
			if (entidad == "links") {
				const prodEntidad = comp.obtieneDesdeCampo_id.entidadProd(prodRclvLink);
				const campo_idProd = comp.obtieneDesdeCampo_id.campo_idProd(prodRclvLink);
				const prodId = prodRclvLink[campo_idProd];
				destino = "/" + prodEntidad + "/abm-links/p/?id=" + prodId; // establece que se redireccione a 'abm-links'
			} else destino = "/" + familia + "/detalle/?id=" + id; // establece que se redireccione a 'detalle'

			// Actualiza la variable 'statusErrores'
			await comp.actualizaStatusErrores.consolidado();

			// Fin
			return res.redirect(destino);
		},
	},
};
