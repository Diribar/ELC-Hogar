"use strict";
const validacs = require("./FM-FN-Validar");

module.exports = {
	// Header
	quickSearch: {
		condicion: ({palabras, campos, usuario_id, original, omitirUserId}) => {
			// Variables
			let todasLasPalabrasEnAlgunCampo = [];
			let condicStatusEdicion;

			// Convierte las palabras en un array
			palabras = palabras.split(" ");

			// Rutina para cada campo
			for (let campo of campos) {
				// Variables
				let palabrasEnElCampo = [];

				// Dónde debe buscar cada palabra dentro del campo
				for (let palabra of palabras) {
					const palabraEnElCampo = {
						[Op.or]: [
							{[campo]: {[Op.like]: palabra + "%"}}, // En el comienzo del texto
							{[campo]: {[Op.like]: "% " + palabra + "%"}}, // En el comienzo de una palabra
						],
					};
					palabrasEnElCampo.push(palabraEnElCampo);
				}

				// Exige que cada palabra del conjunto esté presente
				const todasLasPalabrasEnElCampo = {[Op.and]: palabrasEnElCampo};

				// Consolida el resultado
				todasLasPalabrasEnAlgunCampo.push(todasLasPalabrasEnElCampo);
			}

			// Se fija que 'la condición de palabras' se cumpla en alguno de los campos
			const condicPalabras = {[Op.or]: todasLasPalabrasEnAlgunCampo};

			// Se fija que el registro esté en statusAprobado, o status 'creados_ids' y por el usuario
			if (original)
				condicStatusEdicion = omitirUserId
					? {statusRegistro_id: activos_ids}
					: {
							[Op.or]: [
								{statusRegistro_id: aprobados_ids},
								{[Op.and]: [{statusRegistro_id: creado_id}, {creadoPor_id: usuario_id}]},
							],
					  };
			// Se fija que una edición sea del usuario
			else if (!omitirUserId) condicStatusEdicion = {editadoPor_id: usuario_id};

			// Consolida las condiciones
			const condicConsolidada = condicStatusEdicion
				? {[Op.and]: [condicPalabras, condicStatusEdicion]} // si existen las dos
				: condicPalabras;

			// Fin
			return condicConsolidada;
		},
		registros: async (condicion, dato) => {
			// Obtiene los registros
			const registros = await baseDeDatos.obtieneTodosPorCondicionConLimite(dato.entidad, condicion, 10).then((n) =>
				n.map((m) => {
					let respuesta = {
						id: m.id,
						nombre: m[dato.campos[0]],
						entidad: dato.entidad,
						familia: dato.familia,
						avatar: m.avatar, // específicos para PA-Desambiguar
					};
					if (m.anoEstreno) respuesta.anoEstreno = m.anoEstreno;
					if (m.nombreOriginal) respuesta.nombreOriginal = m.nombreOriginal; // específicos para PA-Desambiguar

					return respuesta;
				})
			);

			// Fin
			return registros;
		},
		ediciones: async (condicion, dato) => {
			// Obtiene los registros
			const registros = await baseDeDatos
				.obtieneTodosPorCondicionConLimite(dato.entidad, condicion, 10, dato.include)
				.then((n) =>
					n.map((m) => {
						const entidad = comp.obtieneDesdeCampo_id.entidad(m, dato.entidad);
						const asoc = comp.obtieneDesdeEntidad.asociacion(entidad);
						return {
							entidad,
							id: m[comp.obtieneDesdeEntidad.campo_id(entidad)],
							anoEstreno: m.anoEstreno ? m.anoEstreno : m[asoc].anoEstreno,
							nombre: m[dato.campos[0]] ? m[dato.campos[0]] : m[dato.campos[1]],
							familia: dato.familia,
						};
					})
				);

			// Fin
			return registros;
		},
	},

	// CRUD
	obtieneDatos: async function (req) {
		// Variables
		const {baseUrl, tarea, siglaFam, entidad} = comp.partesDelUrl(req);
		const {originalUrl} = req;
		const tema = baseUrl == "/revision" ? "revisionEnts" : "fmCrud";
		const codigo = tarea.slice(1);
		const {id} = req.query;
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		const petitFamilias = comp.obtieneDesdeEntidad.petitFamilias(entidad);
		const origen = req.query.origen;
		const usuario_id = req.session && req.session.usuario ? req.session.usuario.id : null;
		let comentario;

		// Obtiene el registro
		let include = [...comp.obtieneTodosLosCamposInclude(entidad)];
		include.push("statusRegistro", "creadoPor", "statusSugeridoPor", "altaRevisadaPor");
		if (entidad == "capitulos") include.push("coleccion");
		if (entidad == "colecciones") include.push("capitulos");
		if (familia == "rclv") include.push(...variables.entidades.prods);
		let original = await baseDeDatos.obtienePorId(entidad, id, include);
		if (entidad == "capitulos") original.capitulos = await this.obtieneCapitulos(original.coleccion_id, original.temporada);

		// Cantidad de productos asociados al rclv
		let canonNombre, rclvNombre;
		if (familia == "rclv") {
			canonNombre = comp.canonNombre(original);
			rclvNombre = original.nombre;
		}

		// Más variables
		const status_id = original.statusRegistro_id;
		const urlActual = req.originalUrl;
		const entsNombre = variables.entidades[petitFamilias + "Nombre"];
		const {titulo, entidadNombre} = this.titulo({entidad, originalUrl});
		const bloqueDer = await this.bloques.consolidado({tema, familia, entidad, original});
		const imgDerPers = this.obtieneAvatar(original).orig;
		const cartelGenerico = codigo != "historial";

		// Fin
		return {
			...{tema, codigo, titulo, origen},
			...{siglaFam, entidad, entidadNombre, familia, petitFamilias, id, registro: original, comentario},
			...{canonNombre, rclvNombre, imgDerPers, bloqueDer, status_id},
			...{entsNombre, urlActual, cartelGenerico},
		};
	},
	titulo: ({entidad, originalUrl}) => {
		// Variables
		const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
		const titulos = [
			// Revisión
			{url: "revision/edicion", titulo: "Revisión de Edicion de"},
			{url: "revision/rechazar", titulo: "Rechazar"},
			{url: "revision/inactivar", titulo: "Revisión de Inactivar"},
			{url: "revision/recuperar", titulo: "Revisión de Recuperar"},

			// Crud
			{url: "historial", titulo: "Historial de"},
			{url: "inactivar", titulo: "Inactivar"},
			{url: "recuperar", titulo: "Recuperar"},
		];

		// Título
		let titulo = titulos.find((n) => originalUrl.includes("/" + n.url + "/")).titulo + " ";
		titulo += comp.obtieneDesdeEntidad.unaUn(entidad) + " ";
		titulo += entidadNombre;

		// Fin
		return {titulo, entidadNombre};
	},
	obtieneDatosGuardar: async function (req) {
		// Variables
		const {entidad, tarea} = comp.partesDelUrl(req);
		const codigo = tarea.slice(1);
		const {id} = req.query;
		const {motivo_id, entDupl, idDupl} = req.body;

		// Más variables
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		const siglaFam = familia[0];
		const usuario_id = req.session.usuario.id;
		const ahora = comp.fechaHora.ahora();
		const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
		const include = comp.obtieneTodosLosCamposInclude(entidad);
		const original = await baseDeDatos.obtienePorId(entidad, id, include);
		const statusFinal_id = codigo == "inactivar" ? inactivar_id : recuperar_id;

		// Comentario
		let {comentario} = req.body;
		comentario = await this.comentario({entidad, id, codigo, motivo_id, entDupl, idDupl, comentario, statusFinal_id});

		// Fin
		return {
			...{familia, siglaFam, entidad, id},
			...{motivo_id, codigo, usuario_id, ahora, campo_id, original, statusFinal_id, comentario},
		};
	},
	comentario: async function (datos) {
		// Stoppers
		if (datos.codigo == "recuperar") return datos.comentario;
		if (!datos.motivo_id) return null;

		// Variables
		let comentario = datos.comentario;

		// Si el motivo es 'duplicado', genera el comentario
		if (
			datos.motivo_id == motivoDupl_id &&
			((datos.tema != "revision" && datos.codigo == "inactivar") || datos.codigo == "rechazar") // crud de inactivar, o rechazar
		) {
			const {entDupl, idDupl} = datos;
			const elLa = comp.obtieneDesdeEntidad.elLa(entDupl);
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entDupl).toLowerCase();
			comentario = "con" + elLa + entidadNombre + " id " + idDupl;
		}

		// Si corresponde, lo obtiene del movimiento anterior
		if (!comentario && datos.tema == "revision" && [inactivar_id, recuperar_id].includes(datos.statusOriginal_id)) {
			const ultHist = await this.historialDeStatus.ultimoRegistro(datos.entidad, datos.id);
			if (ultHist && ultHist.comentario) comentario = ultHist.comentario;
		}

		// Quita el punto final
		if (comentario && comentario.endsWith(".")) comentario = comentario.slice(0, -1);

		// Fin
		return comentario;
	},
	obtieneOriginalEdicion: async ({entidad, entId, usuario_id, excluirInclude, omitirPulirEdic}) => {
		// Variables
		const entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
		const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
		const condEdic = {[campo_id]: entId, editadoPor_id: usuario_id};
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		const includesEdic = !excluirInclude ? comp.obtieneTodosLosCamposInclude(entidad) : null;

		// Obtiene los campos include
		let includesOrig;
		if (!excluirInclude) {
			includesOrig = [...includesEdic, "creadoPor", "altaRevisadaPor", "statusSugeridoPor", "statusRegistro"];
			if (entidad == "capitulos") includesOrig.push("coleccion");
			if (entidad == "colecciones") includesOrig.push("capitulos");
			if (familia == "rclv") includesOrig.push("prodsEdiciones", ...variables.entidades.prods);
		}

		// Obtiene el registro original con sus includes
		let original = baseDeDatos.obtienePorId(entidad, entId, includesOrig);
		let edicion = usuario_id ? baseDeDatos.obtienePorCondicion(entEdic, condEdic, includesEdic) : null;
		[original, edicion] = await Promise.all([original, edicion]);

		// Le quita al original los campos sin contenido
		for (let prop in original) if (original[prop] === null) delete original[prop];

		// Pule la edición
		edicion = edicion
			? omitirPulirEdic
				? edicion
				: await comp.puleEdicion(entidad, original, edicion) // El output puede ser 'null'
			: {}; // Debe ser un objeto, porque más adelante se lo trata como tal

		// Si es una colección, pule la cantidad de capítulos
		if (entidad == "colecciones" && original.capitulos)
			original.capitulos = original.capitulos.filter((n) => activos_ids.includes(n.statusRegistro_id));

		// Acciones si es un capítulo
		if (entidad == "capitulos" && usuario_id) {
			// Variables
			const condColec = {coleccion_id: original.coleccion_id, editadoPor_id: usuario_id};
			const edicColec = await baseDeDatos.obtienePorCondicion("prodsEdicion", condColec, includesEdic);
			if (!edicColec) return [original, edicion];

			// Si el 'nombreCastellano' de la colección está editado, lo actualiza en la variable 'original'
			if (original.coleccion && edicColec.nombreCastellano)
				original.coleccion.nombreCastellano = edicColec.nombreCastellano;
		}

		// Fin
		return [original, edicion];
	},
	guardaActEdic: async ({entidad, original, edicion, usuario_id}) => {
		// Variables
		let entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);

		// Quita la info que no agrega valor
		edicion = await comp.puleEdicion(entidad, original, edicion);

		// Acciones si quedaron datos para actualizar
		if (edicion) {
			// Si existe el registro, lo actualiza
			if (edicion.id) await baseDeDatos.actualizaPorId(entEdic, edicion.id, edicion);
			// Si no existe el registro, lo agrega
			else {
				// campo_id, editadoPor_id
				const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
				edicion[campo_id] = original.id;
				edicion.editadoPor_id = usuario_id;

				// producto_id
				if (entidad == "links") {
					const prod_id = comp.obtieneDesdeCampo_id.campo_idProd(original);
					edicion[producto_id] = original[producto_id];
					if (prod_id != "pelicula_id") edicion.grupoCol_id = original.grupoCol_id; // para ediciones de links
				}

				// grupoCol_id
				if (entidad == "colecciones") edicion.grupoCol_id = original.id; // para ediciones de colección
				if (entidad == "capitulos") edicion.grupoCol_id = original.coleccion_id; // para ediciones de capítulos
				if (entidad == "links") edicion.grupoCol_id = original.grupoCol_id; // para ediciones de links

				// Se agrega el registro
				await baseDeDatos.agregaRegistro(entEdic, edicion);
			}
		}

		// Fin
		return edicion;
	},
	historialDeStatus: {
		obtiene: async function (prodRclv) {
			// Variables
			const {entidad, id: entidad_id, creadoPor_id, creadoEn} = prodRclv;
			const condics = {entidad, entidad_id};
			const include = ["statusOriginal", "statusFinal", "motivo"];

			// Obtiene el historial de status
			let historialStatus = await baseDeDatos
				.obtieneTodosPorCondicion("statusHistorial", condics, include)
				.then((n) => n.sort((a, b) => a.statusFinalEn - b.statusFinalEn));

			// Agrega los registros anteriores al historial
			historialStatus = this.movimsAntsAlHist({prodRclv, historialStatus});

			// Completa el historial
			historialStatus = this.revisaElHist(historialStatus);

			// Procesa los comentarios
			historialStatus = historialStatus.map((n) => {
				const llevaComentario = [inactivar_id, inactivo_id].includes(n.statusFinal_id); // sólo esos status llevan ña descripción del motivo
				const motivo = llevaComentario && n.motivo && !n.motivo.general ? n.motivo.descripcion : "";
				const comentario = motivo + (n.comentario ? (motivo ? ": " : "") + n.comentario : "");
				return {...n, comentario};
			});

			// Fin
			return this.formato(historialStatus);
		},
		movimsAntsAlHist: ({prodRclv, historialStatus}) => {
			// Variables
			const {
				entidad,
				id: entidad_id,
				creadoPor_id,
				creadoEn,
				altaRevisadaEn,
				altaTermEn,
				statusSugeridoEn,
				statusRegistro_id,
			} = prodRclv;
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			let statusOriginal_id, regHistorial;

			// Agrega el primer registro con status 'creado_id'
			let statusFinal_id = creado_id;
			let statusFinal = {nombre: "Creado", codigo: "creado"};
			let statusFinalPor_id = creadoPor_id;
			let statusFinalEn = creadoEn;
			historialStatus.unshift({statusFinal_id, statusFinal, statusFinalPor_id, statusFinalEn});

			// Acciones para el status posterior a 'creado_id'
			if (
				statusRegistro_id > creado_id &&
				(historialStatus.length == 1 || // no hay registro siguiente (ej: porque se eliminó c/feedback a usuarios)
					historialStatus[1].statusOriginal_id != creado_id) // existe registro siguiente y comienza con un status distinto a como termina el anterior
			) {
				statusOriginal_id = creado_id;
				statusFinal_id =
					historialStatus.length > 1
						? historialStatus[1].statusOriginal_id != creado_id || // hubo un movimiento intermedio
						  historialStatus[1].statusFinal_id != inactivo_id // no se rechazó de entrada
							? familia == "producto" // no se rechazó de entrada
								? creadoAprob_id
								: aprobado_id
							: null // se rechazó de entrada
						: statusRegistro_id <= aprobado_id // cuando no hay historial
						? familia == "producto"
							? creadoAprob_id
							: aprobado_id
						: null; // de lo contrario, el status del producto

				// Si el movimiento ya corresponde al historial, interrumpe la función
				if (!statusFinal_id) return historialStatus;
				// Si el siguiente registro en el historial no continúa del anterior, agrega el movimiento
				else {
					statusFinalEn = altaRevisadaEn;
					statusFinal = FN.statusFinal(statusFinal_id);
					regHistorial = {entidad, entidad_id, statusOriginal_id, statusFinal_id, statusFinalEn, statusFinal};
					historialStatus.splice(1, 0, regHistorial);
				}
			}

			// Acciones para el status posterior a 'creadoAprob_id'
			if (
				statusRegistro_id > creadoAprob_id &&
				historialStatus[1].statusFinal_id == creadoAprob_id // el registro anterior terminó en 'creadoAprob_id'
			) {
				// Si no se completó el alta, interrumpe la función
				if (!altaTermEn) return historialStatus;

				// Averigua el 'statusFinalEn'
				statusFinalEn = altaTermEn
					? altaTermEn // si se completó el alta, esa fecha
					: historialStatus.length > 2
					? historialStatus[2].statusOriginalEn // si el historial tiene un registro siguiente, ese registro
					: statusSugeridoEn; // de lo contrario, el status del producto

				// Agrega el registro al historial
				statusOriginal_id = creadoAprob_id;
				statusFinal_id = aprobado_id;
				statusFinal = FN.statusFinal(statusFinal_id);
				regHistorial = {entidad, entidad_id, statusOriginal_id, statusFinal_id, statusFinalEn, statusFinal};
				historialStatus.splice(2, 0, regHistorial);
			}

			// Fin
			return historialStatus;
		},
		revisaElHist: (historialStatus) => {
			// Variables

			// Revisa de a uno el historial, asumiendo que no hay errores
			let contador = 1;
			while (contador <= historialStatus.length - 1) {
				// Variables
				const anterior = historialStatus[contador - 1];
				const siguiente = historialStatus[contador];

				// Si en el historial se omite un movimiento, lo agrega
				if (anterior.statusFinal_id != siguiente.statusOriginal_id) {
					const regAgregar = {
						statusOriginal_id: anterior.statusFinal_id,
						statusFinal_id: siguiente.statusOriginal_id,
						statusFinalEn: siguiente.statusOriginalEn,
						statusFinal: FN.statusFinal(siguiente.statusOriginal_id),
					};
					historialStatus.splice(contador, 0, regAgregar);
				}

				// Fin de la rutina
				contador++;
				if (contador == 10) break; // en caso que el historial sea demasiado extenso
			}

			// Fin
			return historialStatus;
		},
		formato: (historialStatus) => {
			historialStatus.forEach((reg, i) => {
				// Variables
				const {statusFinalEn} = reg;
				let fecha;
				if (statusFinalEn) {
					const dia = statusFinalEn.getDate();
					const mes = statusFinalEn.getMonth() + 1;
					const ano = String(statusFinalEn.getFullYear()).slice(-2);
					const fechaDelAno = fechasDelAno.find((n) => n.dia == dia && n.mes_id == mes);
					const fechaNombre = fechaDelAno.nombre;
					fecha = fechaNombre + "/" + ano;
				}
				const statusCodigo = reg.statusFinal.codigo;
				const statusNombre = reg.statusFinal.nombre;
				const {comentario} = reg;
				historialStatus[i] = {statusCodigo, statusNombre, fecha, comentario};
			});

			// Fin
			return historialStatus;
		},
		ultimoRegistro: async (entidad, entidad_id) => {
			// Obtiene el 'ultHist'
			const condicion = {
				entidad,
				entidad_id,
				[Op.or]: {statusOriginal_id: {[Op.gt]: aprobado_id}, statusFinal_id: {[Op.gt]: aprobado_id}},
			};
			const ultHist = await baseDeDatos.obtienePorCondicionElUltimo("statusHistorial", condicion, "statusFinalEn");

			// Fin
			return ultHist;
		},
	},
	statusAlineado: async function ({entidad, id, prodRclv}) {
		// Obtiene el 'prodRclv'
		if (!prodRclv) {
			let include = ["statusRegistro"]; // se necesita para la vista de 'cambiarStatus'
			if (entidad == "capitulos") include.push("coleccion");
			if (entidad == "colecciones") include.push("capitulos");
			prodRclv = await baseDeDatos.obtienePorId(entidad, id, include);
		} else id = prodRclv.id;
		const {statusRegistro_id} = prodRclv;

		// Obtiene el 'ultHist'
		const ultHist = await this.historialDeStatus.ultimoRegistro(entidad, id);
		const statusFinal_id = ultHist ? ultHist.statusFinal_id : null;

		// Compara los status
		const statusAlineado =
			(statusRegistro_id == creado_id && !ultHist) || // creado
			(aprobados_ids.includes(statusRegistro_id) && (!ultHist || aprobados_ids.includes(statusFinal_id))) || // creadoAprob, aprobado
			([...inacRecup_ids, inactivo_id].includes(statusRegistro_id) && statusRegistro_id == statusFinal_id); // inactivar, recuperar, inactivo

		// Fin
		return {statusAlineado, prodRclv, ultHist};
	},
	accsEnDepsPorCambioDeStatus: async (entidad, registro) => {
		// Variables
		const familias = comp.obtieneDesdeEntidad.familias(entidad);

		// prodsEnRclv
		if (familias == "productos") {
			// Variables
			const prodAprob = activos_ids.includes(registro.statusRegistro_id); // antes era 'aprobados_ids'

			// Actualiza prodAprob en sus links
			if (registro.links && registro.links.length) {
				const campo_id = entidad == "colecciones" ? "grupoCol_id" : comp.obtieneDesdeEntidad.campo_id(entidad);
				await baseDeDatos.actualizaPorCondicion("links", {[campo_id]: registro.id}, {prodAprob});
			}

			// Rutina por entidad rclv
			const entsRclv = variables.entidades.rclvs;
			for (let entRclv of entsRclv) {
				const rclv_id = comp.obtieneDesdeEntidad.campo_id(entRclv);
				if (registro[rclv_id] && registro[rclv_id] != ninguno_id)
					prodAprob
						? baseDeDatos.actualizaPorId(entRclv, registro[rclv_id], {prodsAprob: true})
						: comp.actualizaProdsEnRclv({entidad: entRclv, id: registro[rclv_id]});
			}
		}

		// linksEnProds
		if (familias == "links") {
			// Obtiene los datos identificatorios del producto
			const entProd = comp.obtieneDesdeCampo_id.entProd(registro);
			const campo_id = comp.obtieneDesdeCampo_id.campo_idProd(registro);
			const prodId = registro[campo_id];

			// Actualiza el producto
			await comp.linksEnProd({entidad: entProd, id: prodId});
			if (entProd == "capitulos") {
				const colID = await baseDeDatos.obtienePorId("capitulos", prodId).then((n) => n.coleccion_id);
				comp.actualizaCalidadesDeLinkEnCole(colID);
			}
		}

		// Actualiza la variable de links vencidos
		await comp.linksVencPorSem.actualizaCantLinksPorSem();

		// Fin
		return;
	},
	obtieneCapitulos: async (coleccion_id, temporada) => {
		// Obtiene registros
		const condicion = {coleccion_id, temporada, statusRegistro_id: activos_ids};
		const registros = await baseDeDatos
			.obtieneTodosPorCondicion("capitulos", condicion)
			.then((n) => n.sort((a, b) => a.capitulo - b.capitulo))
			.then((n) =>
				n.map((m) => {
					const nombre = m.nombreCastellano ? m.nombreCastellano : m.nombreOriginal;
					return {id: m.id, numero: m.capitulo, nombre};
				})
			);

		// Fin
		return registros;
	},

	// CRUD y Revisión
	obtieneAvatar: (original, edicion) => {
		// Variables
		const carpeta = original.fuente ? "2-Productos" : "3-RCLVs"; // los registros de producto tienen el campo 'fuente'
		const final = carpeta + "/Final/";
		const revisar = carpeta + "/Revisar/";
		const sinAvatar = "/publico/imagenes/Avatar/Sin-Avatar.jpg";

		// Obtiene el avatar original
		const orig = original.avatar
			? original.avatar.includes("/")
				? original.avatar
				: comp.gestionArchivos.existe(carpetaExterna + final + original.avatar)
				? "/Externa/" + final + original.avatar
				: comp.gestionArchivos.existe(carpetaExterna + revisar + original.avatar)
				? "/Externa/" + revisar + original.avatar
				: sinAvatar
			: sinAvatar;

		// Obtiene el avatar de la edición
		const edic =
			edicion && edicion.avatar
				? edicion.avatar.includes("/")
					? edicion.avatar
					: comp.gestionArchivos.existe(carpetaExterna + final + edicion.avatar)
					? "/Externa/" + final + edicion.avatar
					: comp.gestionArchivos.existe(carpetaExterna + revisar + edicion.avatar)
					? "/Externa/" + revisar + edicion.avatar
					: orig
				: orig;

		// Fin
		return {orig, edic};
	},
	elimina: {
		demasEdiciones: async ({entidad, original, id}) => {
			// Revisa cada registro de edición y decide si corresponde:
			// - Eliminar el registro
			// - Elimina el valor del campo

			// Variables
			const nombreEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
			const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
			const condicion = {[campo_id]: id};
			const ediciones = await baseDeDatos.obtieneTodosPorCondicion(nombreEdic, condicion);

			// Acciones si existen ediciones
			if (ediciones.length) {
				let espera = [];
				for (let edic of ediciones) espera.push(comp.puleEdicion(entidad, original, edic));
				await Promise.all(espera);
			}

			// Fin
			return;
		},
		dependientes: async function (entidad, id) {
			// Variables
			const familias = comp.obtieneDesdeEntidad.familias(entidad);
			const entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
			const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
			const condicion = {[entidad == "colecciones" ? "grupoCol_id" : campo_id]: id};
			const espera = [];

			// Elimina las ediciones
			espera.push(baseDeDatos.eliminaPorCondicion(entEdic, condicion));

			// Productos
			if (familias == "productos") {
				// Elimina las ediciones de link - debe ser 'await', por los links originales
				await baseDeDatos.eliminaPorCondicion("linksEdicion", condicion);

				// Elimina los registros de las entidades dependientes, comunes a todos los productos
				for (let entDepen of ["prodsAzar", "links"]) espera.push(baseDeDatos.eliminaPorCondicion(entDepen, condicion));

				// Elimina los registros de las entidades dependientes, específicos de las colecciones
				if (entidad == "colecciones") {
					await Promise.all(espera); // por ediciones, prodsAzar, links - con impacto en 'capítulos'
					for (let entDepen of ["capitulos", "capsSinLink"])
						espera.push(baseDeDatos.eliminaPorCondicion(entDepen, {coleccion_id: id}));
				}
			}

			// Rclv
			if (familias == "rclvs") {
				// Borra el vínculo en las ediciones de producto y las elimina si quedan vacías
				espera.push(this.vinculoEdicsProds({entRclv: entidad, rclvID: id}));

				// Borra el vínculo en los productos y les cambia el status si corresponde
				espera.push(this.vinculoProds({entRclv: entidad, rclvID: id}));

				// Borra el vínculo en 'fechasDelAno'
				if (entidad == "epocasDelAno") {
					await baseDeDatos.actualizaPorCondicion("fechasDelAno", {[campo_id]: id}, {[campo_id]: 1}); // Quita la relación en la fecha del año
					espera.push(comp.actualizaSolapam()); // Actualiza solapamiento y la variable 'fechasDelAno'
				}
			}

			// Fin
			await Promise.all(espera);
			return;
		},
		vinculoEdicsProds: async ({entRclv, rclvID}) => {
			// Variables
			const rclv_id = comp.obtieneDesdeEntidad.campo_id(entRclv);

			// Averigua si existen ediciones
			const ediciones = await baseDeDatos.obtieneTodosPorCondicion("prodsEdicion", {[rclv_id]: rclvID});
			if (ediciones.length) {
				// Les borra el vínculo
				await baseDeDatos.actualizaPorCondicion("prodsEdicion", {[rclv_id]: rclvID}, {[rclv_id]: null});

				// Revisa si tiene que eliminar alguna edición - la rutina no necesita este resultado
				FN.eliminaEdicionesVacias(ediciones, rclv_id);
			}

			// Fin
			return;
		},
		vinculoProds: async function ({entRclv, rclvID}) {
			// Variables
			const campo_idRclv = comp.obtieneDesdeEntidad.campo_id(entRclv);
			const entidades = variables.entidades.prods;
			let prods = [];
			let espera = [];

			// Obtiene los productos vinculados al rclv, en cada entidad
			for (let entidad of entidades)
				prods.push(
					baseDeDatos
						.obtieneTodosPorCondicion(entidad, {[campo_idRclv]: rclvID})
						.then((n) => n.map((m) => ({...m, [campo_id]: 1})))
				);
			prods = await Promise.all(prods).then((n) => n.flat());

			// Averigua si existían productos vinculados al rclv
			if (prods.length) {
				// Les actualiza el campo_idRclv al valor 'Ninguno'
				for (let entidad of entidades)
					espera.push(baseDeDatos.actualizaPorCondicion(entidad, {[campo_id]: rclvID}, {[campo_id]: 1}));

				//Revisa si se le debe cambiar el status a algún producto - la rutina no necesita este resultado
				this.siHayErroresBajaElStatus(prodsPorEnts);
			}

			// Espera a que concluyan las rutinas
			await Promise.all(espera);

			// Fin
			return;
		},
		siHayErroresBajaElStatus: function (prodsPorEnts) {
			// Variables
			const entidades = variables.entidades.prods;

			// Acciones por cada ENTIDAD
			entidades.forEach(async (entidad, i) => {
				// Averigua si existen registros por cada entidad
				if (prodsPorEnts[i].length)
					// Acciones por cada PRODUCTO
					for (let original of prodsPorEnts[i]) {
						// Si hay errores, le cambia el status
						const errores = await validacs.consolidado({datos: {...original, entidad}});
						if (errores.impideAprobado)
							baseDeDatos.actualizaPorId(entidad, original.id, {statusRegistro_id: creadoAprob_id});
					}
			});

			// Fin
			return;
		},
	},

	// Bloques a mostrar
	bloques: {
		consolidado: async function ({tema, familia, entidad, original}) {
			return tema == "revisionEnts"
				? {
						registro: await this.registro({...original, entidad}),
						usuario: await this.usuario(original.statusSugeridoPor_id, entidad),
				  }
				: familia == "producto"
				? {producto: true, registro: await this.registro({...original, entidad})}
				: familia == "rclv"
				? {rclv: this.rclv({...original, entidad}), registro: await this.registro({...original, entidad})}
				: {};
		},
		registro: async (registro) => {
			// Variable
			let resultado = [];

			// Datos CRUD
			resultado.push(
				!registro.altaRevisadaEn
					? {titulo: "Creado el", valor: comp.fechaHora.diaMesAno(registro.creadoEn)}
					: {titulo: "Revisado el", valor: comp.fechaHora.diaMesAno(registro.altaRevisadaEn)}
			);

			// Status resumido
			resultado.push({titulo: "Status", ...FN.statusRegistro(registro)});

			// Si el registro está inactivo, le agrega el motivo
			if (registro.statusRegistro_id == inactivo_id) resultado.push(await FN.obtieneMotivoDetalle(registro));

			// Fin
			return resultado;
		},
		rclv: (registro) => {
			// Variables
			let bloque = [];

			// Información
			bloque.push({titulo: "Nombre", valor: registro.nombre});
			if (registro.nombreAltern) {
				const articulo =
					registro.entidad == "personajes"
						? (registro.genero_id.includes("M") ? "o" : "a") + (registro.genero_id.includes("P") ? "s" : "")
						: comp.obtieneDesdeEntidad.oa(registro.entidad);
				bloque.push({titulo: "También conocid" + articulo + " como", valor: registro.nombreAltern});
			}
			if (registro.canon && registro.canon_id != "NN" && registro.canon[registro.genero_id])
				bloque.push({titulo: "Status Canoniz.", valor: registro.canon[registro.genero_id]});

			if (registro.fechaDelAno && registro.fechaDelAno.id < 400) {
				const articulo = comp.letras.laLo(registro);
				bloque.push({titulo: "Se " + articulo + " recuerda el", valor: registro.fechaDelAno.nombre});
			}

			if (registro.rolIglesia && registro.rolIglesia_id != "NN")
				bloque.push({titulo: "Rol en la Iglesia", valor: registro.rolIglesia[registro.genero_id]});
			if (registro.apMar && registro.apMar_id != sinApMar_id)
				bloque.push({titulo: "Aparición Mariana", valor: registro.apMar.nombre});
			if (registro.anoNacim) bloque.push({titulo: "Año de nacimiento", valor: registro.anoNacim});

			// Particularidades para hechos
			if (registro.entidad == "hechos") {
				if (registro.anoComienzo) bloque.push({titulo: "Año", valor: registro.anoComienzo});
				if (registro.ama) bloque.push({valor: "Es una aparición mariana"});
			}

			// Fin
			return bloque;
		},
		usuario: async (usuario_id, entidad) => {
			// Variables
			const petitFamilias = comp.obtieneDesdeEntidad.petitFamilias(entidad);
			const ahora = comp.fechaHora.ahora();
			const usuario = await baseDeDatos.obtienePorId("usuarios", usuario_id);
			let bloque = [];

			// Nombre
			bloque.push({titulo: "Nombre", valor: usuario.nombre + " " + usuario.apellido});

			// Edad
			if (usuario.fechaNacim) {
				let edad = parseInt((ahora - new Date(usuario.fechaNacim).getTime()) / unAno);
				bloque.push({titulo: "Edad", valor: edad + " años"});
			}

			// Tiempo en ELC
			const antiguedad = ((ahora - new Date(usuario.creadoEn).getTime()) / unAno).toFixed(1).replace(".", ",");
			bloque.push({titulo: "Tiempo en ELC", valor: antiguedad + " años"});

			// Calidad de las altas
			bloque.push(...FN.usuarioCalidad(usuario, petitFamilias));

			// Fin
			return bloque;
		},
	},
};

