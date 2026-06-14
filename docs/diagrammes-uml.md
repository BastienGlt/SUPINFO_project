# Diagrammes UML — SUPCONTENT

Ce document contient les diagrammes UML de la documentation technique :

1. [Diagramme de cas d'utilisation](#1-diagramme-de-cas-dutilisation)
2. [Diagramme de séquence — Recherche et consultation d'une fiche jeu (intégration RAWG)](#2-diagramme-de-séquence--recherche-et-consultation-dune-fiche-jeu-intégration-rawg)
3. [Modèle de données (diagramme entité-association)](#3-modèle-de-données-diagramme-entité-association)

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

---

## 2. Diagramme de séquence — Recherche et consultation d'une fiche jeu (intégration RAWG)

Ce diagramme illustre l'interaction entre le client (web ou mobile), l'API tierce **RAWG** et le backend **SUPCONTENT** lors d'une recherche, de la consultation d'une fiche jeu, puis de la publication d'une critique.

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant C as Client (Web / Mobile)
    participant R as API RAWG (tierce)
    participant B as Backend SUPCONTENT
    participant DB as Base de donnees MySQL

    U->>C: Saisit "Zelda" dans la barre de recherche
    C->>R: GET /games?search=Zelda
    R-->>C: Liste de jeux (id, titre, jaquette, note RAWG)
    C-->>U: Affiche la liste des resultats

    U->>C: Clique sur un jeu
    C->>R: GET /games/{id}
    R-->>C: Details du jeu (resume, genres, plateformes, date de sortie)

    par Enrichissement avec les donnees communautaires SUPCONTENT
        C->>B: GET /oeuvres/{api_reference_id}/note-moyenne
        B->>DB: SELECT note moyenne et nb critiques WHERE api_reference_id = ...
        DB-->>B: note_moyenne, total_critiques
        B-->>C: { note_moyenne, total_critiques }
    and
        C->>B: GET /critiques/{api_reference_id}/ratings
        B->>DB: SELECT critiques + auteurs WHERE oeuvre.api_reference_id = ...
        DB-->>B: liste des critiques SUPCONTENT
        B-->>C: liste des critiques
    end

    C-->>U: Affiche la fiche jeu (donnees RAWG + donnees communautaires)

    U->>C: Note le jeu et publie une critique
    C->>B: POST /critiques/{api_reference_id}/ratings { note, contenu, titre, description }
    B->>DB: findOrCreate oeuvre (api_reference_id, titre, description)
    DB-->>B: oeuvre.id
    B->>DB: INSERT INTO critiques (user_id, oeuvre_id, note, contenu)
    DB-->>B: critique creee
    B-->>C: 201 Created
    C-->>U: Confirme la publication de la critique
```

---

## 3. Modèle de données (diagramme entité-association)

Reflète le schéma MySQL réel (`backend/config/schema.sql`).

```mermaid
erDiagram
    ROLES {
        int id PK
        string label
    }
    STATUTS {
        int id PK
        string code
        string libele
    }
    USERS {
        int id PK
        string auth0_id
        string prenom
        string nom
        string pseudo
        string photo
        string bio
        string email
        int role_id FK
        string status
        boolean public
        datetime created_at
        datetime updated_at
    }
    OEUVRES {
        int id PK
        string api_reference_id
        string titre
        string description
    }
    CRITIQUES {
        int id PK
        int user_id FK
        int oeuvre_id FK
        int note
        string contenu
        datetime created_at
        datetime updated_at
        boolean featured
        boolean hidden
    }
    COMMENTAIRES {
        int id PK
        int user_id FK
        int critique_id FK
        string contenu
        datetime created_at
    }
    LIKES_CRITIQUES {
        int user_id FK
        int critique_id FK
        datetime created_at
    }
    BIBLIOTHEQUE_ITEMS {
        int id PK
        int user_id FK
        int oeuvre_id FK
        int statut_id FK
        datetime updated_at
    }
    LISTES {
        int id PK
        int user_id FK
        string nom
        string description
        string visibilite
        datetime created_at
    }
    LISTE_OEUVRES {
        int liste_id FK
        int oeuvre_id FK
        datetime added_at
        string statut
    }
    FOLLOWERS {
        int user_sub FK
        int user_follow FK
        datetime created_at
    }
    FOLLOW_REQUESTS {
        int id PK
        int requester_id FK
        int target_id FK
        string status
        datetime created_at
        datetime updated_at
    }
    NOTIFICATIONS {
        int id PK
        int user_id FK
        int from_user_id FK
        string type
        int source_id
        boolean lu
        datetime created_at
    }
    SIGNALEMENTS {
        int id PK
        int signaleur_id FK
        string type_contenu
        int contenu_id
        string motif
        string statut
        datetime created_at
    }
    CONVERSATIONS {
        int id PK
        datetime updated_at
    }
    CONVERSATION_PARTICIPANTS {
        int conversation_id FK
        int user_id FK
    }
    MESSAGES {
        int id PK
        int conversation_id FK
        int user_id FK
        string contenu
        boolean lu
        datetime created_at
    }

    ROLES ||--o{ USERS : possede
    STATUTS ||--o{ BIBLIOTHEQUE_ITEMS : definit
    USERS ||--o{ CRITIQUES : ecrit
    OEUVRES ||--o{ CRITIQUES : concerne
    USERS ||--o{ COMMENTAIRES : ecrit
    CRITIQUES ||--o{ COMMENTAIRES : recoit
    USERS ||--o{ LIKES_CRITIQUES : like
    CRITIQUES ||--o{ LIKES_CRITIQUES : recoit
    USERS ||--o{ BIBLIOTHEQUE_ITEMS : possede
    OEUVRES ||--o{ BIBLIOTHEQUE_ITEMS : referencee_dans
    USERS ||--o{ LISTES : cree
    LISTES ||--o{ LISTE_OEUVRES : contient
    OEUVRES ||--o{ LISTE_OEUVRES : figure_dans
    USERS ||--o{ FOLLOWERS : suit
    USERS ||--o{ FOLLOWERS : est_suivi_par
    USERS ||--o{ FOLLOW_REQUESTS : envoie_demande
    USERS ||--o{ FOLLOW_REQUESTS : recoit_demande
    USERS ||--o{ NOTIFICATIONS : recoit
    USERS ||--o{ NOTIFICATIONS : declenche
    USERS ||--o{ SIGNALEMENTS : signale
    CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS : reunit
    USERS ||--o{ CONVERSATION_PARTICIPANTS : participe
    CONVERSATIONS ||--o{ MESSAGES : contient
    USERS ||--o{ MESSAGES : envoie
```
