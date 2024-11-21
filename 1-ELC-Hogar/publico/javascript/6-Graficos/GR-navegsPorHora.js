"use strict";
window.addEventListener("load", async () => {
	// Obtiene datos del BE
	const registros = await fetch(ruta).then((n) => n.json());

	// Variables
	const DOM = {grafico: document.querySelector("#zonaDeGraficos #cuadro #grafico")};

	// Fin
	return;
});
// https://developers.google.com/chart/interactive/docs/gallery/columnchart
