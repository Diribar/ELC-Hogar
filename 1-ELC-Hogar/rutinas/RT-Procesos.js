"use strict";

module.exports = {
	// Interacciones con el archivo Rutinas.json
	guardaArchivoDeRutinas: function (datos, menu) {
		// Obtiene la informacion vigente
		let info = {...rutinasJson};

		// Averigua si hubo alguna novedad
		let sonIguales = true;
		for (let prop in datos) {
			// Variable
			const datoNuevo = datos[prop];
			const datoGuardado = info[prop];

			// Si los datos son iguales, saltea los controles posteriores
			if (datoNuevo == datoGuardado) continue;
			// De lo contrario, avisa que son distintos
			else if (!datoGuardado) sonIguales = false;
			// String - varios casos
			else if (typeof datoNuevo == "string") sonIguales = false;
			// Array - RutinasHorarias
			else if (Array.isArray(datoNuevo)) {
				if (!Array.isArray(datoGuardado)) sonIguales = false;
				else if (datoNuevo.length != datoGuardado.length) sonIguales = false;
				else if (datoNuevo.some((n) => !datoGuardado.includes(n))) sonIguales = false;
			}
			// Objeto - 'RutinasDiarias' y 'RutinasSemanales' / la de 'ImagenesDerecha' se revisa en una función anterior a esta rutina
			else if (Array.isArray(datoGuardado)) sonIguales = false; // Revisa si el original no es un objeto
			else {
				// Variables
				const camposNuevo = Object.keys(datoNuevo);
				const camposGuardado = Object.keys(datoGuardado);

				// Revisa que tengan la misma cantidad de campos
				if (camposNuevo.length != camposGuardado.length) sonIguales = false;
				// Revisa que tengan el mismo valor de string
				else if (camposNuevo.some((n) => datoNuevo[n] != datoGuardado[n])) sonIguales = false;
			}

			// Fin
			if (!sonIguales) break;
		}

		// Si no hubo ninguna novedad, sale de la función
		if (sonIguales) return true;

		// Actualiza la información
		info = menu ? {...info, [menu]: {...info[menu], ...datos}} : {...info, ...datos};

		// Guarda la información actualizada
		const rutaNombre = path.join(__dirname, "Rutinas.json");
		rutinasJson = {...info};
		fs.writeFileSync(rutaNombre, JSON.stringify(info), (err) => {
			if (err) console.log("Actualiza Rutinas JSON:", err, datos);
			return;
		});

		// Fin
		return false;
	},

	// Imagen Derecha
	borraLosArchivosDeImgDerechaObsoletos: (fechas) => {
		// Variables
		const carpetaImagen = "./publico/imagenes/ImagenDerecha/";
		const archivosDeImagen = fs.readdirSync(carpetaImagen);

		// Revisa si corresponde borrar los archivos
		for (let archivo of archivosDeImagen) {
			let dot = archivo.lastIndexOf(".");
			if (dot < 0) dot = archivo.length;

			if (!fechas.includes(archivo.slice(0, dot))) comp.gestionArchivos.elimina(carpetaImagen, archivo);
		}

		// Fin
		return;
	},
	obtieneImgDerecha: async (fechaNum) => {
		// Variables
		const fecha = new Date(fechaNum);

		// Obtiene la 'fechaDelAno_id'
		const dia = fecha.getDate();
		const mes_id = fecha.getMonth() + 1;
		const fechaDelAno = fechasDelAno.find((n) => n.dia == dia && n.mes_id == mes_id);
		delete fechaDelAno.epocaDelAno; // quita el include

		// Obtiene los rclvs
		const rclvs = await FN_obtieneImgDerecha.obtieneLosRclvs(fechaDelAno);

		// Acciones si se encontraron varios rclvs
		const resultado = FN_obtieneImgDerecha.reduceRclvs(rclvs);

		// Obtiene los datos de la imgDerecha
		const imgDerecha = FN_obtieneImgDerecha.datosImgDerecha(resultado);

		// Fin
		return imgDerecha;
	},
	diaMesAnoUTC: (fecha) => {
		fecha = new Date(fecha);
		const dia = ("0" + fecha.getUTCDate()).slice(-2);
		const mes = mesesAbrev[fecha.getUTCMonth()];
		const ano = fecha.getUTCFullYear().toString().slice(-2);
		fecha = dia + "-" + mes + "-" + ano;
		return fecha;
	},
	ABM_noRevs: async () => {
		// Variables
		const statusProvisorios = [creado_id, inactivar_id, recuperar_id];
		let entsProdsRclvs, include, condicion;

		// regsPERL
		condicion = {statusRegistro_id: statusProvisorios, statusSugeridoPor_id: {[Op.ne]: usAutom_id}};
		entsProdsRclvs = [...variables.entidades.prodsRclvs];
		include = "statusSugeridoPor";
		let regsPERL = [];
		for (let entidad of entsProdsRclvs) {
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const registros = baseDeDatos
				.obtieneTodosPorCondicion(entidad, condicion, include)
				.then((regs) => regs.filter((reg) => !rolesRevPERL_ids.includes(reg.statusSugeridoPor.rolUsuario_id)))
				.then((regs) => regs.map((reg) => ({...reg, entidad, familia})));
			regsPERL.push(registros);
		}
		regsPERL = await Promise.all(regsPERL).then((n) => n.flat());

		// edicsPERL
		entsProdsRclvs = ["prodsEdicion", "rclvsEdicion"];
		include = {prodsEdicion: variables.entidades.prodsAsoc, rclvsEdicion: variables.entidades.rclvsAsoc};
		let edicsPERL = [];
		for (let entPERL of entsProdsRclvs) {
			const registros = baseDeDatos
				.obtieneTodos(entPERL, ["editadoPor", ...include[entPERL]])
				.then((edics) => edics.filter((edic) => !rolesRevPERL_ids.includes(edic.editadoPor.rolUsuario_id)))
				.then((edics) =>
					edics.map((edic) => {
						const asociacion = comp.obtieneDesdeCampo_id.asociacion(edic);
						const entidad = comp.obtieneDesdeCampo_id.entidad(edic, entPERL);
						const familia = comp.obtieneDesdeEntidad.familia(entidad);
						return {...edic[asociacion], entidad, familia};
					})
				)
				.then((prods) => prods.filter((prod) => !statusProvisorios.includes(prod.statusRegistro_id)));
			edicsPERL.push(registros);
		}
		edicsPERL = await Promise.all(edicsPERL).then((n) => n.flat());

		// regsLinks
		condicion = {...condicion, prodAprob: true};
		include = ["statusSugeridoPor", ...variables.entidades.prodsAsoc];
		const regsLinks = await baseDeDatos
			.obtieneTodosPorCondicion("links", condicion, include)
			.then((links) => links.filter((link) => !rolesRevLinks_ids.includes(link.statusSugeridoPor.rolUsuario_id)))
			.then((links) =>
				links.map((link) => {
					const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(link);
					const entidad = comp.obtieneDesdeCampo_id.entProd(link);
					return {...link[prodAsoc], entidad, familia: "links"};
				})
			)
			.then((prods) => comp.eliminaRepetidos(prods));

		// edicsLinks
		include = ["editadoPor", ...variables.entidades.prodsAsoc];
		const edicsLinks = await baseDeDatos
			.obtieneTodos("linksEdicion", include)
			.then((edics) => edics.filter((edic) => !rolesRevPERL_ids.includes(edic.editadoPor.rolUsuario_id)))
			.then((edics) =>
				edics.map((edic) => {
					const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(edic);
					const entidad = comp.obtieneDesdeCampo_id.entProd(edic);
					return {...edic[prodAsoc], entidad, familia: "links"};
				})
			)
			.then((prods) => comp.eliminaRepetidos(prods));

		// Fin
		return {regs: {perl: regsPERL, links: regsLinks}, edics: {perl: edicsPERL, links: edicsLinks}};
	},

	// Borra imágenes obsoletas
	eliminaImagenesProvisorio: () => {
		// Obtiene el nombre de todas las imagenes de los archivos de la carpeta
		let archivos = fs.readdirSync(carpetaExterna + "9-Provisorio");

		// Rutina para borrar archivos
		for (let archivo of archivos) {
			const fechaHora = fs.statSync(carpetaExterna + "9-Provisorio/" + archivo).birthtime;
			if (fechaHora < Date.now() - unDia * 3) comp.gestionArchivos.elimina(carpetaExterna + "9-Provisorio", archivo);
		}

		// Fin
		return;
	},

	// Mail de Feedback
	mailDeFeedback: {
		obtieneElHistorial: async () => {
			// Variables
			let registros = [];
			let condicion;

			// Obtiene los registros de "statusHistorial"
			condicion = {
				statusOriginal_id: [creado_id, inactivar_id, recuperar_id], // descarta los cambios que no sean revisiones
				comunicadoEn: null, // no fue comunicado
			};
			registros.push(
				baseDeDatos
					.obtieneTodosPorCondicion("statusHistorial", condicion)
					.then((n) => n.map((m) => ({...m, tabla: "statusHistorial"})))
			);

			// Obtiene los registros de "edicsHistorial"
			condicion = {comunicadoEn: null};
			registros.push(
				baseDeDatos
					.obtieneTodosPorCondicion("edicsHistorial", condicion, "motivo")
					.then((n) => n.map((m) => ({...m, tabla: "edicsHistorial"}))) // Agrega el nombre de la tabla
			);

			// Espera a que se reciba la info
			const [regsStatus, regsEdic] = await Promise.all(registros);

			// Fin
			return {regsStatus, regsEdic};
		},
		mensajeStatus: async (regsStatus) => {
			// Variables
			let resultados = [];

			// De cada registro de status, obtiene los campos clave o los elabora
			for (let regStatus of regsStatus) {
				// Variables
				const familia = comp.obtieneDesdeEntidad.familia(regStatus.entidad);
				const {nombre, anchor} = await FN_mailDeFeedback.nombres(regStatus);
				if (!nombre) continue;

				// Más variables
				const aprobado =
					([creado_id, recuperar_id].includes(regStatus.statusOriginal_id) &&
						aprobados_ids.includes(regStatus.statusFinal_id)) ||
					(regStatus.statusOriginal_id == inactivar_id && regStatus.statusFinal_id == inactivo_id);
				const altaAprob = regStatus.statusOriginal_id == creado_id && aprobado;
				const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(regStatus.entidad);
				const statusOrigNombre = statusRegistros.find((n) => n.id == regStatus.statusOriginal_id).nombre;
				const statusFinalNombre = statusRegistros.find((n) => n.id == regStatus.statusFinal_id).nombre;

				// Motivo
				let motivo;
				if (!aprobado) {
					const motivoAux = statusMotivos.find((n) => n.id == regStatus.motivo_id);
					motivo = regStatus.comentario ? regStatus.comentario : motivoAux ? motivoAux.descripcion : "";
				}

				// Transforma el resultado
				resultados.push({
					...{familia, entidadNombre, nombre, anchor, altaAprob},
					...{statusOrigNombre, statusFinalNombre, aprobado, motivo},
				});
			}

			// Ordena la información según los campos de mayor criterio, siendo el primero la familia y luego la entidad
			resultados.sort((a, b) => (a.nombre < b.nombre ? -1 : a.nombre > b.nombre ? 1 : 0));
			resultados.sort((a, b) => (a.entidadNombre < b.entidadNombre ? -1 : a.entidadNombre > b.entidadNombre ? 1 : 0));
			resultados.sort((a, b) => (a.familia < b.familia ? -1 : a.familia > b.familia ? 1 : 0));

			// Crea el mensaje
			const mensajeGlobal = FN_mailDeFeedback.creaElMensajeStatus(resultados);

			// Fin
			return mensajeGlobal;
		},
		mensajeEdicion: async (regsEdic) => {
			// Variables
			let resultados = [];
			let mensajesAcum = "";
			let mensajesCampo, mensaje, color;

			// De cada registro, obtiene los campos clave o los elabora
			for (let regEdic of regsEdic) {
				// Variables
				const aprobado = !regEdic.motivo_id;
				const familia = comp.obtieneDesdeEntidad.familia(regEdic.entidad);
				const {nombre, anchor} = await FN_mailDeFeedback.nombres(regEdic);
				if (!nombre) continue;

				// Alimenta el resultado
				resultados.push({
					...{aprobado, familia, nombre, anchor},
					entidadNombre: comp.obtieneDesdeEntidad.entidadNombre(regEdic.entidad),
					entidad_id: regEdic.entidad_id,
					campo: regEdic.titulo,
					valorAprob: regEdic.valorAprob,
					valorDesc: regEdic.valorDesc,
					motivo: !aprobado ? regEdic.motivo.descripcion : "",
				});
			}

			// Ordena la información según los campos de mayor criterio, siendo el primero la familia y luego la entidad
			resultados = FN_mailDeFeedback.ordenarEdic(resultados);

			// Crea el mensaje en formato texto para cada entidad, y sus campos
			resultados.forEach((n, i) => {
				// Acciones por nueva entidad/entidad_id
				if (
					!i ||
					(i && (n.entidadNombre != resultados[i - 1].entidadNombre || n.entidad_id != resultados[i - 1].entidad_id))
				) {
					// Título de la entidad y nombre del producto
					mensaje = n.entidadNombre + ": <b>" + n.anchor + "</b>";
					mensajesAcum += formatos.li(mensaje);
					// Borra los mensajes anteriores que tuviera
					mensajesCampo = "";
				}

				// Adecua la info para el avatar
				if (n.campo == "Avatar") {
					// Variables
					const texto = n.aprobado ? {aprob: "sugerida", desc: "anterior"} : {aprob: "vigente", desc: "sugerida"};
					n.valorAprob = FN_mailDeFeedback.avatarConLink(n.familia, n.valorAprob, texto.aprob);
					n.valorDesc = FN_mailDeFeedback.avatarConLink(n.familia, n.valorDesc, texto.desc);
				}

				// Dots + campo
				mensaje = n.campo + ": ";
				mensaje += n.aprobado
					? n.valorAprob && n.valorDesc
						? "<em><b>" + n.valorAprob + "</b></em> reemplazó a <em>" + n.valorDesc + "</em>"
						: "<em><b>" + n.valorAprob + "</b></em>"
					: "se mantuvo <em><b>" +
					  (n.valorAprob ? n.valorAprob : "(vacío)") +
					  "</b></em> como mejor opción que <em>" +
					  (n.valorDesc ? n.valorDesc : "(vacío)") +
					  "</em>. Motivo: " +
					  n.motivo.toLowerCase();

				color = n.aprobado ? "green" : "firebrick";
				mensajesCampo += formatos.li(mensaje, color);

				// Acciones por fin de la entidad/entidad_id
				if (
					i == resultados.length - 1 ||
					n.entidadNombre != resultados[i + 1].entidadNombre ||
					n.entidad_id != resultados[i + 1].entidad_id
				)
					mensajesAcum += formatos.ul(mensajesCampo);
			});

			// Crea el mensajeGlobal
			const titulo = formatos.h2("Ediciones");
			mensajesAcum = formatos.ol(mensajesAcum);
			const mensajeGlobal = titulo + mensajesAcum;

			// Fin
			return mensajeGlobal;
		},
		mensRevsTablero: ({regs, edics}) => {
			// Variables
			let cuerpoMail = {perl: "", links: ""};
			let registros, prods, rclvs;

			// Productos - Cambios de Status
			registros = regs.perl.filter((n) => n.familia == "producto");
			if (registros.length) {
				cuerpoMail.perl += formatos.h2("Productos");
				prods = true;
				let mensajes = "";
				for (let registro of registros) {
					// Variables
					let mensaje = registro.nombreCastellano ? registro.nombreCastellano : registro.nombreOriginal;

					// Formatos
					mensaje = formatos.a(mensaje, registro);
					mensajes += formatos.li(mensaje);
				}
				cuerpoMail.perl += formatos.ol(mensajes);
			}

			// Productos - Ediciones
			registros = edics.perl.filter((n) => n.familia == "producto");
			if (registros.length) {
				if (!prods) cuerpoMail.perl += formatos.h2("Productos");
				let mensajes = "";
				for (let registro of registros) {
					// Variables
					const operacion = "edicion/";
					let mensaje = registro.nombreCastellano ? registro.nombreCastellano : registro.nombreOriginal;

					// Formatos
					mensaje = formatos.a(mensaje, registro, operacion);
					mensajes += formatos.li(mensaje);
				}
				cuerpoMail.perl += formatos.ol(mensajes);
			}

			// Rclvs - Cambios de Status
			registros = regs.perl.filter((n) => n.familia == "rclv");
			if (registros.length) {
				cuerpoMail.perl += formatos.h2("Rclvs");
				rclvs = true;
				let mensajes = "";
				for (let registro of registros) {
					// Formatos
					let mensaje = formatos.a(registro.nombre, registro);
					mensajes += formatos.li(mensaje);
				}
				cuerpoMail.perl += formatos.ol(mensajes);
			}

			// Rclvs - Ediciones
			registros = edics.perl.filter((n) => n.familia == "rclv");
			if (registros.length) {
				if (!rclvs) cuerpoMail.perl += formatos.h2("Rclvs");
				let mensajes = "";
				for (let registro of registros) {
					// Variables
					const operacion = "edicion/";

					// Formatos
					let mensaje = formatos.a(registro.nombre, registro, operacion);
					mensajes += formatos.li(mensaje);
				}
				cuerpoMail.perl += formatos.ol(mensajes);
			}

			// Links
			registros = [...regs.links, ...edics.links];
			if (registros.length) {
				cuerpoMail.links += formatos.h2("Links");
				let mensajes = "";
				for (let registro of registros) {
					// Variables
					let mensaje = registro.nombreCastellano ? registro.nombreCastellano : registro.nombreOriginal;

					// Formatos
					mensaje = formatos.a(mensaje, registro, "");
					mensajes += formatos.li(mensaje);
				}
				cuerpoMail.links += formatos.ol(mensajes);
			}

			// Fin
			return cuerpoMail;
		},
		eliminaRegs: {
			consolidado: async function ({mailEnv, regsStatusUs, regsEdicUs, usuario}) {
				// Si el mail no fue enviado, lo avisa
				if (!mailEnv) {
					console.log("Mail no enviado a " + email);
					return;
				}

				// Acciones si el mail fue enviado
				if (regsStatusUs.length) await this.histStatus(regsStatusUs); // agrega la fecha de comunicado a los que quedan y elimina los demás
				if (regsEdicUs.length) await this.histEdics(regsEdicUs); // agrega la fecha de comunicado a los que quedan y elimina los demás
				await baseDeDatos.actualizaPorId("usuarios", usuario.id, {fechaRevisores: new Date()}); // actualiza el campo fecha_revisor en el registro de usuario
				if (usuario.id != usAutom_id) console.log("Mail enviado a " + usuario.email);

				// Fin
				return;
			},
			histStatus: async (regs) => {
				// Variables
				const ids = regs.map((n) => n.id);
				const condicion = {
					id: ids,
					statusOriginal_id: creado_id,
					statusFinal_id: aprobados_ids,
				};
				const comunicadoEn = new Date();

				// Elimina los que corresponda
				await baseDeDatos.eliminaPorCondicion("statusHistorial", condicion);

				// Agrega la fecha 'comunicadoEn'
				await baseDeDatos.actualizaPorCondicion("statusHistorial", {id: ids}, {comunicadoEn});

				// Fin
				return;
			},
			histEdics: async (regs) => {
				// Variables
				const comunicadoEn = new Date();

				// Elimina los registros
				for (let reg of regs) {
					// Condición: sin duración
					if (!reg.penalizac || reg.penalizac == "0.0") await baseDeDatos.eliminaPorId(reg.tabla, reg.id);
					else await baseDeDatos.actualizaPorId(reg.tabla, reg.id, {comunicadoEn});
				}

				// Fin
				return;
			},
		},
	},

	// Clientes
	clientes: {
		frecPorCliente: (registros, proximaFecha) => {
			// Quita los clientes futuros
			registros = registros.filter((n) => n.visitaCreadaEn <= proximaFecha);

			// Buena noticia - Más de 30
			let inicio = registros;
			let fin = inicio.filter((n) => n.diasNaveg <= 30);
			const masDeTreinta = inicio.length - fin.length;

			// Buena noticia - Más de 10
			inicio = fin;
			fin = inicio.filter((n) => n.diasNaveg <= 10);
			const onceTreinta = inicio.length - fin.length;

			// Problema - tres a diez
			inicio = fin;
			fin = inicio.filter((n) => n.diasNaveg < 3);
			const tresDiez = inicio.length - fin.length;

			// Problema - Uno o dos
			inicio = fin;
			const haceUnMes = comp.fechaHora.anoMesDia(new Date(proximaFecha).getTime() - unMes);
			fin = inicio.filter((n) => n.fechaUltNaveg > haceUnMes);
			const unoDos = fin.length;

			// Fin
			return {masDeTreinta, onceTreinta, tresDiez, unoDos};
		},
		cantNavegsMensual: async () => {
			// Variables
			let revisar = await baseDeDatos.obtieneTodos("persWebDiaAcum");
			if (!revisar.length) return;
			const anoMesUlt = revisar[revisar.length - 1].anoMes; // obtiene el añoMes del último registro
			let promedios = {};

			// Rutina
			while (true) {
				// Averigua si en el acumulado hay días de meses anteriores y que además tengan fecha
				const hallazgo = revisar.find((n) => n.anoMes < anoMesUlt && n.fecha);

				// Si no los hay, interrumpe la función
				if (!hallazgo) break;

				// Obtiene el año-mes del día más antiguo
				const anoMesAntiguo = hallazgo.anoMes;

				// Obtiene la cantidad de registros de ese año mes
				const regsParaProcesar = revisar.filter((n) => n.fecha && n.fecha.startsWith(anoMesAntiguo));

				// Obtiene los promedios
				const totales = regsParaProcesar.reduce(({logins, usSinLogin, visitas}, reg) => ({
					logins: logins + reg.logins,
					usSinLogin: usSinLogin + reg.usSinLogin,
					visitas: visitas + reg.visitas,
				}));
				const cantRegs = regsParaProcesar.length;
				for (let metodo in totales) promedios[metodo] = Math.round(totales[metodo] / cantRegs);

				// Elimina los registros de ese año-mes
				await baseDeDatos.eliminaPorCondicion("persWebDiaAcum", {anoMes: anoMesAntiguo});

				// Agrega un registro con los promedios
				await baseDeDatos.agregaRegistroIdCorrel("persWebDiaAcum", {anoMes: anoMesAntiguo, ...promedios});

				// Fin
				revisar = revisar.filter((n) => n.anoMes != anoMesAntiguo);
			}

			// Fin
			return;
		},
		cantClientesMensual: async () => {
			// Variables
			let revisar = await baseDeDatos.obtieneTodos("persBdDiaAcum");
			if (!revisar.length) return;
			const anoMesUlt = revisar[revisar.length - 1].anoMes;

			// Rutina
			while (true) {
				// Averigua si en el acumulado hay días de meses anteriores
				const hallazgo = revisar.find((n) => n.anoMes < anoMesUlt && n.fecha);

				// Si no los hay, interrumpe la función
				if (!hallazgo) break;

				// Obtiene el registro del último día
				const anoMesAntiguo = hallazgo.anoMes;
				const regsParaProcesar = revisar.filter((n) => n.anoMes == anoMesAntiguo);
				const regUltimo = regsParaProcesar[regsParaProcesar.length - 1];

				// Convierte el último registro del mes, en el registro a dejar quitándole la fecha
				await baseDeDatos.actualizaPorId("persBdDiaAcum", regUltimo.id, {fecha: null});

				// Elimina los demás registros de ese mes
				await baseDeDatos.eliminaPorCondicion("persBdDiaAcum", {fecha: {[Op.ne]: null}, anoMes: anoMesAntiguo});

				// Fin
				revisar = revisar.filter((n) => n.anoMes != anoMesAntiguo);
			}

			// Fin
			return;
		},
	},
	navegsDia: {
		porRuta: async (navegsDia) => {
			// Elimina las rutas que correspondan
			let navegsDiaPulido = FN_navegsDia.porRuta(navegsDia);

			// Obtiene la fechaSig
			let fechaSig = await FN_navegsDia.fechaSig("navegsDiaRutaAcum", navegsDiaPulido);

			// Rutina por fecha mientras la fecha sea menor al día vigente
			while (fechaSig < hoy) {
				// Variables
				const fechaTope = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
				const navegsDeUnDia = navegsDiaPulido.filter((ruta) => ruta.fecha >= fechaSig && ruta.fecha < fechaTope); // obtiene las rutas del día

				// Si no hay navegsDeUnDia, aumenta el día y saltea el ciclo
				if (!navegsDeUnDia.length) {
					fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
					continue;
				}

				// Consolida la información
				const consolidado = {};
				for (let naveg of navegsDeUnDia) {
					const ruta = comp.rutasConHistorial(naveg.ruta);
					if (ruta) consolidado[ruta] ? consolidado[ruta]++ : (consolidado[ruta] = 1);
				}

				// Agrega un registro con los valores recogidos
				let espera = [];
				const fecha = fechaSig;
				for (let ruta in consolidado)
					espera.push(baseDeDatos.agregaRegistro("navegsDiaRutaAcum", {fecha, ruta, cant: consolidado[ruta]})); // no importa el orden en el que se guardan dentro del día
				await Promise.all(espera);

				// Actualiza la fecha siguiente
				fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
			}

			// Elimina los registros antiguos
			await FN_navegsDia.eliminaRegsAntiguos("navegsDiaRutaAcum");

			// Fin
			return;
		},
		porProd: async (navegsDia) => {
			// Variables
			let navegsDiaPulido = await FN_navegsDia.porProd(navegsDia);
			let fechaSig = await FN_navegsDia.fechaSig("navegsDiaProdAcum", navegsDiaPulido);

			// Rutina por fecha mientras la fecha sea menor al día vigente
			while (fechaSig < hoy) {
				// Variables
				const fechaTope = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
				const navegsDeUnDia = navegsDiaPulido.filter((ruta) => ruta.fecha >= fechaSig && ruta.fecha < fechaTope); // obtiene las rutas del día

				// Si no hay navegsDeUnDia, aumenta el día e interrumpe el ciclo
				if (!navegsDeUnDia.length) {
					fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
					continue;
				}

				// Consolida la información
				const consolidado = {};
				for (let naveg of navegsDeUnDia) {
					const {entidad, id, nombreCastellano} = naveg;
					const identif = entidad.slice(0, 3).toUpperCase() + id + " - " + nombreCastellano;
					consolidado[identif] ? consolidado[identif]++ : (consolidado[identif] = 1);
				}

				// Agrega un registro con los valores recogidos
				let espera = [];
				const fecha = fechaSig;
				for (let producto in consolidado)
					espera.push(baseDeDatos.agregaRegistro("navegsDiaProdAcum", {fecha, producto, cant: consolidado[producto]})); // no importa el orden en el que se guardan dentro del día
				await Promise.all(espera);

				// Actualiza la fecha siguiente
				fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
			}

			// Elimina los registros antiguos
			await FN_navegsDia.eliminaRegsAntiguos("navegsDiaProdAcum");

			// Fin
			return;
		},
		porHora: async (navegsDia) => {
			// Variables
			let navegsDiaPulido = FN_navegsDia.porHora(navegsDia);

			// Obtiene la fechaSig
			let fechaSig = await FN_navegsDia.fechaSig("navegsDiaHoraAcum", navegsDiaPulido);

			// Rutina por fecha mientras la fecha sea menor al día vigente
			while (fechaSig < hoy) {
				// Variables
				const fechaTope = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
				const navegsDeUnDia = navegsDiaPulido.filter((ruta) => ruta.fecha >= fechaSig && ruta.fecha < fechaTope); // obtiene las rutas del día

				// Consolida la información
				const consolidado = {};
				for (const naveg of navegsDeUnDia)
					consolidado[naveg.hora] ? consolidado[naveg.hora]++ : (consolidado[naveg.hora] = 1);

				// Agrega un registro por hora
				for (let hora = 0; hora < 24; hora++) {
					const fecha = fechaSig;
					const diaSem = comp.fechaHora.diaSem(fechaSig);
					const cant = consolidado[hora] ? consolidado[hora] : 0;
					const datos = {fecha, diaSem, hora, cant};
					await baseDeDatos.agregaRegistro("navegsDiaHoraAcum", datos); // importa el orden en el que se guarda dentro del día
				}

				// Actualiza la fecha siguiente
				fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
			}

			// Elimina los registros antiguos
			await FN_navegsDia.eliminaRegsAntiguos("navegsDiaHoraAcum");

			// Fin
			return;
		},
	},

	// Funciones - Otras
	variablesDiarias: () => {
		// Startup
		anoHoy = new Date().getUTCFullYear();
		const dia = new Date().getUTCDate();
		const mes = new Date().getUTCMonth() + 1;
		fechaDelAnoHoy_id = fechasDelAno.find((n) => n.dia == dia && n.mes_id == mes).id;

		// Fin
		return;
	},
	fechaHoraUTC: () => {
		// Obtiene la fecha y la hora y las procesa
		const ahora = new Date();
		const FechaUTC = diasSemana[ahora.getUTCDay()] + ". " + comp.fechaHora.diaMes(ahora);
		const HoraUTC = ahora.getUTCHours() + ":" + ("0" + ahora.getUTCMinutes()).slice(-2);

		// Fin
		return {FechaUTC, HoraUTC};
	},
	obtieneLaHora: (dato) => {
		// Obtiene la ubicación de los dos puntos
		const ubicDosPuntos = dato.indexOf(":");
		if (ubicDosPuntos < 1) return 0;

		// Obtiene la hora
		let hora = dato.slice(0, ubicDosPuntos);
		hora = parseInt(hora);

		// Fin
		return hora;
	},
	finRutinasHorarias: function (campo, duracion) {
		// Variables
		duracion = duracion.toLocaleString("pt"); // 'es' no coloca el separador de miles
		const {FechaUTC, HoraUTC} = this.fechaHoraUTC();

		// Feedback del proceso
		console.log(FechaUTC, HoraUTC + "hs. -", (duracion + "ms").padStart(7, " "), "-", campo);

		// Fin
		return;
	},
	finRutinasDiariasSemanales: function (campo, duracion, menu) {
		// Variables
		duracion = duracion.toLocaleString("pt"); // 'pt' fue la opción encontrada que coloca el separador de miles
		const {FechaUTC, HoraUTC} = this.fechaHoraUTC();

		// Averigua si hubieron novedades
		const sonIguales = this.guardaArchivoDeRutinas({[campo]: "SI"}, menu);
		const novedades = sonIguales ? ", sin novedades" : "";

		// Feedback del proceso
		console.log(FechaUTC, HoraUTC + "hs. -", (duracion + "ms").padStart(7, " "), "-", campo + novedades);

		// Fin
		return;
	},
	sumaUnDia: (fecha) => comp.fechaHora.anoMesDia(new Date(fecha).getTime() + unDia),
	eliminaRegsSinEntidad_id: async () => {
		// Variables
		const entidades = [...variables.entidades.todos, "usuarios"];
		let idsPorEntidad = {};
		let aux = [];

		// Obtiene los registros por entidad
		for (let entidad of entidades) aux.push(baseDeDatos.obtieneTodos(entidad).then((n) => n.map((m) => m.id)));
		aux = await Promise.all(aux);
		entidades.forEach((entidad, i) => (idsPorEntidad[entidad] = aux[i])); // obtiene un objeto de ids por entidad

		// Elimina historial
		for (let tabla of eliminarCuandoSinEntidadId) {
			// Obtiene los registros de historial, para analizar si corresponde eliminar alguno
			const regsHistorial = await baseDeDatos.obtieneTodos(tabla);

			// Si no encuentra la "entidad + id", elimina el registro
			for (let regHistorial of regsHistorial)
				if (
					!regHistorial.entidad || // no existe la entidad
					!entidades.includes(regHistorial.entidad) || // entidad desconocida
					!regHistorial.entidad_id || // no existe la entidad_id
					!idsPorEntidad[regHistorial.entidad].includes(regHistorial.entidad_id) // no existe la combinacion de entidad + entidad_id
				)
					baseDeDatos.eliminaPorId(tabla, regHistorial.id);
		}

		// Fin
		return;
	},
};