// Funciones
let FN = {
	eliminaEdicionesVacias: async function (ediciones, campo_idRclv) {
		// Revisa si tiene que eliminar alguna edición
		for (let edicion of ediciones) {
			// Variables
			const campo_idProd = comp.obtieneDesdeCampo_id.campo_idProd(edicion);
			const entProd = comp.obtieneDesdeCampo_id.entProd(edicion);
			const prodId = edicion[campo_idProd];

			// Obtiene el producto original
			const original = await baseDeDatos.obtienePorId(entProd, prodId);

			// Elimina la edición si está vacía
			delete edicion[campo_idRclv];
			await comp.puleEdicion(entProd, original, edicion);
		}
		// Fin
		return;
	},
	statusRegistro: (registro) => {
		// Variables
		const {entidad, id} = registro;
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		const {codigo, nombre} = registro.statusRegistro;
		const origen = familia == "producto" ? "P" : "R";
		const cola = "/?entidad=" + entidad + "&id=" + id + "&origen=DT" + origen;

		// Fin
		return {codigo, valor: nombre};
	},
	usuarioCalidad: (usuario, prefijo) => {
		// Contar los casos aprobados y rechazados
		const cantAprob = usuario[prefijo + "Aprob"];
		const cantRech = usuario[prefijo + "Rech"];

		// Mediciones
		const cantidad = cantAprob + cantRech;
		const calidad = cantidad ? parseInt((cantAprob / cantidad) * 100) + "%" : "-";

		// Prepara el resultado
		const sufijo = prefijo != "edics" ? "Altas" : "Ediciones";
		const resultados = [
			{titulo: "Eficacia de " + sufijo, valor: calidad},
			{titulo: "Cant. de " + sufijo, valor: cantidad.toLocaleString("pt")},
		];

		// Fin
		return resultados;
	},
	obtieneMotivoDetalle: async (registro) => {
		// Variables
		const {entidad, id: entidad_id} = registro;
		const condicion = {entidad, entidad_id, statusFinal_id: inactivo_id};

		// Obtiene el motivo del último statusHistorial
		const statusHistorial = await baseDeDatos.obtienePorCondicionElUltimo("statusHistorial", condicion, "statusFinalEn");
		const motivo =
			statusHistorial && statusHistorial.motivo_id ? statusMotivos.find((n) => n.id == statusHistorial.motivo_id) : null;
		const motivoDetalle = motivo ? (motivo.general ? statusHistorial.comentario : motivo.descripcion) : null;

		// Fin
		return {motivoDetalle};
	},
	statusFinal: (statusFinal_id) => {
		const {nombre} = statusRegistros.find((n) => n.id == statusFinal_id);
		const {codigo} = statusRegistros.find((n) => n.id == statusFinal_id);
		return {nombre, codigo};
	},
};
