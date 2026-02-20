import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const [form, setForm] = useState({ pseudo: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(form.pseudo, form.password);
        if (res.success) navigate('/profile');
        else setError(res.message);
    };

    return (
        <div className="page-center">
            <div className="login-card">
                <div style={{textAlign:'center', marginBottom:'2rem'}}>
                    <div style={{background:'var(--primary)', width:'50px', height:'50px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
                        <Lock color="white"/>
                    </div>
                    <h2>Connexion</h2>
                </div>
                {error && <div className="alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input className="input-field" placeholder="Pseudo" value={form.pseudo} onChange={e => setForm({...form, pseudo: e.target.value})} />
                    <input className="input-field" type="password" placeholder="Mot de passe" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    <button type="submit" className="btn-primary">Accéder au compte</button>
                </form>
                <div style={{textAlign:'center', marginTop:'1.5rem', fontSize:'0.8rem', color:'#64748b'}}>
                    Compte démo : <b>GamerPro123</b> / <b>password123</b>
                </div>
            </div>
        </div>
    );
}