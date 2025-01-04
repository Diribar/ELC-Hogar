"use strict";

const unaHora = 60 * 60 * 1000;
const unDia = unaHora * 24;
const unaSemana = unDia * 7;
const unMes = unDia * 30;
const unAno = unDia * 365;

const linksSemsPrimRev = 4;
const linksSemsEstrRec = 5;
const linksSemsEstandar = 26;
const iconos = {
	...{faSolid: "fa-solid", inicio: "fa-house", ayuda: "fa-circle-question"}, // Uso general
	...{triangulo: "fa-triangle-exclamation", entendido: "fa-thumbs-up"}, // Carteles
	...{izquierda: "fa-circle-left", derecha: "fa-circle-right", check: "fa-circle-check", xMark: "fa-circle-xmark"}, // Formularios

	// Ocasionales
	...{agregar: "fa-circle-plus", calificar: "fa-chart-simple", eliminar: "fa-trash-can"},
	historial: "fa-arrow-right-arrow-left",
	...{detalle: "fa-circle-info", edicion: "fa-pen", edicionCambiada: "fa-arrow-right-long", rotar: "fa-rotate-90"},
	...{graficos: "fa-chart-line", chart: "fa-chart-pie", columnas: "fa-chart-simple", area: "fa-chart-area"},
	...{prod: "fa-video", rclv: "fa-child", link: "fa-link", instituc: "fa-building-columns", mail: "fa-envelope"},
	...{login: "fa-circle-user", altaUser: "fa-user-plus", revision: "fa-user-graduate", mantenim: "fa-tools"},
};

