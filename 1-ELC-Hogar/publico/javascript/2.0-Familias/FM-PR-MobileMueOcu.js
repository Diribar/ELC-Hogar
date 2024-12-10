"use strict";
window.addEventListener("load", () => {
	// Variables
	let DOM = {
		datos: document.querySelector("#cuerpo #datos"),
		imgDerecha: document.querySelector("#imgDerecha"),
	};
	if (!DOM.datos) DOM.datos = document.querySelector("#cuerpo #tabla");
	DOM = {
		...DOM,
		// Sector Cuerpo
		datosLargos: DOM.datos.querySelector("#datosLargos"),
		datosBreves: DOM.datos.querySelector("#datosBreves"),

		// Sector Imagen Derecha
		imagen: DOM.imgDerecha.querySelector("img"),
		links: DOM.imgDerecha.querySelector("#links"),
		sectorIconos: DOM.imgDerecha.querySelector("#sectorIconos"),
	};

	// Más variables
	if (DOM.sectorIconos) {
		DOM.mobile = DOM.sectorIconos.querySelector("#mobile");
		DOM.iconoDL = DOM.mobile.querySelector("#iconoDL");
		DOM.iconoDB = DOM.mobile.querySelector("#iconoDB");
	}
	let parado = window.matchMedia("(orientation: portrait)").matches;
	let muestra;

	// Funciones
	const FN = {
		startUp: () => {
			if (parado) {
				if (DOM.datosBreves) DOM.datosBreves.classList.add("toggle"); // oculta datosBreves

				// Si existe links, los muestra y muestra iconoDL
				if (DOM.links) {
					DOM.links.classList.remove("toggle");
					if (DOM.datosLargos) DOM.datosLargos.classList.add("toggle"); // oculta datosLargos
					if (DOM.iconoDL) DOM.iconoDL.classList.remove("toggle"); // muestra iconoDL
					if (DOM.iconoDB) DOM.iconoDB.classList.add("toggle"); // oculta iconoDB
				}
				// Si no existe links, muestra DL e ícono DB
				else {
					if (DOM.datosLargos) DOM.datosLargos.classList.remove("toggle"); // muestra datosLargos
					if (DOM.iconoDL) DOM.iconoDL.classList.add("toggle"); // oculta iconoDL
					if (DOM.iconoDB) DOM.iconoDB.classList.remove("toggle"); // muestra iconoDB
				}
			} else {
				// Datos Largos
				if (DOM.datosLargos) DOM.datosLargos.classList.remove("toggle"); // muestra datosLargos
				if (DOM.iconoDL) DOM.iconoDL.classList.add("toggle"); // oculta iconoDL

				// Datos Breves
				if (DOM.datosBreves) DOM.datosBreves.classList.add("toggle"); // oculta datosBreves
				if (DOM.iconoDB) DOM.iconoDB.classList.remove("toggle"); // muestra iconoDB

				// Links
				if (DOM.links) DOM.links.classList.remove("toggle");
			}

			// Fin
			muestra = true;
			return;
		},
		imagenParado: function () {
			if (muestra) DOM.datos.classList.add("ocultar"); // Si se está mostrando, oculta todo
			else DOM.datos.classList.remove("ocultar"); // Si está todo oculto, muestra
			this.imagenAcostado();
		},
		imagenAcostado: () => {
			// Si se está mostrando, oculta todo
			if (muestra) {
				if (DOM.links) DOM.links.classList.add("ocultar");
				if (DOM.sectorIconos) DOM.sectorIconos.classList.add("ocultar");
				muestra = false;
			}
			// Si está todo oculto, muestra
			else {
				if (DOM.links) DOM.links.classList.remove("ocultar");
				if (DOM.sectorIconos) DOM.sectorIconos.classList.remove("ocultar");
				muestra = true;
			}
		},
	};

	// Event listeners - Muestra datosLargos
	if (DOM.iconoDL)
		DOM.iconoDL.addEventListener("click", () => {
			// Datos Largos
			DOM.datosLargos.classList.remove("toggle"); // muestra datosLargos
			DOM.iconoDL.classList.add("toggle"); // oculta iconoDL

			// Datos Breves
			DOM.datosBreves.classList.add("toggle"); // oculta datosBreves
			DOM.iconoDB.classList.remove("toggle"); // muestra iconoDB

			// Links
			if (parado && DOM.links) DOM.links.classList.add("toggle");
		});

	// Event listeners - Muestra datosBreves
	if (DOM.iconoDB)
		DOM.iconoDB.addEventListener("click", () => {
			// Datos Largos
			DOM.datosLargos.classList.add("toggle"); // muestra datosLargos
			DOM.iconoDL.classList.remove("toggle"); // oculta iconoDL

			// Datos Breves
			DOM.datosBreves.classList.remove("toggle"); // oculta datosBreves
			DOM.iconoDB.classList.add("toggle"); // muestra iconoDB

			// Links
			if (parado && DOM.links) DOM.links.classList.add("toggle");
		});

	// Event listeners - Start-up / 'click' en la imagen
	for (let sector of [DOM.imagen, DOM.sectorIconos])
		if (sector)
			sector.addEventListener("click", (e) => {
				if (e.target.localName == "img" || e.target.id == "sectorIconos")
					parado ? FN.imagenParado() : FN.imagenAcostado();
				return;
			});

	// Event listeners - Recarga la vista si se gira
	screen.orientation.addEventListener("change", () => {
		parado = window.matchMedia("(orientation: portrait)").matches;
		FN.startUp();
	});

	// Start-up
	FN.startUp();
	if (DOM.mobile) DOM.mobile.classList.remove("invisible");
});

// Variables
const tarea = location.pathname;
const calificar = tarea.includes("/calificar/p");
const rclvDetalle = tarea.includes("/detalle/r");
