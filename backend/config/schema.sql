-- --------------------------------------------------------
-- Hôte:                         193.38.250.100
-- Version du serveur:           10.5.29-MariaDB-0+deb11u1 - Debian 11
-- SE du serveur:                debian-linux-gnu
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour supinfo
CREATE DATABASE IF NOT EXISTS `supinfo_db` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci */;
USE `supinfo_db`;

-- Listage de la structure de la table supinfo. bibliotheque_items
CREATE TABLE IF NOT EXISTS `bibliotheque_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `oeuvre_id` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `statut_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `oeuvre_id` (`oeuvre_id`),
  KEY `fk_bibliotheque_statut` (`statut_id`),
  CONSTRAINT `bibliotheque_items_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bibliotheque_items_ibfk_4` FOREIGN KEY (`oeuvre_id`) REFERENCES `oeuvres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bibliotheque_statut` FOREIGN KEY (`statut_id`) REFERENCES `statuts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. commentaires
CREATE TABLE IF NOT EXISTS `commentaires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `critique_id` int(11) DEFAULT NULL,
  `contenu` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `critique_id` (`critique_id`),
  CONSTRAINT `commentaires_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `commentaires_ibfk_4` FOREIGN KEY (`critique_id`) REFERENCES `critiques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. conversation_participants
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `conversation_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  KEY `user_id` (`user_id`),
  KEY `conversation_id` (`conversation_id`),
  CONSTRAINT `conversation_participants_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_participants_ibfk_4` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. critiques
CREATE TABLE IF NOT EXISTS `critiques` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `oeuvre_id` int(11) DEFAULT NULL,
  `note` int(11) DEFAULT NULL,
  `contenu` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `featured` tinyint(1) DEFAULT 0,
  `hidden` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `oeuvre_id` (`oeuvre_id`),
  CONSTRAINT `critiques_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `critiques_ibfk_4` FOREIGN KEY (`oeuvre_id`) REFERENCES `oeuvres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. followers
CREATE TABLE IF NOT EXISTS `followers` (
  `user_sub` int(11) NOT NULL,
  `user_follow` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_sub`,`user_follow`),
  KEY `user_follow` (`user_follow`),
  CONSTRAINT `followers_ibfk_3` FOREIGN KEY (`user_sub`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `followers_ibfk_4` FOREIGN KEY (`user_follow`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. follow_requests
CREATE TABLE IF NOT EXISTS `follow_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requester_id` int(11) NOT NULL,
  `target_id` int(11) NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_request` (`requester_id`,`target_id`),
  KEY `target_id` (`target_id`),
  CONSTRAINT `follow_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follow_requests_ibfk_2` FOREIGN KEY (`target_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. likes_critiques
CREATE TABLE IF NOT EXISTS `likes_critiques` (
  `user_id` int(11) NOT NULL,
  `critique_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`,`critique_id`),
  KEY `critique_id` (`critique_id`),
  CONSTRAINT `likes_critiques_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_critiques_ibfk_4` FOREIGN KEY (`critique_id`) REFERENCES `critiques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. listes
CREATE TABLE IF NOT EXISTS `listes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `visibilite` varchar(20) DEFAULT 'PUBLIQUE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `listes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. liste_oeuvres
CREATE TABLE IF NOT EXISTS `liste_oeuvres` (
  `liste_id` int(11) NOT NULL,
  `oeuvre_id` int(11) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `statut` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`liste_id`,`oeuvre_id`),
  KEY `oeuvre_id` (`oeuvre_id`),
  CONSTRAINT `liste_oeuvres_ibfk_3` FOREIGN KEY (`oeuvre_id`) REFERENCES `oeuvres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `liste_oeuvres_ibfk_4` FOREIGN KEY (`liste_id`) REFERENCES `listes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `contenu` text DEFAULT NULL,
  `lu` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `conversation_id` (`conversation_id`),
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_4` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `from_user_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `lu` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_notif_from_user` (`from_user_id`),
  CONSTRAINT `fk_notif_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. oeuvres
CREATE TABLE IF NOT EXISTS `oeuvres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `api_reference_id` varchar(100) DEFAULT NULL,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. signalements
CREATE TABLE IF NOT EXISTS `signalements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `signaleur_id` int(11) DEFAULT NULL,
  `type_contenu` varchar(50) DEFAULT NULL,
  `contenu_id` int(11) DEFAULT NULL,
  `motif` varchar(100) DEFAULT NULL,
  `statut` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `signaleur_id` (`signaleur_id`),
  CONSTRAINT `signalements_ibfk_2` FOREIGN KEY (`signaleur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. statuts
CREATE TABLE IF NOT EXISTS `statuts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) DEFAULT NULL,
  `libele` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la table supinfo. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `auth0_id` varchar(255) DEFAULT NULL,
  `prenom` varchar(100) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `pseudo` varchar(50) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `public` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `pseudo` (`pseudo`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de la vue supinfo. v_bibliotheque_details
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_bibliotheque_details` (
	`id` INT(11) NOT NULL,
	`user_id` INT(11) NULL,
	`oeuvre_id` INT(11) NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`titre` VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci',
	`description` VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci',
	`api_reference_id` VARCHAR(100) NULL COLLATE 'utf8_general_ci',
	`statut_id` INT(11) NOT NULL,
	`statut_code` VARCHAR(50) NULL COLLATE 'utf8_general_ci',
	`statut_libele` VARCHAR(50) NULL COLLATE 'utf8_general_ci'
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_bibliotheque_stats
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_bibliotheque_stats` (
	`user_id` INT(11) NULL,
	`total` BIGINT(21) NOT NULL,
	`oeuvres_uniques` BIGINT(21) NOT NULL,
	`derniere_mise_a_jour` TIMESTAMP NULL
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_bibliotheque_stats_par_statut
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_bibliotheque_stats_par_statut` (
	`user_id` INT(11) NULL,
	`statut` VARCHAR(50) NULL COLLATE 'utf8_general_ci',
	`count` BIGINT(21) NOT NULL
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_commentaires
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_commentaires` (
	`id` INT(11) NOT NULL,
	`user_id` INT(11) NULL,
	`critique_id` INT(11) NULL,
	`contenu` TEXT NULL COLLATE 'utf8_general_ci',
	`created_at` TIMESTAMP NOT NULL,
	`pseudo` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`prenom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`nom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`photo` VARCHAR(255) NULL COLLATE 'utf8_general_ci',
	`critique_contenu` TEXT NULL COLLATE 'utf8_general_ci',
	`critique_author_pseudo` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci'
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_critiques_complete
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_critiques_complete` (
	`id` INT(11) NOT NULL,
	`user_id` INT(11) NULL,
	`oeuvre_id` INT(11) NULL,
	`note` INT(11) NULL,
	`contenu` TEXT NULL COLLATE 'utf8_general_ci',
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`pseudo` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`prenom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`nom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`photo` VARCHAR(255) NULL COLLATE 'utf8_general_ci',
	`oeuvre_titre` VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci',
	`oeuvre_description` VARCHAR(255) NOT NULL COLLATE 'utf8_general_ci',
	`api_reference_id` VARCHAR(100) NULL COLLATE 'utf8_general_ci',
	`likes_count` BIGINT(21) NULL
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_feed_activities
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_feed_activities` (
	`type` VARCHAR(11) NOT NULL COLLATE 'utf8mb4_general_ci',
	`id` INT(11) NOT NULL,
	`created_at` TIMESTAMP NOT NULL,
	`author_id` INT(11) NOT NULL,
	`author_pseudo` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`author_photo` VARCHAR(255) NULL COLLATE 'utf8_general_ci',
	`contenu` MEDIUMTEXT NULL COLLATE 'utf8_general_ci',
	`note` INT(11) NULL,
	`oeuvre_titre` VARCHAR(255) NULL COLLATE 'utf8_general_ci',
	`oeuvre_api_ref` VARCHAR(100) NULL COLLATE 'utf8_general_ci',
	`liste_nom` VARCHAR(100) NULL COLLATE 'utf8_general_ci',
	`liste_visibilite` VARCHAR(20) NULL COLLATE 'utf8_general_ci'
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_followers
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_followers` (
	`follower_id` INT(11) NOT NULL,
	`follower_pseudo` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`follower_prenom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`follower_nom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`followed_id` INT(11) NOT NULL,
	`followed_pseudo` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`followed_prenom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`followed_nom` VARCHAR(100) NOT NULL COLLATE 'utf8_general_ci',
	`followed_at` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_notifications
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_notifications` (
	`id` INT(11) NOT NULL,
	`user_id` INT(11) NULL,
	`type` VARCHAR(50) NULL COLLATE 'utf8_general_ci',
	`source_id` INT(11) NULL,
	`lu` TINYINT(1) NULL,
	`created_at` TIMESTAMP NOT NULL,
	`from_user_id` INT(11) NULL,
	`from_pseudo` VARCHAR(50) NULL COLLATE 'utf8_general_ci',
	`from_photo` VARCHAR(255) NULL COLLATE 'utf8_general_ci',
	`oeuvre_id` INT(11) NULL
) ENGINE=MyISAM;

-- Listage de la structure de la vue supinfo. v_signalements
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_signalements` (
	`id` INT(11) NOT NULL,
	`type_contenu` VARCHAR(50) NULL COLLATE 'utf8_general_ci',
	`contenu_id` INT(11) NULL,
	`motif` VARCHAR(100) NULL COLLATE 'utf8_general_ci',
	`statut` VARCHAR(50) NULL COLLATE 'utf8_general_ci',
	`created_at` TIMESTAMP NOT NULL,
	`signaleur_id` INT(11) NOT NULL,
	`signaleur_pseudo` VARCHAR(50) NOT NULL COLLATE 'utf8_general_ci',
	`signaleur_photo` VARCHAR(255) NULL COLLATE 'utf8_general_ci'
) ENGINE=MyISAM;

CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_oeuvres_notes_moyennes` AS 
SELECT 
    `o`.`id` AS `oeuvre_id`,
    `o`.`titre` AS `oeuvre_titre`,
    `o`.`api_reference_id` AS `api_reference_id`,
    ROUND(AVG(`c`.`note`), 2) AS `note_moyenne`,
    COUNT(`c`.`id`) AS `total_critiques`
FROM 
    `oeuvres` `o`
JOIN 
    `critiques` `c` ON `o`.`id` = `c`.`oeuvre_id`
GROUP BY 
    `o`.`id`;

-- Listage de la structure de la vue supinfo. v_bibliotheque_details
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_bibliotheque_details`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_bibliotheque_details` AS select `bi`.`id` AS `id`,`bi`.`user_id` AS `user_id`,`bi`.`oeuvre_id` AS `oeuvre_id`,`bi`.`updated_at` AS `updated_at`,`o`.`titre` AS `titre`,`o`.`description` AS `description`,`o`.`api_reference_id` AS `api_reference_id`,`s`.`id` AS `statut_id`,`s`.`code` AS `statut_code`,`s`.`libele` AS `statut_libele` from ((`bibliotheque_items` `bi` join `oeuvres` `o` on(`bi`.`oeuvre_id` = `o`.`id`)) join `statuts` `s` on(`bi`.`statut_id` = `s`.`id`));

-- Listage de la structure de la vue supinfo. v_bibliotheque_stats
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_bibliotheque_stats`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_bibliotheque_stats` AS select `bi`.`user_id` AS `user_id`,count(0) AS `total`,count(distinct `bi`.`oeuvre_id`) AS `oeuvres_uniques`,max(`bi`.`updated_at`) AS `derniere_mise_a_jour` from `bibliotheque_items` `bi` group by `bi`.`user_id`;

-- Listage de la structure de la vue supinfo. v_bibliotheque_stats_par_statut
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_bibliotheque_stats_par_statut`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_bibliotheque_stats_par_statut` AS select `bi`.`user_id` AS `user_id`,`s`.`code` AS `statut`,count(0) AS `count` from (`bibliotheque_items` `bi` join `statuts` `s` on(`bi`.`statut_id` = `s`.`id`)) group by `bi`.`user_id`,`s`.`id`;

-- Listage de la structure de la vue supinfo. v_commentaires
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_commentaires`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_commentaires` AS select `com`.`id` AS `id`,`com`.`user_id` AS `user_id`,`com`.`critique_id` AS `critique_id`,`com`.`contenu` AS `contenu`,`com`.`created_at` AS `created_at`,`com_user`.`pseudo` AS `pseudo`,`com_user`.`prenom` AS `prenom`,`com_user`.`nom` AS `nom`,`com_user`.`photo` AS `photo`,`cr`.`contenu` AS `critique_contenu`,`critique_author`.`pseudo` AS `critique_author_pseudo` from (((`commentaires` `com` join `users` `com_user` on(`com`.`user_id` = `com_user`.`id`)) join `critiques` `cr` on(`com`.`critique_id` = `cr`.`id`)) join `users` `critique_author` on(`cr`.`user_id` = `critique_author`.`id`));

-- Listage de la structure de la vue supinfo. v_critiques_complete
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_critiques_complete`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_critiques_complete` AS select `c`.`id` AS `id`,`c`.`user_id` AS `user_id`,`c`.`oeuvre_id` AS `oeuvre_id`,`c`.`note` AS `note`,`c`.`contenu` AS `contenu`,`c`.`created_at` AS `created_at`,`c`.`updated_at` AS `updated_at`,`u`.`pseudo` AS `pseudo`,`u`.`prenom` AS `prenom`,`u`.`nom` AS `nom`,`u`.`photo` AS `photo`,`o`.`titre` AS `oeuvre_titre`,`o`.`description` AS `oeuvre_description`,`o`.`api_reference_id` AS `api_reference_id`,(select count(0) from `likes_critiques` `lc` where `lc`.`critique_id` = `c`.`id`) AS `likes_count` from ((`critiques` `c` join `users` `u` on(`c`.`user_id` = `u`.`id`)) join `oeuvres` `o` on(`c`.`oeuvre_id` = `o`.`id`));

-- Listage de la structure de la vue supinfo. v_feed_activities
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_feed_activities`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_feed_activities` AS select 'critique' AS `type`,`c`.`id` AS `id`,`c`.`created_at` AS `created_at`,`u`.`id` AS `author_id`,`u`.`pseudo` AS `author_pseudo`,`u`.`photo` AS `author_photo`,`c`.`contenu` AS `contenu`,`c`.`note` AS `note`,`o`.`titre` AS `oeuvre_titre`,`o`.`api_reference_id` AS `oeuvre_api_ref`,NULL AS `liste_nom`,NULL AS `liste_visibilite` from ((`critiques` `c` join `users` `u` on(`c`.`user_id` = `u`.`id`)) join `oeuvres` `o` on(`c`.`oeuvre_id` = `o`.`id`)) union all select 'commentaire' AS `type`,`com`.`id` AS `id`,`com`.`created_at` AS `created_at`,`u`.`id` AS `author_id`,`u`.`pseudo` AS `author_pseudo`,`u`.`photo` AS `author_photo`,`com`.`contenu` AS `contenu`,NULL AS `note`,`o`.`titre` AS `oeuvre_titre`,`o`.`api_reference_id` AS `oeuvre_api_ref`,NULL AS `liste_nom`,NULL AS `liste_visibilite` from (((`commentaires` `com` join `users` `u` on(`com`.`user_id` = `u`.`id`)) join `critiques` `c` on(`com`.`critique_id` = `c`.`id`)) join `oeuvres` `o` on(`c`.`oeuvre_id` = `o`.`id`)) union all select 'liste' AS `type`,`l`.`id` AS `id`,`l`.`created_at` AS `created_at`,`u`.`id` AS `author_id`,`u`.`pseudo` AS `author_pseudo`,`u`.`photo` AS `author_photo`,`l`.`description` AS `contenu`,NULL AS `note`,NULL AS `oeuvre_titre`,NULL AS `oeuvre_api_ref`,`l`.`nom` AS `liste_nom`,`l`.`visibilite` AS `liste_visibilite` from (`listes` `l` join `users` `u` on(`l`.`user_id` = `u`.`id`)) where `l`.`visibilite` = 'PUBLIQUE';

-- Listage de la structure de la vue supinfo. v_followers
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_followers`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_followers` AS select `f`.`user_sub` AS `follower_id`,`u1`.`pseudo` AS `follower_pseudo`,`u1`.`prenom` AS `follower_prenom`,`u1`.`nom` AS `follower_nom`,`f`.`user_follow` AS `followed_id`,`u2`.`pseudo` AS `followed_pseudo`,`u2`.`prenom` AS `followed_prenom`,`u2`.`nom` AS `followed_nom`,`f`.`created_at` AS `followed_at` from ((`followers` `f` join `users` `u1` on(`u1`.`id` = `f`.`user_sub`)) join `users` `u2` on(`u2`.`id` = `f`.`user_follow`));

-- Listage de la structure de la vue supinfo. v_notifications
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_notifications`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_notifications` AS select `n`.`id` AS `id`,`n`.`user_id` AS `user_id`,`n`.`type` AS `type`,`n`.`source_id` AS `source_id`,`n`.`lu` AS `lu`,`n`.`created_at` AS `created_at`,`u`.`id` AS `from_user_id`,`u`.`pseudo` AS `from_pseudo`,`u`.`photo` AS `from_photo`,`c`.`oeuvre_id` AS `oeuvre_id` from ((`notifications` `n` left join `users` `u` on(`n`.`from_user_id` = `u`.`id`)) left join `critiques` `c` on(`c`.`id` = `n`.`source_id` and `n`.`type` in ('like','commentaire')));

-- Listage de la structure de la vue supinfo. v_signalements
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_signalements`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_signalements` AS select `s`.`id` AS `id`,`s`.`type_contenu` AS `type_contenu`,`s`.`contenu_id` AS `contenu_id`,`s`.`motif` AS `motif`,`s`.`statut` AS `statut`,`s`.`created_at` AS `created_at`,`u`.`id` AS `signaleur_id`,`u`.`pseudo` AS `signaleur_pseudo`,`u`.`photo` AS `signaleur_photo` from (`signalements` `s` join `users` `u` on(`s`.`signaleur_id` = `u`.`id`));

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

INSERT INTO `roles` (`id`, `label`) VALUES
(1, 'user'),
(2, 'moderator'),
(3, 'admin');

INSERT INTO `statuts` (`id`, `code`, `libele`) VALUES
(1, 'joue', 'Joué'),
(2, 'termine', 'Terminé'),
(3, 'envie', 'Envie');