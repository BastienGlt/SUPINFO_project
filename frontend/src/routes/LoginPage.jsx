import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="page-center">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Lock color="white" />
          </div>
          <h2>Connexion</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Connecte-toi avec ton compte Auth0
          </p>
        </div>
        <button className="btn-primary" onClick={login}>
          Se connecter
        </button>
      </div>
    </div>
  );
}
