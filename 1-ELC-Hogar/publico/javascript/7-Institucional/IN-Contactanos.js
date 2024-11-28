"use strict";
window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		// Variables generales
		form: document.querySelector("form"),
		submit: document.querySelector("form #submit"),

		// Datos
		inputs: document.querySelectorAll(".inputError .input"),
		textArea: document.querySelector(".inputError textarea.input"),
		pendiente: document.querySelector(".inputError #contador"),

		// OK/Errores
		iconosError: document.querySelectorAll(".inputError .fa-circle-xmark"),
		iconosOK: document.querySelectorAll(".inputError .fa-circle-check"),
		mensajesError: document.querySelectorAll(".inputError .mensajeError"),

		// Cartel genérico
		cartelGenerico: document.querySelector("#todoElMain #cartelGenerico"),
		continuar: document.querySelector("#cartelGenerico #iconosCartel #continuar"),
	};

	// Funciones
	const FN = {
		actualizaVarios: async function () {
			this.contador();
			this.obtieneLosValores();
			await this.actualizaLosErrores();
			this.actualizaBotonSubmit();

			// Fin
			return;
		},
		contador: () => {
			DOM.pendiente.innerHTML = Math.max(500 - DOM.textArea.value.length, 0);

			// Fin
			return;
		},
		obtieneLosValores: () => {
			v.datosUrl = "/?";
			DOM.inputs.forEach((input, i) => {
				if (i) v.datosUrl += "&";
				v.datosUrl += input.name + "=" + encodeURIComponent(input.value);
			});

			return;
		},
		actualizaLosErrores: async () => {
			// Obtiene los errores
			errores = await fetch(rutas.inicioAPI + rutas.validaDatos + v.datosUrl).then((n) => n.json());

			// Acciones en función de si hay errores o no
			campos.forEach((campo, indice) => {
				// Actualiza los mensajes de error
				DOM.mensajesError[indice].innerHTML = errores[campo];

				// Acciones si hay mensaje de error
				if (errores[campo]) {
					DOM.iconosOK[indice].classList.add("ocultar");
					DOM.iconosError[indice].classList.remove("ocultar");
				}
				// Acciones si no hay mensaje de error
				else {
					DOM.iconosOK[indice].classList.remove("ocultar");
					DOM.iconosError[indice].classList.add("ocultar");
				}
			});

			// Fin
			return;
		},
		actualizaBotonSubmit: () => {
			// Detecta la cantidad de 'errores' ocultos
			let hayErrores = Array.from(DOM.iconosOK)
				.map((n) => n.className)
				.some((n) => n.includes("ocultar"));
			// Consecuencias
			hayErrores ? DOM.submit.classList.add("inactivo") : DOM.submit.classList.remove("inactivo");
		},
		submit: async function (e) {
			e.preventDefault();

			// Si el botón submit está inactivo, interrumpe la función
			if (DOM.submit.className.includes("inactivo")) return this.actualizaVarios();

			// Genera los datos para el envío del mail
			const ruta = rutas.inicioAPI + rutas.enviaMail;
			const APIs = [{ruta: v.datosUrl, duracion: 9000}];

			// Envío de mail más cartel de progreso
			DOM.submit.classList.add("inactivo");
			const mailEnviado = await barraProgreso(ruta, APIs);

			// Redirige
			location.href = rutas.inicioVista + (mailEnviado ? rutas.envioExitoso : rutas.envioFallido);
			return;
		},
	};

	// Eventos - inputs en el form
	DOM.continuar.addEventListener("click", () => DOM.cartelGenerico.classList.add("ocultar"));
	DOM.inputs.forEach((input, i) => {
		input.addEventListener("input", (e) => {
			// Acciones
			amplio.restringeCaracteres(e); // restringe caracteres indeseados
			DOM.iconosError[i].classList.add("ocultar"); // oculta los íconos de error
			FN.contador(); // actualiza el contador
			FN.actualizaVarios(); // busca el mensaje de error

			// Fin
			return;
		});
	});
	// Eventos - submit
	DOM.form.addEventListener("submit", async (e) => FN.submit(e));
	DOM.submit.addEventListener("click", async (e) => FN.submit(e));

	// Status inicial
	if (Array.from(DOM.inputs).some((n) => n.value)) await FN.actualizaVarios();
});

// Variables
const campos = ["asunto", "comentario"];
const rutas = {
	inicioAPI: "/institucional/api/in-contactanos-",
	validaDatos: "valida",
	enviaMail: "envia-mail",
	inicioVista: "/institucional/contactanos/",
	envioExitoso: "envio-exitoso",
	envioFallido: "envio-fallido",
};
let v = {};
