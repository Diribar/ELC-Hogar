"use strict";
window.addEventListener("load", () => {
	// Variables
	let DOM = {
		yaExistentes: document.querySelectorAll(".yaExistentes"),
		botonesEditar: document.querySelectorAll(".edicion"), // No lleva 'yaExistentes'
		links_url: document.querySelectorAll(".yaExistentes input[name='url'"),
		taparMotivo: document.querySelectorAll(".yaExistentes .taparMotivo"),
		motivosFila: document.querySelectorAll(".yaExistentes .motivo"),
		motivosSelect: document.querySelectorAll(".yaExistentes .motivo select"),
		botonesOut: document.querySelectorAll(".yaExistentes .out"),
	};
	let columnas = DOM.taparMotivo.length / DOM.yaExistentes.length;

	// Inactiva o elimina
	DOM.botonesOut.forEach((botonOut, fila) => {
		botonOut.addEventListener("click", async () => {
			// Muestra los motivos
			if (!botonOut.className.includes("fa-trash-can")) {
				// Oculta el botón de edicion
				if (DOM.botonesEditar.length) DOM.botonesEditar[fila].classList.add("ocultar");

				// Reemplaza el ícono por el tacho
				botonOut.classList.replace("fa-circle-xmark", "fa-trash-can");

				// Oculta los 6 campos
				for (let columna = 0; columna < columnas; columna++)
					DOM.taparMotivo[fila * columnas + columna].classList.add("ocultar");

				// Muestra el select
				DOM.motivosFila[fila].classList.remove("ocultar");
				DOM.motivosSelect[fila].focus();
			}
			// Inactiva
			else {
				console.log("fa-trash-can");

				// Obtiene los datos
				let url = condicion;
				url += "&url=" + encodeURIComponent(DOM.links_url[fila].value);
				url += "&motivo_id=" + DOM.motivosSelect[fila].value;
				url += "&IN=NO";
				url += "&aprob=NO";

				// Envía la decisión y oculta la fila
				fetch(rutaEliminar + url).then((n) => n.json());
				DOM.yaExistentes[fila].classList.add("ocultar");
			}
		});
	});
});

// Variables
const condicion = "?prodEntidad=" + entidad + "&prodId=" + id;
const revision = location.pathname.includes("/revision/");
const rutaEliminar = revision ? "/links/api/lk-aprob-inactivo" : "/links/api/lk-inactiva-o-elimina/";
