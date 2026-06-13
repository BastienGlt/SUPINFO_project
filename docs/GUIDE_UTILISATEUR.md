# Guide d'utilisation — ProjetFinal

Bienvenue sur **ProjetFinal**, la plateforme communautaire pour découvrir, noter et discuter de vos jeux vidéo préférés.

## Sommaire

1. [Premiers pas](#1-premiers-pas)
2. [Page d'accueil](#2-page-daccueil)
3. [Rechercher un jeu](#3-rechercher-un-jeu)
4. [Fiche d'un jeu](#4-fiche-dun-jeu)
5. [Ma Bibliothèque](#5-ma-bibliothèque)
6. [Mes Listes](#6-mes-listes)
7. [Profil et abonnements](#7-profil-et-abonnements)
8. [Messagerie privée](#8-messagerie-privée)
9. [Notifications](#9-notifications)
10. [Signaler un contenu](#10-signaler-un-contenu)
11. [Modération et administration](#11-modération-et-administration)
12. [Questions fréquentes](#12-questions-fréquentes)

---

## 1. Premiers pas

### Créer un compte / se connecter

1. Cliquez sur **Connexion** dans la barre de navigation.
2. Vous êtes redirigé vers la page d'authentification **Auth0** : connectez-vous (ou créez un compte) avec votre e-mail ou un fournisseur proposé.
3. Lors de votre **première connexion**, vous devez compléter votre profil :
   - **Prénom**, **Nom**, **Pseudo** (obligatoires)
   - **Bio** (optionnelle)
   - Votre avatar est repris automatiquement depuis votre compte Auth0.
4. Validez avec **Créer mon compte**. Vous êtes ensuite redirigé vers votre profil.

### Se déconnecter

Utilisez le bouton **Déconnexion** (menu latéral ou page profil).

---

## 2. Page d'accueil

La page d'accueil affiche :

- Une **barre de recherche avancée** (jeux, utilisateurs, listes publiques).
- Si vous êtes connecté : un **fil d'actualité** présentant les critiques, ajouts à des listes et activités récentes des personnes que vous suivez.
- Les **derniers avis publiés** par la communauté (note, contenu, jeu concerné), avec accès direct à la fiche du jeu correspondant.

---

## 3. Rechercher un jeu

Deux moyens de chercher un jeu (données fournies par RAWG) :

- **Barre de recherche rapide** (en haut, dans l'en-tête) : tapez le nom d'un jeu, une liste de résultats apparaît avec vignette, année et note. Si vous êtes connecté, trois boutons rapides permettent d'ajouter directement le jeu à votre bibliothèque : **Envie**, **En cours (Joue)**, **Terminé**.
- **Recherche avancée** (page d'accueil) : recherche multi-onglets — **Jeux**, **Utilisateurs**, **Listes publiques** — avec filtres par **genre** et **année de sortie**, et bouton de réinitialisation des filtres. Les résultats s'affichent sous forme de grille paginée.

Cliquer sur un jeu, un utilisateur ou une liste ouvre la page correspondante.

---

## 4. Fiche d'un jeu

La fiche d'un jeu présente :

- Sa **description**, ses **images** et ses informations issues de RAWG (genres, année, note globale).
- La **note moyenne** et le nombre de critiques laissées par les membres de la plateforme.
- La **liste des critiques/avis** des utilisateurs, avec note (1 à 5 étoiles), texte, likes et commentaires.

Si vous êtes connecté, vous pouvez :

- **Ajouter le jeu à votre bibliothèque** avec un statut : *Envie de jouer*, *En cours*, ou *Terminé*.
- **Rédiger votre propre avis** (note + texte), le **modifier** ou le **supprimer**.
- **Aimer (like)** les avis des autres joueurs.
- **Commenter** un avis, et consulter les commentaires existants.
- **Ajouter le jeu à une ou plusieurs de vos listes** personnalisées.
- **Signaler** un avis ou un commentaire problématique (voir [section 10](#10-signaler-un-contenu)).

---

## 5. Ma Bibliothèque

Accessible via **Ma Collection / Ma Biblio** (menu latéral ou navigation).

- Affiche tous les jeux que vous avez ajoutés, sous forme de tableau : **titre**, **statut** (coloré selon *Envie* / *En cours* / *Terminé*), **date de dernière mise à jour**.
- Vous pouvez **retirer un jeu** de votre collection via le bouton de suppression (une confirmation est demandée).

> Le statut d'un jeu se change directement depuis sa fiche (section 4) ou via les boutons rapides de la barre de recherche.

---

## 6. Mes Listes

Accessible via **Listes** (utilisateurs connectés).

- **Créer une liste** : nom, description (optionnelle), visibilité **Privée** ou **Publique**.
- **Modifier** ou **supprimer** une liste existante.
- **Déplier une liste** pour voir les jeux qu'elle contient, et **retirer** un jeu individuellement.
- Le nombre de jeux par liste est affiché.

Les listes **publiques** peuvent être retrouvées par les autres utilisateurs via la recherche avancée.

---

## 7. Profil et abonnements

### Mon profil

Accessible via **Profil**. Vous y retrouvez :

- Votre **avatar**, **nom/pseudo**, **bio**, **e-mail**, **date d'inscription**.
- Vos statistiques : nombre d'**abonnés** et d'**abonnements** (cliquables pour voir la liste).
- Votre **badge de rôle** (Membre, Modérateur ou Administrateur).
- Si vous êtes modérateur ou administrateur : un accès direct au **panel d'administration**.
- Le bouton **Déconnexion**.

### Profil d'un autre utilisateur

En cliquant sur le pseudo/avatar d'un autre membre, vous accédez à son profil public : avatar, pseudo, bio, statistiques, date d'inscription, et ses 10 derniers avis publics.

Depuis ce profil, vous pouvez :

- **Suivre** / **Ne plus suivre** cet utilisateur.
- Lui **envoyer un message privé**.

### Listes d'abonnés / abonnements

Depuis votre profil ou celui d'un autre utilisateur, cliquez sur le nombre d'abonnés ou d'abonnements pour afficher la liste correspondante (avatar, nom, bio courte), avec accès direct à chaque profil.

---

## 8. Messagerie privée

Accessible via **Messages** (utilisateurs connectés).

- La colonne de gauche liste vos **conversations** (pseudo du contact, aperçu du dernier message).
- Sélectionnez une conversation pour afficher l'historique des échanges (vos messages et ceux de votre interlocuteur sont visuellement distingués).
- Tapez votre message et envoyez-le.

Pour démarrer une nouvelle conversation, rendez-vous sur le profil d'un utilisateur et cliquez sur **Envoyer un message**.

---

## 9. Notifications

Accessible via l'icône **Notifications** (avec un badge indiquant le nombre de notifications non lues).

Vous êtes notifié lorsque :

- quelqu'un **aime** une de vos critiques ;
- quelqu'un **commente** une de vos critiques ;
- quelqu'un **commence à vous suivre**.

Chaque notification affiche une icône, le pseudo de la personne concernée, une description de l'action et la date. Les notifications non lues sont mises en évidence.

- **Marquer comme lue** une notification individuellement, ou utiliser **Tout marquer comme lu**.

---

## 10. Signaler un contenu

Sur un avis ou un commentaire, cliquez sur l'icône **drapeau / Signaler** :

1. Choisissez un motif : **Spoiler**, **Insulte**, **Contenu inapproprié**, **Spam**, **Autre**.
2. Validez l'envoi.
3. Une confirmation visuelle s'affiche.

Le signalement est ensuite transmis à l'équipe de modération (voir section suivante).

---

## 11. Modération et administration

Réservé aux comptes ayant le rôle **Modérateur** ou **Administrateur** (badge visible sur le profil, avec accès au **panel Admin**).

Le panel d'administration comprend plusieurs sections dépliables, avec un compteur indiquant les éléments en attente :

- **Signalements** : liste des contenus signalés (motif + aperçu). Actions possibles : **Masquer**, **Supprimer** ou **Ignorer** le signalement.
- **Critiques masquées** : permet de **rendre visible** à nouveau une critique masquée, ou de la **supprimer** définitivement.
- **Coups de cœur** *(Administrateur uniquement)* : gestion des contenus mis en avant, avec possibilité de **retirer** un coup de cœur.
- **Utilisateurs bannis** *(Administrateur uniquement)* : permet de **débannir** un utilisateur.
- **Utilisateurs avertis** : permet de **retirer un avertissement** appliqué à un utilisateur.

> Un utilisateur banni ne peut plus accéder aux fonctionnalités nécessitant une authentification (blocage appliqué automatiquement sur toutes les routes protégées).

---

## 12. Questions fréquentes

**Je viens de me connecter mais je ne vois pas mes données / je suis bloqué sur "Compléter mon profil".**
→ Remplissez le formulaire (Prénom, Nom, Pseudo obligatoires) et validez : votre compte applicatif sera créé en lien avec votre identité Auth0.

**Je ne trouve pas un jeu dans la recherche.**
→ Les jeux proviennent de la base RAWG ; vérifiez l'orthographe ou essayez un titre en anglais. Si le jeu n'existe pas encore côté RAWG, il ne pourra pas être ajouté.

**Je n'arrive pas à voir le contenu d'une liste ou d'un profil.**
→ Les listes et profils peuvent être **privés** : seul leur propriétaire peut les consulter en détail.

**Comment retirer un jeu de ma bibliothèque ou d'une liste ?**
→ Depuis **Ma Bibliothèque** ou **Mes Listes**, utilisez le bouton de suppression/retrait correspondant (une confirmation peut être demandée).

**J'ai signalé un contenu, que se passe-t-il ensuite ?**
→ Le signalement est transmis aux modérateurs/administrateurs, qui peuvent masquer ou supprimer le contenu concerné.
