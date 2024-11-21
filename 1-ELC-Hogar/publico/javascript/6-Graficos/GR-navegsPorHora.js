"use strict";
window.addEventListener("load", async () => {
	// Obtiene datos del BE
	const registros = await fetch(ruta).then((n) => n.json());


	// Fin
	return;
});
// https://developers.google.com/chart/interactive/docs/gallery/columnchart
