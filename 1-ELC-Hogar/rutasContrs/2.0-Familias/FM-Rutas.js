"use strict";
// Variables
const router = express.Router();
const vista = require("./FM-ControlVista");
const API = require("./FM-ControlAPI");

// Middlewares
const m = {
	// Middlewares - Específicos de usuarios
	usAltaTerm: require("../../middlewares/porUsuario/usAltaTerm"),
	usPenalizaciones: require("../../middlewares/porUsuario/usPenalizaciones"),
	usAptoInput: require("../../middlewares/porUsuario/usAptoInput"),
	usRolRevPERL: require("../../middlewares/porUsuario/usRolRevPERL"),

	// Middlewares - Específicos del registro
	entValida: require("../../middlewares/porRegistro/entidadValida"),
	idValido: require("../../middlewares/porRegistro/idValido"),
	statusCorrecto: require("../../middlewares/porRegistro/statusCorrecto"),
	creadoPorUsuario: require("../../middlewares/porRegistro/creadoPorUsuario"),
	motivoNecesario: require("../../middlewares/porRegistro/motivoNecesario"),
	comentNecesario: require("../../middlewares/porRegistro/comentNecesario"),
	rutaCRUD_ID: require("../../middlewares/varios/rutaCRUD_ID"),
	statusCompara: require("../../middlewares/porRegistro/statusCompara"),

	// Middlewares - Temas de captura
	permUserReg: require("../../middlewares/porRegistro/permUserReg"),
	capturaActivar: require("../../middlewares/varios/capturaActivar"),
	capturaInactivar: require("../../middlewares/varios/capturaInactivar"),
};

// Middlewares - Consolidados
const aptoUsuario = [m.usAltaTerm, m.usPenalizaciones, m.usAptoInput];
const eliminadoPorCreador = [...aptoUsuario, m.entValida, m.idValido, m.statusCorrecto, m.creadoPorUsuario];
const aptoDetalle = [m.entValida, m.idValido, m.rutaCRUD_ID];
const aptoCRUD = [...aptoDetalle, m.statusCorrecto, m.statusCompara, ...aptoUsuario, m.permUserReg];
const aptoEliminar = [...aptoCRUD, m.usRolRevPERL];

// APIs
router.get("/api/fm-obtiene-info-del-be", API.obtieneInfo);
router.get("/api/fm-obtiene-registro", API.obtieneRegistro);

// Vistas - CRUD
router.get("/historial/:siglaFam", aptoDetalle, m.statusCompara, vista.form.historial);
router.get("/inactivar/:siglaFam", aptoCRUD, m.capturaActivar, vista.form.motivos);
router.post("/inactivar/:siglaFam", aptoCRUD, m.motivoNecesario, m.capturaInactivar, vista.inacRecupGuardar);
router.get("/recuperar/:siglaFam", aptoCRUD, m.capturaActivar, vista.form.historial);
router.post("/recuperar/:siglaFam", aptoCRUD, m.comentNecesario, m.capturaInactivar, vista.inacRecupGuardar);
router.get("/eliminado-por-creador/:siglaFam", eliminadoPorCreador, vista.form.elimina);
router.get("/eliminado/:siglaFam", aptoEliminar, vista.form.elimina);

// Fin
module.exports = router;