module.exports = {
	// Institucional
	vistasInstitucs: {
		inicio: {titulo: "Inicio", codigo: "inicio", icono: iconos.inicio, hr: true}, // 'hr' significa que pone una línea divisoria en el menú del header
		"quienes-somos": {titulo: "Quiénes somos", codigo: "quienesSomos", icono: "fa-people-group"},
		"mision-y-vision": {titulo: "Nuestra Misión y Visión", codigo: "misionVision", icono: "fa-heart", hr: true},
		"en-que-consiste-este-sitio": {titulo: "En qué consiste este sitio", codigo: "enQueConsiste", icono: "fa-question"},
		"nuestro-perfil-de-peliculas": {
			titulo: "Nuestro Perfil de Películas",
			codigo: "perfilPelis",
			icono: "fa-trophy",
			hr: true,
		},
		"derechos-de-autor": {titulo: "Derechos de Autor", codigo: "derechosAutor", icono: "fa-copyright"},
	},

	// Gráficos
	graficos: {
		// Clientes
		clientesBD: {
			rubro: "clientes",
			titulo: "Cant. de Clientes en BD",
			url: "cantidad-de-clientes",
			icono: iconos.area,
			resaltar: true,
		},

		// Navegaciones
		navegsDia: {
			rubro: "navegantes",
			titulo: "Navegantes por día",
			url: "navegantes-por-dia",
			icono: iconos.columnas,
			resaltar: true,
		},
		navegsPorHora: {
			rubro: "navegantes",
			titulo: "Navegantes por hora",
			url: "navegantes-por-hora",
			icono: iconos.columnas,
			select: true,
		},
		navegsPorProd: {
			rubro: "navegantes",
			titulo: "Navegantes por producto",
			url: "navegantes-por-producto",
			icono: iconos.columnas,
			select: true,
		},
		navegsPorRuta: {
			rubro: "navegantes",
			titulo: "Navegantes por ruta",
			url: "navegantes-por-ruta",
			icono: iconos.columnas,
			select: true,
		},

		// Productos
		prodsCfcVpc: {
			rubro: "prods",
			titulo: "Películas - CFC / VPC",
			url: "peliculas-cfc-vpc",
			icono: iconos.chart,
		},
		prodsPorPublico: {
			rubro: "prods",
			titulo: "Películas - Público recomendado",
			url: "peliculas-por-publico",
			icono: iconos.chart,
		},
		prodsPorEpocaEstr: {
			rubro: "prods",
			titulo: "Películas - Época de estreno",
			url: "peliculas-por-epoca-de-estreno",
			icono: iconos.columnas,
		},

		// Rclvs
		rclvsRangosSinEfems: {
			rubro: "rclvs",
			titulo: "Rclvs - Rangos sin Efemérides",
			url: "rclvs-rangos-sin-efemerides",
			icono: iconos.columnas,
		},

		// Links
		linksVencim: {
			rubro: "links",
			titulo: "Links - Vencimiento Semanal",
			url: "vencimiento-de-links",
			icono: iconos.columnas,
			resaltar: true,
		},
		linksPorProv: {
			rubro: "links",
			titulo: "Links - Proveedores",
			url: "links-por-proveedor",
			icono: iconos.chart,
		},
	},

	// Productos
	dibujosAnimados: "Dibujos Animados",
	documental: "Documental",

	// Rclv
	prefijosSanto: ["Domingo", "Tomás", "Tomas", "Tomé", "Toribio"], // ponemos 'Tomas' sin acento, por si alguien lo escribe mal
	...{ninguno_id: 1, varios_id: 2, sinApMar_id: 2, idsReserv: 10, sinFecha_id: 400},
	prioridadesRclv: [
		{id: 1, nombre: "Menor", codigo: "menor"},
		{id: 2, nombre: "Estándar", codigo: "estandar"},
		{id: 3, nombre: "Mayor", codigo: "mayor"},
	],
	prefijos: [
		...["Ven", "Venerable"],
		...["Beata", "Beato"],
		...["San", "Santo", "Santa"],
		...["Padre", "Obispo", "Cardenal", "Papa", "Don"],
		...["Madre", "Hna", "Sor"],
	],

	// Links
	linkSemInicial: 1,
	...{linksSemsPrimRev, linksSemsEstrRec, linksSemsEstandar},
	linksVU_primRev: unaSemana * linksSemsPrimRev,
	linksVU_estrRec: unaSemana * linksSemsEstrRec,
	linksVU_estandar: unaSemana * linksSemsEstandar,
	...{sinLinks: 0, linksTalVez: 1, conLinks: 2},
	linkAnoReciente: 2,
	cantLinksVencPorSem: null,
	provsListaNegra: ["gloria.tv"],
	provsQueNoRespetanCopyright: [
		{nombre: "Cuevana", url: "cuevana"},
		{nombre: "Google Drive", url: "drive.google.com/"},
	],
	calidadesDeLink: [240, 360, 480, 720, 1080],

	// Usuario
	...{maxIntentosCookies: 3, maxIntentosBD: 3, usAutom_id: 2},

	// Tiempo
	rutinasDeInicio: Date.now(),
	...{unaHora, unDia, unaSemana, unMes, unAno},
	diasSemana: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
	hoy: new Date().toISOString().slice(0, 10),
	...{primerLunesDelAno: null, semanaUTC: null, lunesDeEstaSemana: null, fechaDelAnoHoy_id: null, anoHoy: null},
	setTimeOutStd: 2000,

	// Mensajes
	inputVacio: "Necesitamos que completes este campo",
	selectVacio: "Necesitamos que elijas una opción",
	radioVacio: "Necesitamos que elijas una opción",
	rclvSinElegir: "Necesitamos que respondas alguna de las opciones",
	ayudaLinks: {
		parrafo: "<em>Color de los bordes (simil semáforo):</em>",
		mensajes: [
			"<i class='" + iconos.faSolid + " fa-circle enCast'></i> hablada en <b>castellano</b>",
			"<i class='" + iconos.faSolid + " fa-circle subtCast'></i> <b>subtitulos</b> en castellano",
			"<i class='" + iconos.faSolid + " fa-circle otroIdioma'></i> hablada en <b>otro</b> idioma",
			"<i class='" + iconos.faSolid + " fa-circle elegi'></i> <b>elegí</b> el idioma",
		],
	},
	beneficiosLogin: [
		"Te permite marcar tus preferencias por película: la quiero ver, ya la vi, no me interesa.",
		"También te permite entre otras cosas:<ul><li>Ver tus mismas preferencias en distintos dispositivos.</li><li>Ver el listado de tus últimas películas consultadas.</li><li>Influir en el contenido de nuestro sitio.</li></ul>",
	],

	// Otras
	tamMaxImagen: 1024000, // 1Mb
	imgInstitucional: "/publico/imagenes/Varios/Institucional.jpg",
	largoComentario: 150,
	statusErrores: [],
	iconos,
	asuntosContactanos: [
		{descripcion: "Comentario sobre nuestro sitio", codigo: "sitio"},
		{descripcion: "Comentario sobre una película", codigo: "producto"},
		{descripcion: "Otro motivo", codigo: "varios"},
	],
	eliminarCuandoSinEntidadId: ["statusHistorial", "edicsHistorial", "misConsultas", "pppRegistros", "calRegistros"],
	requestsTriviales: ["WhatsApp", "Postman", "TelegramBot", "TwitterBot", "Zabbix"], // evita que se cuenten como visitas
	requestsClientes: {
		MB_Ch125:
			"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
		PC_Ch120:
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		PC_Ch124:
			"Mozilla/5.0 (Windows NT 10.0.0; Win64; x64; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.93 Chrome/124.0.6367.93 Not-A.Brand/99  Safari/537.36",
		PC_Ch131:
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	},
	rutasConHistorial: {
		iguales: [
			// Familia - Alta de Usuarios
			["/usuarios/alta-mail", "altaDeMail", iconos.altaUser, "fa-address-card"], // tarjeta de presentación
			["/usuarios/editables", "altaEditables", iconos.altaUser, "fa-user-pen"], // usuario con edición
			["/usuarios/editables-bienvenido", "editablesBienvenido", iconos.altaUser, "fa-user-check"], // usuario con check
			["/usuarios/perennes", "altaPerennes", iconos.altaUser, "fa-user-lock"], // candado
			["/usuarios/perennes-bienvenido", "perennesBienvenido", iconos.altaUser, "fa-user-gear"], // rueda de configuración

			// Varios
			["/", "inicio", iconos.inicio],
			["/institucional/inicio", "inicio", iconos.inicio],
			["busqueda-rapida", "busquedaRapida", "fa-magnifying-glass"],
			["/usuarios/login", "login", iconos.login],
		],
		startsWith: [
			// Institucional
			["/institucional/contactanos", "contactanos", iconos.instituc, iconos.mail],
			["/institucional", "institucional", iconos.instituc],

			// Familia
			["/revision/inactivar", "revisionInactivar", iconos.revision,iconos.xMark],
			["/revision/recuperar", "revisionRecuperar", iconos.revision,iconos.check],
			["/revision/", "revision", iconos.revision],

			// Otros
			["/consultas", "consultas", "fa-film"],
			["/mantenimiento", "mantenimiento", iconos.mantenim],
			["/graficos", "graficos", iconos.graficos],
			["/usuarios/envio-exitoso-de-mail", "mailBienvenido", iconos.altaUser, iconos.mail], // sobre de correo - tiene query

			// Discontinuados
			["/producto", "antiguaProd"],
			["/rclv", "antiguaRclv"],
			["/links", "antiguaLinks"],
		],
		includes: [
			// Familia "Productos"
			["/detalle/p/", "detalleProd", iconos.prod, iconos.detalle],
			["/edicion/p/", "edicionProd", iconos.prod, iconos.edicion],
			["/calificar/p/", "calificarProd", iconos.prod, iconos.calificar],
			["/links/mirar/l/", "mirarLink", iconos.prod, "fa-couch"],
			["/abm-links/p/", "abmLinks", iconos.prod, iconos.link],
			["/historial/p", "historial", iconos.prod, iconos.historial],
			["/inactivar/p", "inactivar", iconos.prod, iconos.xMark],
			["/recuperar/p", "recuperar", iconos.prod, iconos.check],

			// Agregar productos
			["/agregar-pc", "agregarProd-pc", iconos.agregar, "fa-caret-up"],
			["/agregar-im", "agregarProd-im", iconos.agregar, "fa-square-caret-up"],
			["/agregar-ds", "agregarProd-ds", iconos.agregar, "fa-caret-right"],
			["/agregar-fa", "agregarProd-fa", iconos.agregar, "fa-square-caret-right"],
			["/agregar-dd", "agregarProd-dd", iconos.agregar, "fa-caret-down"],
			["/agregar-da", "agregarProd-da", iconos.agregar, "fa-caret-left"],
			["/agregar-cn", "agregarProd-cn", iconos.agregar, iconos.ayuda],
			["/agregar-tr", "agregarProd-tr", iconos.agregar, iconos.check],

			// Familia "Rclvs"
			["/detalle/r", "detalleRclv", iconos.rclv, iconos.detalle],
			["/edicion/r", "edicionDeRclv", iconos.rclv, iconos.edicion],
			["/agregar/r/", "agregarRclv", iconos.rclv, iconos.agregar],
			["/historial/r", "historial", iconos.rclv, iconos.historial],
			["/inactivar/r", "inactivar", iconos.rclv, iconos.xMark],
			["/recuperar/r", "recuperar", iconos.rclv, iconos.check],

			// Familia
			["/correccion-del-", "correccion", iconos.revision],
		],
	},
	rutasSinHistorial: {
		includes: ["/eliminado"],
		startsWith: [
			...["/cookies", "/session", "/movimientos-del-dia"], // Miscelaneas
			...["/productos-por-registro/r", "/listados/links"], // Familias
			"/usuarios",
		],
	},
};
