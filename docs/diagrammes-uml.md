# Diagrammes UML — SUPCONTENT

Ce document contient les diagrammes UML de la documentation technique :

1. [Diagramme de cas d'utilisation](#1-diagramme-de-cas-dutilisation)

Les diagrammes sont écrits au format [Mermaid](https://mermaid.js.org/) : ils se rendent automatiquement dans GitHub, GitLab et VS Code (extension *Markdown Preview Mermaid Support*).

---

## 1. Diagramme de cas d'utilisation

Quatre profils d'acteurs sont gérés par l'application : **Visiteur** (non authentifié), **Utilisateur** (compte créé via Auth0), **Modérateur** et **Administrateur**. Chaque rôle hérite des droits du rôle précédent.

```mermaid
flowchart LR
    Visiteur(["Visiteur"])
    Utilisateur(["Utilisateur"])
    Moderateur(["Modérateur"])
    Administrateur(["Administrateur"])

    Utilisateur -.->|hérite de| Visiteur
    Moderateur -.->|hérite de| Utilisateur
    Administrateur -.->|hérite de| Moderateur

    subgraph SUPCONTENT["Système SUPCONTENT"]
        UC01((Rechercher un jeu))
        UC02((Consulter une fiche jeu))
        UC03((Consulter profils et listes publics))
        UC04((S'inscrire ou se connecter via OAuth2))
        UC05((Gérer sa bibliotheque et ses statuts))
        UC06((Creer et gerer des listes personnalisees))
        UC07((Noter et ecrire une critique))
        UC08((Aimer et commenter une critique))
        UC09((Suivre ou ne plus suivre un utilisateur))
        UC10((Consulter le fil d'actualite))
        UC11((Gerer ses notifications))
        UC12((Signaler une critique ou un commentaire))
        UC13((Modifier son profil et ses preferences))
        UC14((Traiter les signalements))
        UC15((Masquer ou afficher une critique))
        UC16((Avertir un utilisateur))
        UC17((Bannir ou debannir un utilisateur))
        UC18((Mettre en avant une critique - coup de coeur))
    end

    Visiteur --> UC01
    Visiteur --> UC02
    Visiteur --> UC03
    Visiteur --> UC04

    Utilisateur --> UC05
    Utilisateur --> UC06
    Utilisateur --> UC07
    Utilisateur --> UC08
    Utilisateur --> UC09
    Utilisateur --> UC10
    Utilisateur --> UC11
    Utilisateur --> UC12
    Utilisateur --> UC13

    Moderateur --> UC14
    Moderateur --> UC15
    Moderateur --> UC16

    Administrateur --> UC17
    Administrateur --> UC18
```