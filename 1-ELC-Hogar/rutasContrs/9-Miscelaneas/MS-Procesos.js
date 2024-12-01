"use strict";

module.exports = {
	mantenim: {
		obtieneProds: async (usuario_id) => {
			// Variables
			const entidades = variables.entidades.prods;
			const camposFijos = {entidades, usuario_id};
			let campos;

			// Productos Inactivos
			campos = {...camposFijos, status_id: inactivo_id};
			let inactivos = FN_tablManten.obtieneRegs(campos);

			// Productos Aprobados
			campos = {...camposFijos, status_id: aprobado_id};
			delete campos.entidades.capitulos;
			let pelisColes = await FN_tablManten.obtieneRegs(campos);

			// Productos Sin Edición (en status creadoAprob)
			let SE_pel = FN_tablManten.obtieneSinEdicion("peliculas");
			let SE_col = FN_tablManten.obtieneSinEdicion("colecciones");
			let SE_cap = FN_tablManten.obtieneSinEdicion("capitulos");

			// Calificaciones de productos y Preferencia por productos
			let califics = baseDeDatos.obtieneTodosPorCondicion("calRegistros", {usuario_id: usuario_id});
			let prodsVistos = baseDeDatos.obtieneTodosPorCondicion("pppRegistros", {
				usuario_id: usuario_id,
				ppp_id: pppOpcsObj.yaLaVi.id,
			});

			// Espera las lecturas
			[inactivos, pelisColes, SE_pel, SE_col, SE_cap, califics, prodsVistos] = await Promise.all([
				inactivos,
				pelisColes,
				SE_pel,
				SE_col,
				SE_cap,
				califics,
				prodsVistos,
			]);

			// Productos sin calificar
			const prodsSinCalif = prodsVistos.filter(
				(n) => !califics.some((m) => m.entidad == n.entidad && m.entidad_id == n.entidad_id)
			);

			// Resultados
			const resultados = {
				// Productos
				SE: [...SE_pel, ...SE_col, ...SE_cap], // sin edición
				IN: inactivos.filter((n) => !n.statusColeccion_id || n.statusColeccion_id == aprobado_id), // películas y colecciones inactivas, y capítulos con su colección aprobada
				SC: pelisColes.filter((n) => prodsSinCalif.find((m) => m.entidad == n.entidad && m.entidad_id == n.id)), // pelis - Sin calificar
				ST: pelisColes.filter((n) => n.tema_id == ninguno_id), // pelisColes - Sin tema

				// Prods - sin links
				SL_pelis: pelisColes.filter((n) => !n.linksGral && n.entidad == "peliculas"), // películas
				SL_coles: pelisColes.filter((n) => !n.linksGral && n.entidad == "colecciones"), // colecciones

				// Tiene links, pero no variantes básicas
				SLG_basico: pelisColes.filter((n) => n.linksGral && !n.linksGratis), // sin links gratuitos
				SLC_basico: pelisColes.filter((n) => n.linksGral && !n.linksCast && !n.linksSubt), // sin links en castellano

				// Links HD
				SL_HD_pelis: pelisColes.filter((n) => n.linksGral && !n.HD_Gral && n.entidad == "peliculas"), // con Links pero sin HD
				SL_HD_coles: pelisColes.filter((n) => n.linksGral && !n.HD_Gral && n.entidad == "colecciones"), // con Links pero sin HD
				SLG_HD: pelisColes.filter((n) => n.HD_Gral && n.linksGratis && !n.HD_Gratis), // sin HD gratuitos
				SLC_HD: pelisColes.filter((n) => n.HD_Gral && (n.linksCast || n.linksSubt) && !n.HD_Cast && !n.HD_Subt), // sin HD en castellano
			};

			// Fin
			return resultados;
		},
		obtieneRCLVs: async (usuario_id) => {
			// Variables
			const entsRclv = variables.entidades.rclvs;
			const entsProd = [...variables.entidades.prods, "prodsEdicion"];
			const camposFijos = {entidades: entsRclv, usuario_id};
			let campos;

			// Inactivos
			campos = {...camposFijos, status_id: inactivo_id};
			let IN = FN_tablManten.obtieneRegs(campos);

			// Aprobados
			campos = {...camposFijos, status_id: aprobado_id};
			let rclvsAprob = FN_tablManten.obtieneRegs(campos);

			// Await
			[IN, rclvsAprob] = await Promise.all([IN, rclvsAprob]);

			// Sin Avatar
			const SA = rclvsAprob.filter((m) => !m.avatar && m.id > varios_id);

			// Con solapamiento de fechas
			const SF = rclvsAprob.filter((m) => m.solapam_fechas);

			// Sin producto
			let regsProd = [];
			for (let entProd of entsProd) regsProd.push(baseDeDatos.obtieneTodos(entProd));
			regsProd = await Promise.all(regsProd).then((n) => n.flat());
			const SP = rclvsAprob.filter((rclv) => {
				const campo_id = comp.obtieneDesdeEntidad.campo_id(rclv.entidad);
				return regsProd.every((regProd) => regProd[campo_id] != rclv.id);
			});

			// Fin
			return {IN, SA, SF, SP};
		},
		obtieneLinksInactivos: async (usuario_id) => {
			// Variables
			let include = variables.entidades.asocsProd;
			let condicion = {statusRegistro_id: inactivo_id};

			// Obtiene los links 'a revisar'
			let linksInactivos = await baseDeDatos.obtieneTodosPorCondicion("links", condicion, include);

			// Obtiene los productos
			let productos = linksInactivos.length
				? await FN_tablManten.obtieneProdsDeLinks(linksInactivos, usuario_id)
				: {LI: []};

			// Fin
			return productos;
		},
	},
	navegsDia: {
		obtieneNavegsDia: async () => {
			// Obtiene las navegsDia
			let navegsDia = await baseDeDatos.obtieneTodosConOrden("navegsDia", "fecha", true);
			if (!navegsDia.length) return [];

			// Las reordena
			let respuesta = [];
			while (navegsDia.length) {
				const {cliente_id} = navegsDia[0];
				const registros = navegsDia.filter((n) => n.cliente_id == cliente_id);
				respuesta.push(...registros);
				navegsDia = navegsDia.filter((n) => n.cliente_id != cliente_id);
			}

			// Elimina duplicados
			for (let i = respuesta.length - 1; i > 0; i--) {
				const actual = respuesta[i];
				const anterior = respuesta[i - 1];
				if (actual.cliente_id == anterior.cliente_id && actual.ruta == anterior.ruta) respuesta.splice(i, 1);
			}

			// Fin
			return respuesta;
		},
		iconosArray: (url) => {
			// Variables
			const familias = {
				[iconos.instituc]: "institucional",
				[iconos.prod]: "producto",
				[iconos.rclv]: "rclv",
				[iconos.agregar]: "agregar",
			};

			// Averigua si es una ruta que puede tener una abreviatura
			const distintivo = comp.rutasConHistorial(url);
			if (!distintivo) return {};

			// Averigua si tiene íconos
			const posibilidades = Object.values(rutasConHistorial).flat();
			const ruta = posibilidades.find((n) => distintivo == n[1]);
			const iconosDistintivo = ruta.slice(2);
			if (!iconosDistintivo.length) return {distintivo};

			// Genera el HTML de íconos
			let iconosArray = [];
			let familia;
			for (let icono of iconosDistintivo) {
				// Genera el ícono
				familia = familias[icono] || familia;
				const titulo = familias[icono] || distintivo;
				let iconoHTML = "<i class='fa-solid " + icono;
				if (familia) iconoHTML += " " + familia;
				iconoHTML += "' title='" + titulo + "'></i>";

				// Agrega el ícono
				iconosArray.push(iconoHTML);
			}

			// Fin
			return {iconosArray};
		},
		prodRclv: async (ruta) => {
			// Averigua si es una entidad
			let entidad = ruta.slice(1);
			const indice = entidad.indexOf("/");
			if (indice > -1) entidad = entidad.slice(0, indice);

			// Si no es una entidad, interrumpe la función
			if (!variables.entidades.todos.includes(entidad)) return {};

			// Averigua si tiene un id
			const tieneId = ruta.split("/?id=").length > 1;

			// Si no tiene id, interrumpe la función
			if (!tieneId) return {};

			// Averigua el id
			let id = ruta.split("/?id=")[1].split("&")[0];

			// Si es un link, averigua el producto
			if (entidad == "links") {
				const link = await baseDeDatos.obtienePorId("links", id);
				entidad = comp.obtieneDesdeCampo_id.entidadProd(link);
				const campo_id = comp.obtieneDesdeCampo_id.campo_id(link);
				id = link[campo_id];
			}

			// Fin
			return {entidad, id};
		},
		resumen: (navegsDia) => {
			// Obtiene las personas
			const clientes_id = [...new Set(navegsDia.map((n) => n.cliente_id))];

			// Agrega un registro resumen
			for (let cliente_id of clientes_id) {
				// Obtiene datos para la cabecera
				const regsCliente = navegsDia.filter((n) => n.cliente_id == cliente_id);
				const cantPers = regsCliente.length;
				const {persona, esUser, hora} = regsCliente[0];
				const iconosHTML = FN_navegsDia.obtieneIconosPorFamilia(regsCliente);

				// Agrega un registro de cabecera
				const indice = navegsDia.findIndex((n) => n.cliente_id == cliente_id);
				const cabecera = {cliente_id, persona, cantPers, esUser, hora, iconosHTML};
				navegsDia.splice(indice, 0, cabecera);
			}

			// Fin
			return navegsDia;
		},
	},
	redirecciona: {
		urlsOrigenDestino: (entidad) => {
			const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
			return [
				// Productos y Rclvs
				{codOrigen: "DT", destino: "/" + entidad + "/detalle/" + siglaFam, cola: true}, // OK
				{codOrigen: "RA", destino: "/revision/alta/" + siglaFam + "/" + entidad, cola: true},

				// Productos
				{codOrigen: "PDA", destino: "/" + entidad + "/agregar-da"}, // OK
				{codOrigen: "PED", destino: "/" + entidad + "/edicion/p", cola: true},
				{codOrigen: "RL", destino: "/revision/abm-links/p/" + entidad, cola: true},

				// Tableros
				{codOrigen: "TE", destino: "/revision/tablero"},
				{codOrigen: "MT", destino: "/mantenimiento"},
				{codOrigen: "TU", destino: "/revision-us/tablero"},
			];
		},
		obtieneRuta: (entidad, originalUrl) => {
			// Variables
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);

			// Producto Agregar
			if (originalUrl.startsWith("/producto/agregar")) {
				const rutas = [
					{ant: "/palabras-clave", act: "pc"},
					{ant: "/desambiguar", act: "ds"},
					{ant: "/datos-duros", act: "dd"},
					{ant: "/datos-adicionales", act: "da"},
					{ant: "/confirma", act: "cn"},
					{ant: "/terminaste", act: "tr"},
					{ant: "/ingreso-manual", act: "im"},
					{ant: "/ingreso-fa", act: "fa"},
				];
				const ruta = rutas.find((n) => originalUrl.endsWith(n.ant));
				return ruta ? {ant: "/producto/agregar/" + ruta.ant, act: "/producto/agregar-" + ruta.act} : null;
			}

			// Rutas de Familia, Producto RUD y Rclv CRUD
			if (["/producto", "/rclv"].some((n) => originalUrl.startsWith(n))) {
				// Obtiene las rutas
				const rutas = [
					// Familia
					{ant: "/" + familia + "/historial", act: "/" + entidad + "/historial"},
					{ant: "/" + familia + "/inactivar", act: "/" + entidad + "/inactivar"},
					{ant: "/" + familia + "/recuperar", act: "/" + entidad + "/recuperar"},
					{ant: "/" + familia + "/eliminadoPorCreador", act: "/" + entidad + "/eliminado-por-creador"},
					{ant: "/" + familia + "/eliminar", act: "/" + entidad + "/eliminado"},

					// RUD Producto y Rclv
					{ant: "/" + familia + "/detalle", act: "/" + entidad + "/detalle/" + siglaFam},
					{ant: "/" + familia + "/edicion", act: "/" + entidad + "/edicion/" + siglaFam},
				];
				if (familia == "producto")
					rutas.push(
						{ant: "/producto/calificar", act: "/" + entidad + "/calificar/p"},
						{ant: "/links/abm", act: "/" + entidad + "/abm-links/p"}
					);
				if (familia == "rclv") rutas.push({ant: "/rclv/agregar", act: "/" + entidad + "/agregar/r"});

				// Redirecciona
				const ruta = rutas.find((n) => originalUrl.startsWith(n.ant));
				return ruta;
			}

			// Links
			if (familia == "link") return {ant: "/links/visualizacion/", act: "/links/mirar/l/"};

			// Revisión de Entidades
			if (originalUrl.startsWith("/revision")) {
				// Rutas específicas de cada familia
				const rutas = [
					{ant: "/revision/" + familia + "/alta", act: "/revision/alta/" + siglaFam + "/" + entidad},
					{ant: "/revision/solapamiento/", act: "/revision/solapamiento/r/" + entidad},
					{ant: "/revision/links", act: "/revision/abm-links/p/" + entidad},
				];

				// Rutas compartidas
				const tareas = ["edicion", "rechazar", "inactivar", "recuperar"];
				for (let tarea of tareas)
					rutas.push({ant: "/revision/" + familia + "/" + tarea, act: "/revision/" + tarea + "/" + entidad});

				// Redirecciona
				const ruta = rutas.find((n) => originalUrl.startsWith(n.ant));
				return ruta;
			}

			// Fin
			return null;
		},
	},
};

