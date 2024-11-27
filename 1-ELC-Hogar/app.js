"use strict";
// Variable 'global'
const constantes = require("./variables/Constantes.js");
for (let metodo in constantes) global[metodo] = constantes[metodo];

// Require 'path'
global.path = require("path");
const carpeta = global.path.basename(path.resolve());
const produccion = carpeta == "1-Aplicacion";
const pruebas = carpeta == "Pruebas";
global.urlHost = produccion ? "https://elc.lat" : pruebas ? "https://pruebas.elc.lat" : "http://localhost";
global.entorno = produccion ? "production" : pruebas ? "test" : "development";

// Variables que toman valores de '.env'
require("dotenv").config();
global.fetch = require("node-fetch");
global.anoELC = process.env.anoELC;
global.versionElc = process.env.versionElc;
global.carpetaPublica = path.join(__dirname, "publico");
global.carpetaExterna = path.join(__dirname, "..", process.env.carpetaExterna);

// Otros requires
global.express = require("express");
const app = express();
global.fs = require("fs");
global.carpsImagsEpocaDelAno = fs.readdirSync(carpetaExterna + "4-EpocasDelAno");

// Base de datos
global.config = require("./baseDeDatos/config/config.js")[entorno];
global.Sequelize = require("sequelize");
global.sequelize = new Sequelize(config.database, config.username, config.password, config);
global.db = require("./baseDeDatos/tablas"); // tiene que ir después de 'fs', porque el archivo 'index' usa 'fs'
global.Op = db.Sequelize.Op;

// Crea carpetas públicas - omit the first arg if you do not want the '/public' prefix for these assets
app.use("/publico", express.static(carpetaPublica));
app.use("/Externa", express.static(carpetaExterna));

// Otros
app.use(express.urlencoded({extended: false})); // Para usar archivos en los formularios (Multer)
app.use(express.json()); // ¿Para usar JSON con la lectura y guardado de archivos?
// Para usar PUT y DELETE
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
// Para usar la propiedad "session"
const session = require("express-session");
app.use(session({secret: "keyboard cat", resave: false, saveUninitialized: false}));
// Para usar cookies
const cookies = require("cookie-parser");
app.use(cookies());

// Para saber el recorrido de los url
// const morgan = require('morgan');
// morgan.token("custom", ":method :url => Tiempo: :total-time[0]ms / :response-time[0]ms (:status)") //Create a new named format
// app.use(morgan("custom")) // use the new format by name

// Para conectarse con el servidor
const PORT = entorno == "development" ? "80" : process.env.PORT;
app.listen(PORT, () => console.log("Servidor funcionando..."));

// Todas las carpetas donde se almacenan vistas
app.set("view engine", "ejs"); // Terminación de los archivos de vista
app.set("views", [
	...["./vistas/0-Compartido", "./vistas/0-Compartido/Header", "./vistas/0-Compartido/Main"],
	...["./vistas/1.1-Usuarios", "./vistas/1.1-Usuarios/Includes"],
	...["./vistas/1.2-Rev-Usuarios", "./vistas/1.2-Rev-Usuarios/Includes"],
	...["./vistas/2.0-Familias", "./vistas/2.0-Familias/Iconos", "./vistas/2.0-Familias/Includes"],
	...["./vistas/2.1-Prods-Agregar", "./vistas/2.1-Prods-Agregar/Includes"],
	...["./vistas/2.1-Prods-RUD", "./vistas/2.1-Prods-RUD/Includes"],
	...["./vistas/2.2-RCLVs", "./vistas/2.2-RCLVs/Includes"],
	...["./vistas/2.3-Links", "./vistas/2.3-Links/Includes"],
	...["./vistas/3-Rev-Entidades", "./vistas/3-Rev-Entidades/Includes"],
	...["./vistas/5-Consultas", "./vistas/5-Consultas/Includes"],
	...["./vistas/6-Graficos"],
	...["./vistas/7-Institucional", "./vistas/7-Institucional/Includes"],
]);

