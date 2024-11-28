"use strict";
window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		// General
		form: document.querySelector("form"),
		submit: document.querySelector("form button[type='submit']"),

		// Inputs del formulario
		inputs: document.querySelectorAll(".inputError .input"),

		// Errores
		iconosError: document.querySelectorAll(".errores .fa-circle-xmark"),
		iconosOK: document.querySelectorAll(".errores .fa-circle-check"),
		mensajesError: document.querySelectorAll(".errores .mensajeError"),
		mensajeErrorCreds: document.querySelector("#credenciales.errores .mensajeError"),

		// Cartel progreso
		cartelProgreso: document.querySelector("#cartelProgreso"),
		progreso: document.querySelector("#cartelProgreso #progreso"),
	};
	for (const input of DOM.inputs) DOM[input.name] = document.querySelector(".inputError .input[name='" + input.name + "']");
	const v = {
		// Envío de mail
		urlExitoso: pathname.slice(0, indice) + "/envio-exitoso-de-mail/?codigo=" + codigo,
		urlFallido: pathname.slice(0, indice) + "/envio-fallido-de-mail/?codigo=" + codigo,
		pendiente: true,

		// Varios
		datosDeSession: olvidoContr ? await fetch(rutas.datosDeSession).then((n) => n.json()) : {},
		inputs: Array.from(DOM.inputs).map((n) => n.name),
		errores: {},
		datos: {},
	};

	// Funciones
	const FN = {
		validaMail: async () => {
			// Variables
			const email = olvidoContr // toma el mail dependiendo de la ruta
				? v.datosDeSession.datos.email // lo toma del BE, no de la vista
				: DOM.email.value;
			v.datos = {email};

			// Obtiene la información de los datos perennes
			if (olvidoContr && v.datosDeSession.validarDatosPerennes)
				for (const campo of camposPerennes) if (DOM[campo]) v.datos[campo] = DOM[campo].value;

			// Averigua si hay errores
			v.errores = await fetch(rutas.valida + JSON.stringify(v.datos)).then((n) => n.json());

			// Fin
			return;
		},
		actualizaLosErrores: function () {
			// Campos con 'fa-solid'
			v.inputs.forEach((campo, indice) => {
				// Si no se revisó el campo, interrumpe la función
				if (!Object.keys(v.errores).includes(campo)) return;

				// Actualiza el mensaje de error
				DOM.mensajesError[indice].innerHTML = v.errores[campo];

				// Muestra los íconos de OK y Error
				v.errores[campo]
					? DOM.iconosError[indice].classList.remove("ocultar")
					: DOM.iconosError[indice].classList.add("ocultar");
				v.errores[campo]
					? DOM.iconosOK[indice].classList.add("ocultar")
					: DOM.iconosOK[indice].classList.remove("ocultar");
			});

			// Credenciales
			if (Object.keys(v.errores).includes("credenciales")) {
				DOM.mensajeErrorCreds.innerHTML = v.errores.credenciales;
				v.errores.credenciales
					? DOM.mensajeErrorCreds.classList.remove("ocultar")
					: DOM.mensajeErrorCreds.classList.add("ocultar");
			}

			// Botón Submit
			this.actualizaBotonSubmit();

			// Fin
			return;
		},
		actualizaBotonSubmit: () => {
			// Variables
			const OK = Array.from(DOM.iconosOK)
				.map((n) => n.className)
				.every((n) => !n.includes("ocultar"));
			const error = Array.from(DOM.iconosError)
				.map((n) => n.className)
				.every((n) => n.includes("ocultar"));

			// Fin
			OK && error ? DOM.submit.classList.remove("inactivo") : DOM.submit.classList.add("inactivo");
			return;
		},
		submit: async () => {
			// Genera los datos para el envío del mail
			const APIs = [{ruta: v.datos.email, duracion: 9000}];

			// Envío de mail más cartel de progreso
			DOM.submit.classList.add("inactivo");
			v.mailEnviado = await barraProgreso(rutas.envia, APIs);

			// Redirige
			location.href = mailEnviado ? v.urlExitoso : v.urlFallido;

			// Fin
			return;
		},
	};

	// Acciones 'input'
	DOM.form.addEventListener("input", async (e) => {
		// Variables
		const campo = e.target.name;
		let valor = e.target.value;

		// Averigua si hay errores
		if (campo == "email") {
			const posicCursor = e.target.selectionStart;
			valor = valor.toLowerCase();
			e.target.value = valor;
			e.target.selectionEnd = posicCursor;
			v.errores.email = !valor ? cartelMailVacio : !formatoMail.test(valor) ? cartelMailFormato : "";
		} else if (["nombre", "apellido"].includes(campo)) basico.restringeLetras(e);

		if (camposPerennes.includes(campo)) v.errores[campo] = !valor ? "Necesitamos esta información" : "";

		// Limpia las credenciales
		if (DOM.mensajeErrorCreds) v.errores.credenciales = "";

		// Actualiza los errores
		v.errores.hay = Object.values(v.errores).some((n) => !!n);
		FN.actualizaLosErrores();

		// Fin
		return;
	});

	// Submit
	DOM.form.addEventListener("submit", async (e) => {
		e.preventDefault();

		// Averigua si hay errores
		await FN.validaMail();
		FN.actualizaLosErrores();

		// Si el botón está inactivo interrumpe la función
		if (!DOM.submit.className.includes("inactivo") && !v.errores.hay) return submit();

		// Fin
		return;
	});

	// Start-up - Si se olvidó la contraseña y no se deben validar los datos perennes, redirige automáticamente
	if (olvidoContr && !v.datosDeSession.validarDatosPerennes) {
		v.datos.email = v.datosDeSession.datos.email;
		submit();
		return
	}

	// Inactiva 'submit' si hay algún error
	FN.actualizaBotonSubmit();
});

// Variables
const cartelMailVacio = "Necesitamos que escribas un correo electrónico";
const cartelMailFormato = "Debes escribir un formato de correo válido";
const cartelContrasenaVacia = "Necesitamos que escribas una contraseña";
const camposPerennes = ["nombre", "apellido", "fechaNacim", "paisNacim_id"];
const formatoMail = /^\w+([\.-_]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const indice = 1 + pathname.slice(1).indexOf("/");
const codigo = pathname.slice(indice + 1) == "alta-mail" ? "alta-mail" : "olvido-contrasena";
const rutaInicio = "/usuarios/api/us-" + codigo;
const olvidoContr = codigo == "olvido-contrasena";
const rutas = {
	datosDeSession: rutaInicio + "/datos-de-session",
	valida: rutaInicio + "/validaciones/?datos=",
	envia: rutaInicio + "/envio-de-mail/?email=",
};