const FN_tablManten = {
	obtieneRegs: async function (campos) {
		// Variables
		const {entidades} = campos;
		let resultados = [];

		// Obtiene los resultados
		for (let entidad of entidades) resultados.push(this.lecturaBD({entidad, ...campos}));

		// Consolida los resultados y los ordena
		resultados = await Promise.all(resultados)
			.then((n) => n.flat())
			.then((n) => n.sort((a, b) => b.statusSugeridoEn - a.statusSugeridoEn));

		// Quita los comprometidos por capturas
		resultados = await comp.sinProblemasDeCaptura(resultados, campos.usuario_id);

		// Fin
		return resultados;
	},
	lecturaBD: async ({status_id, include, entidad}) => {
		// Variables
		const includeBD = include ? [...include] : [];
		if (entidad == "colecciones") includeBD.push("csl"); // capítulos sin link

		// Condiciones
		const condicion = {statusRegistro_id: status_id}; // Con status según parámetro
		if (variables.entidades.rclvs.includes(entidad)) condicion.id = {[Op.gt]: varios_id};

		// Resultado
		const resultados = await baseDeDatos
			.obtieneTodosPorCondicion(entidad, condicion, includeBD)
			.then((n) => n.map((m) => ({...m, entidad})));

		// Fin
		return resultados;
	},
	obtieneSinEdicion: (entidad) => {
		// Variables
		const condicion = {statusRegistro_id: creadoAprob_id};
		if (entidad == "capitulos") condicion.statusColeccion_id = aprobado_id;

		// Obtiene la información
		return baseDeDatos
			.obtieneTodosPorCondicion(entidad, condicion, "ediciones")
			.then((n) => n.filter((m) => !m.ediciones.length))
			.then((n) => n.map((m) => ({...m, entidad})));
	},
	obtieneProdsDeLinks: async (links, usuario_id) => {
		// Variables
		let LI = [];

		// Obtiene los prods
		for (let link of links) {
			// Variables
			const entidad = comp.obtieneDesdeCampo_id.entidadProd(link);
			const asociacion = comp.obtieneDesdeEntidad.asociacion(entidad);
			const fechaRef = link.statusSugeridoEn;
			const fechaRefTexto = comp.fechaHora.diaMes(link.statusSugeridoEn);

			// Agrega los registros
			LI.push({...link[asociacion], entidad, fechaRef, fechaRefTexto});
		}

		if (LI.length > 1) {
			// Ordena
			LI.sort((a, b) => new Date(b.fechaRef) - new Date(a.fechaRef)); // Fecha más reciente

			// Elimina repetidos
			LI = comp.eliminaRepetidos(LI);
		}

		// Deja solamente los prods aprobados
		if (LI.length) LI = LI.filter((n) => aprobados_ids.includes(n.statusRegistro_id));

		// Deja solamente los prods sin problemas de captura
		if (LI.length) LI = await comp.sinProblemasDeCaptura(LI, usuario_id);

		// Fin
		return {LI};
	},
};
const FN_navegsDia = {
	obtieneIconosPorFamilia: (regsCliente) => {
		// Variables
		const familias = ["instituc", "prod", "rclv", "agregar"];

		let iconosCons = [];

		// Obtiene los iconos por familia
		for (let familia of familias) {
			// Obtiene los regsCliente con ese ícono
			const registrosConIcono = regsCliente.filter((n) => n.iconosArray && n.iconosArray[0].includes(iconos[familia]));
			regsCliente = regsCliente.filter((n) => !n.iconosArray || !n.iconosArray[0].includes(iconos[familia]));
			if (!registrosConIcono.length) continue;

			// Obtiene el ícono principal
			const iconoFamilia = registrosConIcono[0].iconosArray[0];

			// Obtiene los íconos secundarios
			let iconosSecun = registrosConIcono.map((n) => n.iconosArray[1]);
			iconosSecun = [...new Set(iconosSecun)];
			iconosSecun.sort((a, b) => (a < b ? -1 : 1));

			// Consolida los íconos
			const iconosConsFamilia = [iconoFamilia, ...iconosSecun].join(" ");
			iconosCons.push(iconosConsFamilia);
		}

		// Obtiene los íconos que no fueron incluidos
		let iconosResto = regsCliente.map((n) => n.iconosArray && n.iconosArray[0]);
		if (iconosResto.length) {
			iconosResto = [...new Set(iconosResto)];
			iconosResto.sort((a, b) => (a < b ? -1 : 1));
			const iconosConsFamilia = iconosResto.join(" ");
			iconosCons.unshift(iconosConsFamilia);
		}

		// Convierte los íconos a texto
		iconosCons = iconosCons.join("<span class'separador'> / </span>");

		// Fin
		return iconosCons;
	},
};
