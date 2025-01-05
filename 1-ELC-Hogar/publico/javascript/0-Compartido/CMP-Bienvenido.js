"use strict";
window.addEventListener("load", async () => {
	// Variables
	const titulo = document.querySelector("#cartelGenerico #encab #titulo");
	const botonEntendido =
		titulo && titulo.innerHTML.includes("Bienvenid")
			? document.querySelector("#cartelGenerico #iconosCartel .fa-thumbs-up")
			: null;

	// Si no hay datos, interrumpe la función
	if (!botonEntendido) return;

	// Evento
	botonEntendido.addEventListener("click", () => fetch("/api/cmp-bienvenido-aceptado"));
});
