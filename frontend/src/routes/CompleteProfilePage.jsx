import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function CompleteProfilePage() {
  const prefill = JSON.parse(sessionStorage.getItem('auth0_prefill') || '{}');
  const [form, setForm] = useState({ prenom: '', nom: '', pseudo: '', bio: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { completeProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await completeProfile(form);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-center">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', overflow: 'hidden' }}>
            {prefill.photo
              ? <img src={prefill.photo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User color="white" />}
          </div>
          <h2>Complète ton profil</h2>
          {prefill.email && (
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {prefill.email}
            </p>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="input-field"
            placeholder="Prénom *"
            value={form.prenom}
            onChange={e => setForm({ ...form, prenom: e.target.value })}
            required
          />
          <input
            className="input-field"
            placeholder="Nom *"
            value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })}
            required
          />
          <input
            className="input-field"
            placeholder="Pseudo *"
            value={form.pseudo}
            onChange={e => setForm({ ...form, pseudo: e.target.value })}
            required
          />
          <textarea
            className="input-field"
            placeholder="Bio (optionnel)"
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            rows={3}
            style={{ resize: 'vertical' }}
          />
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
