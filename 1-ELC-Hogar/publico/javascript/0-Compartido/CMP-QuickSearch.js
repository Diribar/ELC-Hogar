"use strict";
window.addEventListener("load", () => {
	// DOM
	let DOM = {
		clickVista: document.querySelector("#busquedaRapida .clickVista"),
		input: document.querySelector("#busquedaRapida .clickVista input"),
		muestraResultados: document.querySelector("#busquedaRapida .clickVista #muestraResultados"),
		escribiMas: document.querySelector("#busquedaRapida .clickVista #escribiMas"),
	};
	let posicion = 0;
	let resultados;

	// Funciones
	const agregaResultados = () => {
		// Generar las condiciones para que se puedan mostrar los 'muestraResultados'
		DOM.muestraResultados.innerHTML = "";
		DOM.muestraResultados.classList.remove("ocultar");

		// Si se encontraron resultados, crea el listado
		if (Array.isArray(resultados)) return creaElListado();

		// Mensaje de 'no se encontraron resultados'
		const parrafo = document.createElement("p");
		parrafo.style.fontStyle = "italic";
		parrafo.style.textAlign = "center";
		parrafo.appendChild(document.createTextNode(resultados));
		DOM.muestraResultados.appendChild(parrafo);
	};
	const creaElListado = () => {
		// Rutina de creación de filas
		for (let resultado of resultados) {
			// Variables
			const {familia, entidad, id} = resultado;
			const siglaFam = familia[0];
			const clase = familia.slice(0, 4);

			// Crea el anchor del resultado
			const anchor = document.createElement("a");
			anchor.classList.add(clase, "flexRow");
			anchor.href = "/" + entidad + "/detalle/" + siglaFam + "/?id=" + id;

			// Crea las celdas
			creaLasCeldas({anchor, resultado});

			// Agrega la fila al cuerpo de la tabla
			DOM.muestraResultados.appendChild(anchor);
		}

		// Terminación
		DOM.muestraResultados.children[0].classList.add("resaltar"); // Resalta el resultado anterior
		posicion = 0;

		// Fin
		return;
	};
	const creaLasCeldas = ({anchor, resultado}) => {
		// Variables
		const {familia, entidad, anoEstreno} = resultado;
		let {nombre} = resultado;
		let anchoMax = 40;

		// Nombre
		if (nombre.length > anchoMax) nombre = nombre.slice(0, anchoMax - 1) + "…";
		if (familia == "producto" && anoEstreno) nombre += " (" + anoEstreno + ")";
		const spanNombre = document.createElement("span");
		spanNombre.innerHTML = nombre;
		spanNombre.className = "spanNombre";
		anchor.appendChild(spanNombre);

		// Entidad
		const entidadCorta = entidad.slice(0, -1);
		let ent = entidad == "personajes" ? "pers" : entidadCorta.slice(0, 5);
		if (ent != entidadCorta && ent != "epoca") ent += ".";
		const spanEnt = document.createElement("span");
		spanEnt.innerHTML = ent;
		spanEnt.className = "spanEnt";
		anchor.appendChild(spanEnt);

		// Fin
		return;
	};
	const agregaUrlBusqRap = async () => {
		await fetch("/api/cmp-agregar-url-br/?comentario=" + DOM.input.value);
	};

	// Add Event Listener
	DOM.input.addEventListener("input", async () => {
		// Impide los caracteres que no son válidos
		DOM.input.value = DOM.input.value.replace(/[^a-záéíóúüñ'¡¿-\d\s]/gi, "").replace(/ +/g, " ");
		const dataEntry = DOM.input.value;

		// Elimina palabras repetidas
		let palabras = dataEntry.split(" ");
		for (let i = palabras.length - 1; i > 0; i--)
			if (palabras.filter((n) => n == palabras[i]).length > 1) palabras.splice(i, 1);
		let pasaNoPasa = palabras.join("");

		// Acciones si la palabra tiene menos de 3 caracteres significativos
		if (pasaNoPasa.length < 3) {
			DOM.muestraResultados.classList.add("ocultar"); // Oculta el sector de muestraResultados
			DOM.escribiMas.classList.remove("ocultar"); // Muestra el cartel de "escribí más"
			return;
		}
		// Oculta el cartel de "escribí más"
		else DOM.escribiMas.classList.add("ocultar");

		// Busca los productos
		palabras = palabras.join(" ");
		resultados = await fetch("/api/cmp-busqueda-rapida/?palabras=" + palabras).then((n) => n.json());
		if (!resultados.length) resultados = "- No encontramos resultados -";

		// Muestra los resultados
		agregaResultados();

		// Fin
		return;
	});
	DOM.input.addEventListener("keydown", (e) => {
		// Variables
		const cantResultados = DOM.muestraResultados.children && DOM.muestraResultados.children.length;
		if (!cantResultados) return;

		// Resalta el resultado anterior
		if (e.key == "ArrowUp" && posicion) {
			DOM.muestraResultados.children[posicion].classList.remove("resaltar"); // Des-resalta el resultado vigente
			posicion--;
			DOM.muestraResultados.children[posicion].classList.add("resaltar"); // Resalta el resultado anterior
		}

		// Resalta el resultado siguiente
		if (e.key == "ArrowDown" && posicion < cantResultados - 1) {
			DOM.muestraResultados.children[posicion].classList.remove("resaltar"); // Des-resalta el resultado vigente
			posicion++;
			DOM.muestraResultados.children[posicion].classList.add("resaltar"); // Resalta el resultado siguiente
		}

		// Redirige a la vista del hallazgo
		if (e.key == "Enter") location.href = DOM.muestraResultados.children[posicion].href;

		// Escape - Oculta el sector de muestraResultados
		if (e.key == "Escape") DOM.clickVista.classList.add("ocultar");

		// Fin
		return;
	});
	DOM.muestraResultados.addEventListener("mouseover", (e) => {
		// Variables
		const opciones = Array.from(DOM.muestraResultados.children);
		const indice = opciones.findIndex((n) => n == e.target.parentNode);
		if (indice == -1) return;

		// Quita la clase resaltar de donde estaba
		if (posicion !== null) DOM.muestraResultados.children[posicion].classList.remove("resaltar");
		posicion = indice;
		DOM.muestraResultados.children[posicion].classList.add("resaltar");

		// Fin
		return;
	});
});
