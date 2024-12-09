"use strict";

window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		inputs: document.querySelectorAll("#historial input[name='opcion']"),
		form: document.querySelector("form"),
		submit: document.querySelector("form button[type='submit']"),
	};

	// Eventos - Input
	for (let input of DOM.inputs) input.addEventListener("change", () => submit.classList.remove("inactivo"));

	// Eventos - Submit
	DOM.form.addEventListener("submit", (e) => {
		if (DOM.submit.className.includes("inactivo")) e.preventDefault();
	});
	DOM.submit.addEventListener("click", (e) => {
		if (DOM.submit.className.includes("inactivo")) e.preventDefault();
	});
});