// Variables
const normalize = "style='font-family: Calibri; line-height 1; color: rgb(37,64,97); ";

// Funciones
const FN_mailDeFeedback = {
	creaElMensajeStatus: (resultados) => {
		// Variables
		let mensajesAcum = "";
		let mensajesAltas = "";
		let mensajesAprob = "";
		let mensajesRech = "";
		let color;

		// Crea el mensaje en formato texto para cada registro de status, y se lo asigna a mensajesAprob o mensajesRech
		resultados.map((n) => {
			// Crea el mensaje
			let mensaje = n.entidadNombre + ": <b>" + n.anchor + "</b>";

			if (!n.altaAprob) {
				// Mensaje adicional
				mensaje += ", de status <em>" + n.statusOrigNombre.toLowerCase() + "</em>";
				mensaje += " a status <em>" + n.statusFinalNombre.toLowerCase() + "</em>";

				// Mensaje adicional si hay un motivo
				if (n.motivo) mensaje += ". <u>Motivo</u>: " + n.motivo;
			}

			// Le asigna un color
			color = n.aprobado ? "green" : "firebrick";
			mensaje = formatos.li(mensaje, color);

			// Agrega el mensaje al sector que corresponda
			n.altaAprob
				? (mensajesAltas += mensaje) // altas aprobadas
				: n.aprobado
				? (mensajesAprob += mensaje) // otros cambios aprobados
				: (mensajesRech += mensaje); // rechazados
		});

		// Crea el mensajeGlobal, siendo primero los aprobados y luego los rechazados
		if (mensajesAltas) mensajesAcum += formatos.h2("Altas APROBADAS") + formatos.ol(mensajesAltas);
		if (mensajesAprob) mensajesAcum += formatos.h2("Status - Cambios APROBADOS") + formatos.ol(mensajesAprob);
		if (mensajesRech) mensajesAcum += formatos.h2("Status - Cambios RECHAZADOS") + formatos.ol(mensajesRech);

		// Fin
		return mensajesAcum;
	},
	ordenarEdic: (resultados) => {
		return resultados.sort((a, b) =>
			false
				? false
				: // Familia
				a.familia < b.familia
				? -1
				: a.familia > b.familia
				? 1
				: // Entidad
				a.entidadNombre < b.entidadNombre
				? -1
				: a.entidadNombre > b.entidadNombre
				? 1
				: // Nombre del Producto o Rclv, o url del Link
				a.nombre < b.nombre
				? -1
				: a.nombre > b.nombre
				? 1
				: // Para nombres iguales, separa por id
				a.entidad_id < b.entidad_id
				? -1
				: a.entidad_id > b.entidad_id
				? 1
				: // Primero los campos aprobados
				a.aprobado > b.aprobado
				? -1
				: a.aprobado < b.aprobado
				? 1
				: // Orden alfabético de los campos
				a.campo < b.campo
				? -1
				: a.campo > b.campo
				? 1
				: 0
		);
	},
	avatarConLink: (familia, valor, texto) => {
		// Variables
		texto = "la imagen " + texto;
		const terminacion = '" style="color: inherit; text-decoration: none"><u>' + texto + "</u></a>";
		const carpeta = familia == "producto" ? "2-Productos" : "3-RCLVs";
		const rutaArchivo = carpeta + "/Final/" + valor;

		// Fin
		return !valor
			? "" // si no tiene un valor
			: valor.includes("/")
			? '<a href="' + valor + terminacion // si es una imagen Externa
			: comp.gestionArchivos.existe(carpetaExterna + rutaArchivo)
			? '<a href="' + urlHost + "/Externa/" + rutaArchivo + terminacion // si se encuentra el archivo
			: texto; // si no se encuentra el archivo
	},
	nombres: async (reg) => {
		// Variables
		const {entidad, entidad_id} = reg;
		const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
		let nombre, anchor;

		// Fórmulas
		if (reg.entidad != "links") {
			// Obtiene el registro
			const prodRclv = await baseDeDatos.obtienePorId(reg.entidad, reg.entidad_id);
			if (!prodRclv) return {};

			// Obtiene los nombres
			nombre = comp.nombresPosibles(prodRclv);
			anchor =
				"<a " +
				("href='" + urlHost + "/" + entidad + "/detalle/" + siglaFam + "/") +
				("?id=" + entidad_id) +
				"' style='color: inherit; text-decoration: none'" +
				(">" + nombre + "</a>");
		} else {
			// Obtiene el registro
			const asocs = variables.entidades.prodsAsoc;
			const link = await baseDeDatos.obtienePorId("links", reg.entidad_id, [...asocs, "prov"]);
			if (!link.id) return {};

			// Obtiene el nombre
			const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(link);
			nombre = comp.nombresPosibles(link[prodAsoc]);

			// Obtiene el anchor
			link.href = link.prov.embededPoner ? urlHost + "/links/mirar/l/?id=" + link.id : "//" + link.url;
			anchor = "<a href='" + link.href + "' style='color: inherit; text-decoration: none'>" + nombre + "</a>";
		}

		// Fin
		return {nombre, anchor};
	},
};
const formatos = {
	h2: (texto) => "<h2 " + normalize + "font-size: 18px'>" + texto + "</h2>",
	h3: (texto) => "<h3 " + normalize + "font-size: 16px'>" + texto + "</h3>",
	ol: (texto) => "<ol " + normalize + "font-size: 14px'>" + texto + "</ol>",
	ul: (texto) => "<ul " + normalize + "font-size: 14px'>" + texto + "</ul>",
	li: (texto, color) => {
		let formato = normalize;
		if (color) formato = formato.replace("rgb(37,64,97)", color);
		return "<li " + formato + "font-size: 14px'>" + texto + "</li>";
	},
	a: (texto, registro) => {
		// Variables
		const siglaFam = comp.obtieneDesdeEntidad.siglaFam(registro.entidad);
		const operacion = {[creado_id]: "alta/" + siglaFam, [inactivar_id]: "inactivar", [recuperar_id]: "recuperar"}; // operaciones de revisión para prioritarios

		// Arma la respuesta
		let respuesta = '<a href="' + urlHost + "/revision/"; // baseUrl
		respuesta += operacion[registro.statusRegistro_id] + "/"; // tarea
		respuesta += registro.entidad + "/?id=" + registro.id; // entidad + id
		respuesta += '" style="color: inherit; text-decoration: none"'; // formato
		respuesta += ">" + texto + "</a>"; // texto del mensaje

		// Fin
		return respuesta;
	},
};
const FN_obtieneImgDerecha = {
	obtieneLosRclvs: async (fechaDelAno) => {
		// Variables
		let rclvs = [];

		// Obtiene los rclvs
		for (const entidad of variables.entidades.rclvs) {
			// Si corresponde, saltea la rutina
			if (entidad == "epocasDelAno" && fechaDelAno.epocaDelAno_id == ninguno_id) continue;

			// Condicion genérica
			const condicion = {
				statusRegistro_id: aprobado_id,
				avatar: {[Op.ne]: null},
				// El año no sea del futuro - es necesario escribirlo así, para que funcione
				[Op.or]: [
					{anoFM: null}, // el año sea null
					{anoFM: {[Op.lte]: anoHoy}}, // el año sea el anterior o el actual
				],
			};

			// Condiciones particulares
			entidad != "epocasDelAno" ? (condicion.fechaDelAno_id = fechaDelAno.id) : (condicion.id = fechaDelAno.epocaDelAno_id);
			if (entidad == "personajes") condicion.categoria_id = "CFC"; // para personajes, sólo los relacionados con nuestra Iglesia

			// Obtiene los rclvs
			const registros = baseDeDatos
				.obtieneTodosPorCondicion(entidad, condicion)
				.then((n) => n.map((m) => ({...m, entidad})));
			rclvs.push(registros);
		}
		rclvs = await Promise.all(rclvs).then((n) => n.flat());

		// Fin
		return rclvs;
	},
	reduceRclvs: (rclvs) => {
		// Variables
		let resultado;

		if (rclvs.length > 1) {
			// Obtiene la máxima prioridad
			const prioridades_id = rclvs.map((n) => n.prioridad_id);
			const prioridad_id = Math.max(...prioridades_id);

			// Filtra por los que tienen la máxima prioridad_id
			rclvs = rclvs.filter((n) => n.prioridad_id == prioridad_id);

			// Prioriza por los de mayor avance de proceso de canonización
			if (rclvs.length > 1)
				rclvs = rclvs.find((n) => n.canon_id && n.canon_id.startsWith("ST"))
					? rclvs.filter((n) => n.canon_id && n.canon_id.startsWith("ST"))
					: rclvs.find((n) => n.canon_id && n.canon_id.startsWith("BT"))
					? rclvs.filter((n) => n.canon_id && n.canon_id.startsWith("BT"))
					: rclvs.find((n) => n.canon_id && n.canon_id.startsWith("VN"))
					? rclvs.filter((n) => n.canon_id && n.canon_id.startsWith("VN"))
					: rclvs.find((n) => n.canon_id && n.canon_id.startsWith("SD"))
					? rclvs.filter((n) => n.canon_id && n.canon_id.startsWith("SD"))
					: rclvs;

			// Elige al azar de entre los que tienen la máxima prioridad
			const indice = rclvs.length > 1 ? parseInt(Math.random() * rclvs.length) : 0;
			resultado = rclvs[indice];
		}
		// Si se encontró un solo resultado, lo asigna
		else if (rclvs.length == 1) resultado = rclvs[0];

		// Fin
		return resultado;
	},
	datosImgDerecha: (resultado) => {
		// Variables
		let imgDerecha;

		// Acciones si se obtuvo un resultado
		if (resultado) {
			// Datos iniciales
			const {entidad, id, hoyEstamos_id, leyNombre, nombre} = resultado;
			imgDerecha = {entidad, id};

			// hoyEstamos
			const hoyEstamosFinal = hoyEstamos_id
				? hoyEstamos.find((n) => n.id == hoyEstamos_id).nombre
				: hoyEstamos.find((n) => n.entidad == entidad || !n.entidad).nombre;

			// leyNombre
			const leyNombreFinal = leyNombre ? leyNombre : nombre;

			// Nombre de la imagen
			imgDerecha.leyenda = hoyEstamosFinal + " " + leyNombreFinal;

			// Datos del archivo, dependiendo de la entidad
			if (!resultado.carpetaAvatars) {
				imgDerecha.carpeta = "3-RCLVs/Final/";
				imgDerecha.nombreArchivo = resultado.avatar;
			} else {
				imgDerecha.carpeta = "4-EpocasDelAno/" + resultado.carpetaAvatars + "/";
				imgDerecha.nombreArchivo = comp.gestionArchivos.imagenAlAzar(carpetaExterna + imgDerecha.carpeta);
			}
		}
		// Acciones si no encontró una imagen para la fecha
		else
			imgDerecha = {
				titulo: "ELC - Películas",
				carpeta: "./publico/imagenes/Varios/",
				nombreArchivo: "Institucional.jpg",
			};

		// Fin
		return imgDerecha;
	},
};
const FN_navegsDia = {
	// Pulido
	porRuta: (navegsDia) => {
		// Quita el horario de las fechas
		navegsDia = navegsDia.map((n) => ({...n, fecha: comp.fechaHora.anoMesDia(n.fecha)}));

		// Quita las navegaciones que correspondan
		for (let i = navegsDia.length - 1; i > 0; i--) {
			// Variables
			const {id, fecha, cliente_id, ruta} = navegsDia[i];
			const rutaAnt = navegsDia[i - 1];
			const tieneQuery = ruta.includes("/?");

			// Revisa las rutas
			if (
				(tieneQuery &&
					navegsDia.find((n) => n.ruta == ruta && n.cliente_id == cliente_id && n.fecha == fecha && n.id != id)) || // si tiene query, se fija que no esté repetido por el mismo cliente en el día
				(!tieneQuery && rutaAnt.ruta == ruta && rutaAnt.cliente_id == cliente_id && rutaAnt.fecha == fecha) || // si no tiene query, se fija que no sea un 'refresh'
				false
			)
				navegsDia.splice(i, 1);
		}

		// Fin
		return navegsDia;
	},
	porProd: async (navegsDia) => {
		// Quita el horario de las fechas
		navegsDia = navegsDia.map((n) => ({...n, fecha: comp.fechaHora.anoMesDia(n.fecha)}));

		// Deja solamente las rutas 'mirar link'
		navegsDia = navegsDia.filter((n) => n.ruta.startsWith("/links/mirar/l"));

		// Quita las navegaciones que estén repetidas por el mismo cliente en el día
		for (let i = navegsDia.length - 1; i > 0; i--) {
			const {id, fecha, cliente_id, ruta} = navegsDia[i];
			if (navegsDia.find((n) => n.ruta == ruta && n.cliente_id == cliente_id && n.fecha == fecha && n.id != id))
				navegsDia.splice(i, 1);
		}

		// Obtiene los datos de los productos
		navegsDia = navegsDia.map(async (n) => {
			// Obtiene el link con su producto
			const linkId = parseFloat(n.ruta.split("id=")[1]);
			const {prodsAsoc} = variables.entidades;
			const link = await baseDeDatos.obtienePorId("links", linkId, prodsAsoc);

			// Obtiene el producto
			const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(link);
			const producto = link[prodAsoc];

			// Completa la info
			const datos = {fecha: n.fecha, entidad: prodAsoc, id: producto.id, nombreCastellano: producto.nombreCastellano};
			return datos;
		});
		navegsDia = await Promise.all(navegsDia);

		// Fin
		return navegsDia;
	},
	porHora: (navegsDia) => {
		// Quita los minutos y segundos de las fechas
		navegsDia = navegsDia.map((n) => ({...n, fechaHora: n.fecha.setMinutes(0, 0)}));

		// Quita las navegaciones que correspondan - repeticiones de las combinaciones cliente-fechaHora
		for (let i = navegsDia.length - 1; i > 0; i--) {
			// Variables
			const {id, fechaHora, cliente_id} = navegsDia[i];

			// Revisa las rutas
			if (navegsDia.find((n) => n.cliente_id == cliente_id && n.fechaHora == fechaHora && n.id != id))
				navegsDia.splice(i, 1);
		}

		// Terminación
		navegsDia = navegsDia.map((n) => {
			n.fecha = comp.fechaHora.anoMesDia(n.fecha);
			n.diaSem = comp.fechaHora.diaSem(n.fechaHora);
			n.hora = new Date(n.fechaHora).getUTCHours();
			return n;
		});

		// Fin
		return navegsDia;
	},

	// Auxiliares
	fechaSig: async (tabla, navegsDiaPulido) => {
		// Obtiene el último registro de acumuladas
		let ultRegistro = await baseDeDatos.obtienePorCondicionElUltimo(tabla);
		if (!ultRegistro) ultRegistro = {fecha: null};

		// Obtiene la fecha siguiente
		let fechaSig = ultRegistro.fecha
			? new Date(ultRegistro.fecha).getTime() + unDia // el día siguiente de la del último registro de 'ultRegistro'
			: navegsDiaPulido[0].fecha; // la del primer registro de 'navegsDiaPulido'
		fechaSig = comp.fechaHora.anoMesDia(fechaSig); // sólo importa la fecha

		// Fin
		return fechaSig;
	},
	eliminaRegsAntiguos: async (tabla) => {
		// Variables
		const ultRegistro = await baseDeDatos.obtienePorCondicionElUltimo(tabla);
		if (!ultRegistro) return;

		// Obtiene la fecha desde la cual eliminar registros
		const ultFecha = ultRegistro.fecha;
		const fechaEliminar = new Date(new Date(ultFecha).getTime() - unaSemana * 4);

		// Elimina los registros antiguos
		await baseDeDatos.eliminaPorCondicion(tabla, {fecha: {[Op.lte]: fechaEliminar}});

		// Fin
		return;
	},
};