// Procesos que requieren de 'async' y 'await'
(async () => {
	// Variables que dependen de las lecturas de BD
	global.baseDeDatos = require("./funciones/BaseDatos");
	const varsBD = require("./variables/BaseDatos.js");
	const lecturasDeBd = await varsBD.lecturasDeBd();
	for (let campo in lecturasDeBd) global[campo] = lecturasDeBd[campo]; // asigna una variable a cada lectura
	const datosPartics = await varsBD.datosPartics();
	for (let campo in datosPartics) global[campo] = datosPartics[campo]; // asigna una variable a valores específicos

	// Variables que requieren 'require'
	global.variables = require("./variables/Depends.js");
	global.comp = require("./funciones/Compartidas"); // tiene que ir antes que las BD
	global.rutinasJson = lecturaRutinasJSON();
	global.ImagenesDerecha = rutinasJson.ImagenesDerecha;

	// Filtros con 'default'
	global.filtrosConDefault = {};
	for (let prop in variables.filtrosCons)
		if (variables.filtrosCons[prop].default) filtrosConDefault[prop] = variables.filtrosCons[prop].default;

	// Procesos que dependen de la variable 'global'
	const rutinas = require("./rutinas/RT-Control");
	await rutinas.startupMasConfiguracion();

	// Middlewares transversales
	app.use(require("./middlewares/transversales/urlsUsadas-Session")); // tiene que estar antes de 'bienvenido', porque esa vista usa un url de session
	app.use(require("./middlewares/transversales/clientes-0Bienvenido")); // para filtrar los 'bots'
	app.use(require("./middlewares/transversales/clientes-1Cliente")); // para obtener el cliente y usuario
	app.use(require("./middlewares/transversales/clientes-2Contador")); // para contar la cantidad de días de navegación
	app.use(require("./middlewares/transversales/clientes-3Carteles")); // en función de las novedades, revisa si se debe mostrar algún cartel
	app.use(require("./middlewares/transversales/urlsUsadas-BD")); // para guardar los url navegados

	// Vistas - Antiguas
	app.use("/producto", require("./rutasContrs/2.1-Prods-RUD/PR-RutasAnt"));
	app.use("/rclv", require("./rutasContrs/2.2-RCLVs/RCLV-RutasAnt"));
	app.use("/links", require("./rutasContrs/2.3-Links/LK-RutasAnt"));

	// Vistas - Con base definida
	app.use("/usuarios", require("./rutasContrs/1.1-Usuarios/US-Rutas"));
	app.use("/revision", require("./rutasContrs/3-Rev-Entidades/RE-Rutas"));
	app.use("/revision-us", require("./rutasContrs/1.2-Rev-Usuarios/RU-Rutas")); // revisarlo el día que se use
	app.use("/consultas", require("./rutasContrs/5-Consultas/CN-Rutas"));
	app.use("/graficos", require("./rutasContrs/6-Graficos/GR-Rutas"));
	app.use("/institucional", require("./rutasContrs/7-Institucional/IN-Rutas"));

	// Vistas - Por entidad
	app.use("/:entidad", require("./rutasContrs/2.0-Familias/FM-Rutas")); // incluye algunas de 'revisión' y corrección
	app.use("/:entidad", require("./rutasContrs/2.1-Prods-Agregar/PA-Rutas")); // producto
	app.use("/:entidad", require("./rutasContrs/2.1-Prods-RUD/PR-Rutas")); // producto
	app.use("/:entidad", require("./rutasContrs/2.2-RCLVs/RCLV-Rutas")); // rclv
	app.use("/:entidad", require("./rutasContrs/2.3-Links/LK-Rutas")); // producto y link
	app.use("/", require("./rutasContrs/9-Miscelaneas/MS-Rutas"));

	// Middlewares transversales
	app.use(require("./middlewares/transversales/urlDesconocida")); // Si no se reconoce el url - se debe informar después de los urls anteriores
})();

// Funciones
const lecturaRutinasJSON = () => {
	// Obtiene información del archivo 'json'
	const rutaNombre = path.join(__dirname, "/rutinas/Rutinas.json");
	const existe = comp.gestionArchivos.existe(rutaNombre);
	const json = existe ? fs.readFileSync(rutaNombre, "utf8") : "";
	const info = json ? JSON.parse(json) : {};

	// Fin
	return info;
};
