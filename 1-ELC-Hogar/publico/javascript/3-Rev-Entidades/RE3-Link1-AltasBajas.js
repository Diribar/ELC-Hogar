"use strict";
window.addEventListener("load", () => {
	// Variables
	const DOM = {
		// General
		yaExistentes: document.querySelectorAll(".yaExistentes"),
		linksUrl: document.querySelectorAll(".yaExistentes input[name='url'"),
		filasActivas: document.querySelectorAll(".yaExistentes.inactivo_false"),

		// Objetos a ocultar
		taparMotivo: document.querySelectorAll(".yaExistentes .taparMotivo"),
		motivos: document.querySelectorAll(".yaExistentes .motivo"),
		iconosOut: document.querySelectorAll(".yaExistentes .out"),

		// Íconos addEventListeners
		iconosRevision: document.querySelectorAll(".yaExistentes .revision"),
		iconosIN: document.querySelectorAll(".yaExistentes .revision.in"),
		iconosFuera: document.querySelectorAll(".yaExistentes .revision.fuera"),

		// Otros
		anchoStatus: document.querySelectorAll(".yaExistentes .anchoStatus"),
	};
	const columnas = DOM.taparMotivo.length / DOM.yaExistentes.length;

	// Funciones
	const muestraNuevoIframe = async () => {
		// Muestra el iframe que corresponda
		DOM.contIframesActivos = document.querySelectorAll("#cuerpo #contIframe.activo");
		for (let i = 0; i < DOM.filasActivas.length; i++)
			if (
				DOM.filasActivas[i].className.includes("oscuro_false") && // no está oscurecida
				!DOM.filasActivas[i].className.includes("ocultar") // no está oculta
			) {
				DOM.contIframesActivos[i].classList.remove("ocultar"); // muestra el iframe
				return; // termina la función
			}

		// Siguiente producto
		await buscaSigProd;

		// Fin
		return;
	};
	const buscaSigProd = async () => {
		// Obtiene el sigProd
		const url = "?entidad=" + entidad + "&id=" + id;
		const sigProd = await fetch(rutaSigProd + url).then((n) => n.json());

		// Redirecciona al sigProd
		const cola = "&prodEntidad=" + sigProd.entidad + "&prodId=" + sigProd.id + "&origen=RL";
		return sigProd ? (location.href = "/" + entidad + "/inactivar-captura/?id=" + id + cola) : location.reload();
	};

	// Inactiva
	DOM.iconosOut.forEach((botonOut, fila) => {
		botonOut.addEventListener("click", async () => {
			// Inactiva el link
			await inactivaEliminaLink({DOM, fila, botonOut, ruta: rutaAltaBaja});

			// Actualiza el iframe a mostrar o redirecciona al siguiente producto
			await muestraNuevoIframe();

			// Fin
			return;
		});
	});

	// Aprobado o confirma
	DOM.iconosRevision.forEach((icono, indice) => {
		const fila = parseInt(indice / 2);
		icono.addEventListener("click", async () => {
			// Obtiene los datos
			let url = "?prodEntidad=" + entidad + "&prodId=" + id;
			url += "&url=" + encodeURIComponent(DOM.linksUrl[fila].value);
			url += "&IN=" + (icono.className.includes("in") ? "SI" : "NO");
			url += "&aprob=" + (icono.className.includes("aprob") ? "SI" : "NO");

			// Envía la decisión
			await fetch(rutaAltaBaja + url);

			// Bajas
			if (!icono.className.includes("in")) DOM.yaExistentes[fila].classList.add("ocultar");
			// Altas
			else {
				// Oculta objetos
				DOM.iconosIN[fila].classList.add("ocultar");
				DOM.iconosOut[fila].classList.add("ocultar");
				DOM.iconosFuera[fila].classList.add("ocultar");
				DOM.motivos[fila].classList.add("ocultar");

				// Muestra los campos que se hubieran ocultado
				for (let columna = 0; columna < columnas; columna++)
					DOM.taparMotivo[fila * columnas + columna].classList.remove("ocultar");

				// Otros cambios
				DOM.yaExistentes[fila].classList.replace("oscuro_false", "oscuro_true");
				DOM.anchoStatus[fila].innerHTML = "Aprobado";
			}

			// Actualiza el iframe a mostrar o redirecciona al siguiente producto
			await muestraNuevoIframe();

			// Fin
			return;
		});
	});

	// Fin
	return;
});

// Variables
const rutaAltaBaja = "/revision/api/lk-aprob-inactivo/";
const rutaSigProd = "/revision/api/re-siguiente-producto-link/";
