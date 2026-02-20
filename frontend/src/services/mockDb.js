// TRANSPOSITION DE TA BDD SQL EN OBJETS JS RELATIONNELS

export const DB = {
    roles: [
        { id: 1, label: 'Admin' },
        { id: 2, label: 'Membre' }
    ],

    users: [
        { 
            id: 1, 
            auth0_id: 'auth0|123456',
            prenom: 'Jean', 
            nom: 'Dupont', 
            pseudo: 'GamerPro123', 
            // Hash pour 'password123' sera écrasé par authService au lancement pour sécurité
            password_hash: '', 
            photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200', 
            bio: 'Tryharder sur les Souls-like et fan de RPG occidentaux.',
            email: 'gamer@test.com',
            role_id: 2,
            status: 'active',
            created_at: '2023-01-01T10:00:00Z'
        },
        { 
            id: 2, 
            auth0_id: 'auth0|789012',
            prenom: 'Alice', 
            nom: 'Martin', 
            pseudo: 'SoulsQueen', 
            password_hash: 'hash_dummy', 
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', 
            bio: 'Speedrunneuse sur Hollow Knight.',
            email: 'alice@test.com',
            role_id: 2,
            status: 'active',
            created_at: '2023-02-15T14:30:00Z'
        }
    ],

    followers: [
        { user_sub: 2, user_follow: 1, created_at: '2023-03-01T09:00:00Z' } // Alice suit Jean
    ],

    oeuvres: [
        { id: 101, api_reference_id: 'steam_123', titre: 'Elden Ring', description: "L'Entre-terre vous attend." },
        { id: 102, api_reference_id: 'steam_456', titre: 'Hollow Knight', description: "Un chef d'oeuvre indé." },
        { id: 103, api_reference_id: 'steam_789', titre: 'Baldur\'s Gate 3', description: "Le RPG ultime D&D." },
        { id: 104, api_reference_id: 'steam_000', titre: 'Cyberpunk 2077', description: "Wake up Samurai." }
    ],

    bibliotheque_items: [
        { id: 1, user_id: 1, oeuvre_id: 101, statut: 'termine', updated_at: '2023-06-01' },
        { id: 2, user_id: 1, oeuvre_id: 103, statut: 'en_cours', updated_at: '2023-11-10' },
        { id: 3, user_id: 1, oeuvre_id: 104, statut: 'envie', updated_at: '2023-12-01' },
        { id: 4, user_id: 2, oeuvre_id: 102, statut: 'termine', updated_at: '2023-05-05' }
    ],

    critiques: [
        { id: 1, user_id: 1, oeuvre_id: 101, note: 19, contenu: "Une direction artistique à couper le souffle.", created_at: '2023-06-02' },
        { id: 2, user_id: 2, oeuvre_id: 102, note: 20, contenu: "La perfection n'existe pas, sauf ici.", created_at: '2023-05-06' }
    ],

    commentaires: [
        { id: 1, user_id: 2, critique_id: 1, contenu: "Tout à fait d'accord avec toi !", created_at: '2023-06-03' }
    ],

    likes_critiques: [
        { user_id: 2, critique_id: 1, created_at: '2023-06-03' }
    ],

    // MESSAGERIE COMPLEXE
    conversations: [
        { id: 1, updated_at: '2023-12-05T18:30:00Z' }
    ],

    conversation_participants: [
        { conversation_id: 1, user_id: 1 },
        { conversation_id: 1, user_id: 2 }
    ],

    messages: [
        { id: 1, conversation_id: 1, user_id: 2, contenu: "Salut ! Tu avances sur BG3 ?", lu: true, created_at: '2023-12-05T18:00:00Z' },
        { id: 2, conversation_id: 1, user_id: 1, contenu: "Oui, je suis à l'acte 3 !", lu: true, created_at: '2023-12-05T18:05:00Z' },
        { id: 3, conversation_id: 1, user_id: 2, contenu: "Courage, c'est dense.", lu: false, created_at: '2023-12-05T18:30:00Z' }
    ]
};