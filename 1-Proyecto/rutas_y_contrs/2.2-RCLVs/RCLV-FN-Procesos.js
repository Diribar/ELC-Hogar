"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");

module.exports = {
	prodsDelRclv: {
		// Revisados
		agregaProdsDesdeEdicsRclv: async (rclv, usuario_id) => {
			// Si no existe un usuario, interrumpe la función
			if (!usuario_id || !rclv.prodsEdiciones || !rclv.prodsEdiciones.length) return rclv;

			// Obtiene las ediciones propias de productos vinculadas con el rclv, y si no hay interrumpe la función
			const edicsPropias = rclv.prodsEdiciones.find((n) => n.editadoPor_id == usuario_id);
			if (!edicsPropias.length) return rclv;

			for (let edicion of edicsPropias) {
				// Obtiene la entidad con la que está asociada la edición del rclv, y su campo 'producto_id'
				const entProd = comp.obtieneDesdeCampo_id.entidadProd(edicion);
				const campo_id = comp.obtieneDesdeEntidad.campo_id(entProd);
				const entId = edicion[campo_id];

				// Genera la variable del producto y lo agrega
				const producto = {id: entId};
				rclv[entProd] ? rclv[entProd].push(producto) : (rclv[entProd] = [producto]);
			}

			// Elimina las ediciones
			delete rclv.prodsEdiciones;

			// Fin
			return rclv;
		},
		consolidaLosProds: async (rclv, usuario_id) => {
			// Variables
			let prodsDelRclv = [];

			// Une los productos en una sola array
			for (const entidad of variables.entidades.prods) {
				if (rclv[entidad])
					for (let producto of rclv[entidad]) {
						// Obtiene el registro del producto original y su edición por el usuario
						const [prodOrig, prodEdic] = await procsFM.obtieneOriginalEdicion({
							entidad,
							entId: producto.id,
							usuario_id,
							excluirInclude: true,
						});

						// Actualiza la variable del registro original
						producto = {...prodOrig, ...prodEdic, id: prodOrig.id};

						// Agrega el producto al consolidado, con filtros
						if (
							aprobados_ids.includes(producto.statusRegistro_id) || // status inactivar o inactivo
							(producto.statusSugeridoPor_id == usuario_id &&
								[creado_id, recuperar_id].includes(producto.statusRegistro_id)) // status creado o recuperar
						)
							prodsDelRclv.push({...producto, entidad});
					}
			}

			// Si no existen productos, interrumpe la función
			if (!prodsDelRclv.length) return [];

			// Quita los capitulos cuyas colecciones están presentes
			const colecciones = prodsDelRclv.filter((n) => n.entidad == "colecciones");
			const coleccionesId = colecciones.map((n) => n.id);
			const capitulos = prodsDelRclv
				.filter((n) => n.entidad == "capitulos")
				.filter((n) => !coleccionesId.includes(n.coleccion_id));

			// Consolida los productos
			const noCapitulos = prodsDelRclv.filter((n) => n.entidad != "capitulos");
			prodsDelRclv = [...capitulos, ...noCapitulos];

			// Ordena por año (decreciente)
			prodsDelRclv.sort((a, b) => b.anoEstreno - a.anoEstreno);

			// Fin
			return prodsDelRclv;
		},
		agregaInfoALosProds: async (productos, usuario_id) => {
			// Si no existen productos, interrumpe la función
			if (!productos) return [];

			// Variables
			const pppRegs = usuario_id
				? await baseDeDatos.obtieneTodosPorCondicion("pppRegistros", {usuario_id}, "detalle")
				: null;

			// Completa la información de cada tipo de producto
			productos.forEach((producto, i) => {
				// Variables
				const {entidad} = producto;
				const avatar = procsFM.obtieneAvatar(producto).edic; // es indistinto 'orig' y 'edic', porque no existe la variable 'edición'
				const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
				if (producto.direccion.includes(",")) producto.direccion = producto.direccion.split(", ").splice(2).join(", ");

				// Preferencia por usuario
				let ppp;
				if (usuario_id) {
					const pppReg = pppRegs.find((n) => n.entidad == entidad && n.entidad_id == producto.id);
					ppp = pppReg ? pppReg.detalle : pppOpcsObj.sinPref;
				}
				// Agrega datos
				productos[i] = {...producto, avatar, entidadNombre, ppp};
			});

			// Fin
			return productos;
		},
		fueraDeConsulta: (productos, prodsCons) => {
			// Obtiene los prodsCons
			if (prodsCons)
				try {
					prodsCons = JSON.parse(prodsCons);
				} catch (error) {
					prodsCons = null;
				}

			// Si no hay prodsCons, interrumpe la función
			if (!prodsCons) return productos;

			// Filtra por los prods del url
			productos = productos.map((producto) => {
				// Si no se encuentra la combinación 'entidad - id', lo marca para ocultar
				if (!prodsCons.some(([urlEnt, urlId]) => producto.entidad == urlEnt && producto.id == urlId))
					producto.fueraDeConsulta = true;

				// Fin
				return producto;
			});

			// Fin
			return productos;
		},
	},
	altaEdicForm: {
		tipoFecha_id: (dataEntry, entidad) => {
			return false
				? false
				: dataEntry.fechaMovil
				? "FM"
				: dataEntry.fechaDelAno_id == 400
				? "SF"
				: dataEntry.fechaDelAno_id && dataEntry.fechaDelAno_id < 400
				? "FD"
				: entidad == "personajes" || entidad == "hechos"
				? "FD"
				: entidad == "eventos" || entidad == "epocasDelAno"
				? "FM"
				: entidad == "temas"
				? "SF"
				: "";
		},
		prioridad_id: (dataEntry, entidad) => {
			let prioridad = {};
			for (let elemento of prioridadesRclv) prioridad[elemento.codigo] = elemento.id;

			return entidad == "personajes"
				? prioridad.estandar
				: entidad == "hechos"
				? dataEntry.soloCfc
					? prioridad.estandar
					: prioridad.menor
				: entidad == "temas"
				? prioridad.menor
				: entidad == "eventos"
				? dataEntry.soloCfc
					? prioridad.mayor
					: prioridad.menor
				: entidad == "epocasDelAno"
				? prioridad.menor
				: "";
		},
		opcsLeyNombre: (registro) => {
			// Variables
			const {nombre, nombreAltern, rolIglesia_id} = registro;
			let opciones = [];

			// Opciones para personajes
			if (registro.personajes) {
				// Nombre
				opciones.push(...opcsLeyNombrePers.consolidado(nombre, registro));
				// Nombre alternativo - se omite si no existe o si fue 'papa'
				if (nombreAltern && rolIglesia_id != "PP")
					opciones.push(...opcsLeyNombrePers.consolidado(nombreAltern, registro));
			}

			// Opciones para hechos
			else if (registro.hechos) {
				opciones.push(nombre);
				if (nombreAltern) opciones.push(nombreAltern);
			}

			// Ordena las opciones alfabéticamente
			opciones.sort((a, b) => (a < b ? -1 : 1));

			// Fin
			return opciones;
		},
		ayudas: (entidad) => {
			const nombre = ["personajes", "hechos"].includes(entidad)
				? [
						"El nombre <span>formal</span> es su nombre religioso (o civil si no tiene uno), sin títulos ni palabras ajenas a su nombre.",
						"El nombre <span>alternativo</span> es opcional, y se completa sólo si se lo/la conoce de otra manera.",
				  ]
				: [
						"Si vas a ingresar una Aparición Mariana, necesitamos que lo hagas con el formato: <em><b>Ap. Mar. - Guadalupe</b></em>, donde <em>Guadalupe</em> sería el lugar donde apareció o el nombre de la advocación.",
				  ];
			const fecha =
				entidad == "personajes"
					? [
							"Para los santos o beatos, se usa la fecha del santoral (Novus Ordo).",
							"Para los demás, suele ser la fecha de su muerte.",
					  ]
					: ["Si es un hecho sin una fecha definida, se usa aquella en la que comenzó a ocurrir"];
			const prioridad =
				entidad == "personajes"
					? ["Estándar", "Mayor importancia: Sagrada Familia, San José, María, Jesús"]
					: entidad == "hechos"
					? [
							"VPC: Menor Importancia",
							"CFC: Estándar",
							"Mayor importancia: algunos como Navidad, Bautismo de nuestro Señor, cada día de Semana Santa, Ascensión del Señor, Pentecostés",
					  ]
					: entidad == "temas"
					? ["Menor Importancia"]
					: entidad == "eventos"
					? ["VPC: Menor Importancia", "CFC: Mayor importancia"]
					: entidad == "epocasDelAno"
					? ["Menor Importancia", "Mayor importancia: algunas cortas como Semana Santa y Adviento"]
					: [""];
			const epoca =
				"Si transcurre durante varias épocas, desdoblá el hecho en varios, cada uno con su correspondiente época.";
			const ano = [
				"Se refiere al año en que " + (entidad == "personajes" ? "nació" : "ocurrió, o comenzó a ocurrir") + ".",
				"Si no lo encontrás, poné un valor estimado.",
			];

			// Fin
			return {nombre, fecha, prioridad, epoca, ano};
		},
	},
	altaEdicGuardar: {
		procesaLosDatos: (datos) => {
			// Variables
			const {tipoFecha, mes_id, dia, plural_id, entidad} = datos;
			let DE = {};

			// Obtiene los datos que se guardan en la tabla
			const campos = variables.camposRevisar.rclvs.filter((n) => n.rclvs || n[datos.entidad]).map((n) => n.nombre);
			for (let campo of campos) DE[campo] = datos[campo] ? datos[campo] : null;
			if (entidad == "personajes" && !DE.nombreAltern) DE.nombreAltern = "";

			// Variables con procesos
			DE.fechaDelAno_id = tipoFecha == "SF" ? 400 : fechasDelAno.find((n) => n.mes_id == mes_id && n.dia == dia).id;
			DE.fechaMovil = tipoFecha == "FM";
			DE.comentarioMovil = DE.fechaMovil ? DE.comentarioMovil : null;
			DE.anoFM = DE.fechaMovil ? Number(DE.anoFM) : null;
			if (DE.prioridad_id) DE.prioridad_id = Number(DE.prioridad_id);
			if (DE.genero_id)
				DE.genero_id =
					(typeof DE.genero_id == "string" ? DE.genero_id : Array.isArray(DE.genero_id) ? DE.genero_id.join("") : "") +
					(plural_id ? plural_id : "S");

			// Variables con procesos en personajes
			if (entidad == "personajes") {
				// Variables
				const CFC = DE.categoria_id == "CFC";
				const {epocaOcurrencia_id, anoNacim, rolIglesia_id, apMar_id} = datos;
				const epocaPosterior = epocaOcurrencia_id == "pst";

				// Variables con procesos
				DE.canon_id = CFC ? DE.canon_id : "NN";
				DE.anoNacim = epocaPosterior ? anoNacim : null;
				DE.rolIglesia_id = CFC ? rolIglesia_id : "NN";
				DE.apMar_id = CFC && epocaPosterior && parseInt(anoNacim) > 1100 ? apMar_id : sinApMar_id;
			}

			// Variables con procesos en hechos
			if (entidad == "hechos") {
				// Variables
				const {epocaOcurrencia_id, anoComienzo, soloCfc, ama} = datos;

				// Variables con procesos
				DE.anoComienzo = epocaOcurrencia_id == "pst" ? anoComienzo : null;
				DE.soloCfc = Number(soloCfc);
				DE.ama = soloCfc == "1" ? Number(ama) : 0;
			}

			// Fin
			return DE;
		},
		guardaLosCambios: async (req, res, DE) => {
			// Variables
			const {tarea, entidad} = comp.partesDelUrl(req);
			const {origen} = req.query;
			let {id} = req.query; // Si es un 'agregar', el 'id' es undefined
			const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
			const usuario_id = req.session.usuario.id;
			const codigo = req.baseUrl + req.path;
			let original, edicion, edicN;

			// Tareas para un nuevo registro
			if (tarea == "/agregar") {
				// Guarda el nuevo registro
				DE.creadoPor_id = usuario_id;
				DE.statusSugeridoPor_id = usuario_id;
				original = await baseDeDatos.agregaRegistroIdCorrel(entidad, DE);
				id = original.id;

				// Les agrega el 'rclv_id' a session y cookie de origen
				if (origen == "PDA") {
					req.session.datosAdics = req.session.datosAdics ? req.session.datosAdics : req.cookies.datosAdics;
					req.session.datosAdics = {...req.session.datosAdics, [campo_id]: id};
					res.cookie("datosAdics", req.session.datosAdics, {maxAge: unDia});
				} else if (origen == "PED") {
					req.session.edicProd = req.session.edicProd ? req.session.edicProd : req.cookies.edicProd;
					req.session.edicProd = {...req.session.edicProd, [campo_id]: id};
					res.cookie("edicProd", req.session.edicProd, {maxAge: unDia});
				}
			}
			// Tareas para edición
			else if (tarea == "/edicion") {
				// Obtiene el registro original
				original = await baseDeDatos.obtienePorId(entidad, id, ["statusRegistro", "ediciones"]);
				edicion = original.ediciones.find((n) => n[campo_id] == id && n.editadoPor_id == usuario_id);

				// Si es un registro propio y en status creado, actualiza el registro original
				if (original.creadoPor_id == usuario_id && original.statusRegistro_id == creado_id)
					await baseDeDatos.actualizaPorId(entidad, id, DE);
				// Si no esta en status 'creado', guarda la edición
				else edicN = await procsFM.guardaActEdic({entidad, original, edicion: {...edicion, ...DE}, usuario_id});
			}

			// Fin
			return {original, edicion, edicN};
		},
	},
};

