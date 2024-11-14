"use strict";
// Variables
const valida = require("../../rutasContrs/1.1-Usuarios/US-FN-Validar");

module.exports = async (req, res, next) => {
	// Redirecciona por cookies
	if (req.cookies && req.cookies.intentosAM >= maxIntentosCookies) return res.redirect("/usuarios/alta-mail/suspendido");

	// Fin
	return next();
};
