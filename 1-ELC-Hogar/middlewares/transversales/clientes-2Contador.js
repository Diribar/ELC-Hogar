// Revisa si corresponde actualizar el contador (no se usa con apis)
"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Variables
	const {usuario, cliente} = req.session;
	const {cliente_id} = cliente;
	let {fechaUltNaveg} = cliente;

	// Si no está recién creado y la fecha es igual a hoy, o el id de usuario es menor a 11, interrumpe la función
	if ((!req.session.recienCreado && fechaUltNaveg == hoy) || (usuario && usuario.id < 11)) return next();

	// Más variables
	let {diasSinCartelBenefs, diasNaveg} = cliente;
	const tabla = cliente_id.startsWith("U") ? "usuarios" : "visitas";

	// Actualiza la tabla 'usuarios/visitas' y la variable 'cliente'
	fechaUltNaveg = hoy;
	diasNaveg++;
	if (!usuario) diasSinCartelBenefs++;
	const datos = {fechaUltNaveg, diasSinCartelBenefs, diasNaveg};
	for (let campo in datos) cliente[campo] = datos[campo];
	baseDeDatos.actualizaPorCondicion(tabla, {cliente_id}, datos);

	// Contador de clientes
	const usuario_id = usuario ? usuario.id : null;
	contadorDeClientes(usuario_id, cliente);

	// Actualiza cookies
	if (usuario) res.cookie("email", usuario.email, {maxAge: unAno});
	res.cookie("cliente_id", cliente_id, {maxAge: unAno});

	// Actualiza session
	delete req.session.recienCreado;
	req.session.cliente = cliente;

	// Fin
	return next();
};

const contadorDeClientes = async (usuario_id, cliente) => {
	// Variables
	const {cliente_id, diasNaveg, visitaCreadaEn} = cliente;

	// Si ya existe un registro del 'cliente_id' en esta fecha, interrumpe la función
	const condicion = {fecha: hoy, cliente_id};
	const existe = await baseDeDatos.obtienePorCondicion("persWebDia", condicion);
	if (existe) return;

	// Agrega un registro en la tabla 'persWebDia'
	const datos = {...condicion, diasNaveg, visitaCreadaEn};
	if (usuario_id) datos.usuario_id = usuario_id;
	baseDeDatos.agregaRegistro("persWebDia", datos);

	// Fin
	return;
};