// Funciones
const opcsLeyNombrePers = {
	consolidado: function (nombre, registro) {
		// Variables
		const {genero_id, rolIglesia_id} = registro;
		let opciones = [];
		const genero = generos.find((n) => n.id == genero_id);
		if (!genero) return [];

		// Canon
		if (rolIglesia_id != "PP") opciones.push(this.canonAlPrinc(nombre, registro, genero));
		opciones.push(...this.canonAlFinal(nombre, registro, genero));

		// Fin
		return opciones;
	},
	canonAlPrinc: function (nombre, registro, genero) {
		// Variables
		const {genero_id, canon_id} = registro;
		let canon = this.obtieneCanon(genero_id, canon_id);

		// Trabajo sobre 'canon'
		if (canon) {
			const primerNombre = nombre.split(" ")[0];
			if (canon == "santo" && !prefijosSanto.includes(primerNombre)) canon = "san"; // si corresponde, lo conmvierte en 'san'
			if (canon_id == "ST") canon = "a " + canon;
			else canon = (genero_id == "MS" ? "al" : "a " + genero.loLa) + " " + canon; // le agrega el artículo antes
			canon += " ";
		} else canon = "";

		// Fin
		return canon + nombre;
	},
	canonAlFinal: function (nombre, registro, genero) {
		// Variables
		const {genero_id, canon_id, rolIglesia_id} = registro;
		const canon = this.obtieneCanon(genero_id, canon_id, nombre);
		let opciones = [];
		let frase = "";

		// Singular
		frase += (rolIglesia_id == "PP" ? "al papa " : "a ") + nombre;
		if (frase.startsWith("a El ")) frase = frase.replace("a El ", "al ");
		if (frase.startsWith("a La ")) frase = frase.replace("a La ", "a la ");
		if (canon) frase += ", " + canon;
		opciones.push(frase);

		// Sacerdote
		if (rolIglesia_id == "SC") {
			frase = "al padre " + nombre;
			if (canon) frase += ", " + canon;
			opciones.push(frase);
		}

		// Apóstol
		if (rolIglesia_id == "AP") {
			frase = (!genero_id.includes("P") ? "al apóstol " : "a los apóstoles ") + nombre;
			if (canon) frase += ", " + canon;
			opciones.push(frase);
		}

		// Plural
		if (genero_id.includes("P")) {
			frase = "a " + genero.loLa + " " + nombre;
			if (canon) frase += ", " + canon;
			opciones.push(frase);
		}

		// Fin
		return opciones;
	},
	obtieneCanon: (genero_id, canon_id) => {
		// Obtiene el avance de su proceso de canonización
		let canon = canon_id && canon_id != "NN" ? canons.find((n) => n.id == canon_id)[genero_id] : null;

		// Pone en minúscula su primera letra
		if (canon) canon = canon.slice(0, 1).toLowerCase() + canon.slice(1);

		// Fin
		return canon;
	},
};
