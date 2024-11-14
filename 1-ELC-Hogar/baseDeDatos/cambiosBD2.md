-- c19353_elc.ind_rutas_del_dia definition

CREATE TABLE `ind_rutas_del_dia` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` varchar(11) NOT NULL,
  `ruta` varchar(100) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT utc_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

