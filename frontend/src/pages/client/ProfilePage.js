import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

export default function ProfilePage() {
  const { user, loadUser } = useAuth();
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault(); setMsg(''); setLoading(true);
    try {
      await authAPI.updateProfile(form);
      await loadUser();
      setMsg('✅ Profil mis à jour avec succès.');
    } catch { setMsg('❌ Erreur'); }
    finally { setLoading(false); }
  };

  const handlePw = async (e) => {
    e.preventDefault(); setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('❌ Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('✅ Mot de passe modifié.'); setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { setPwMsg('❌ ' + (err.response?.data?.message || 'Erreur')); }
    finally { setLoading(false); }
  };

  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'32px 24px'}}>
      <h1 style={{fontFamily:'Cormorant Garamond, serif', fontSize:40, marginBottom:32}}>Mon profil</h1>

      {/* Profile info */}
      <div className="card" style={{marginBottom:24}}>
        <div className="card-header">
          <h3 className="card-title">Informations personnelles</h3>
        </div>
        <div className="card-body">
          <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:20, padding:16, background:'var(--mist)', borderRadius:'var(--radius)'}}>
            <div style={{width:56, height:56, borderRadius:'50%', background:'var(--gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700}}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p style={{fontWeight:600, fontSize:18}}>{user?.firstName} {user?.lastName}</p>
              <p style={{color:'var(--text-secondary)', fontSize:13}}>{user?.email}</p>
              <span className="badge badge-gold">{user?.role === 'admin' ? 'Administrateur' : user?.role === 'receptionist' ? 'Réceptionniste' : 'Client'}</span>
            </div>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          <form onSubmit={handleProfile}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input type="text" className="form-control" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input type="text" className="form-control" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>Sauvegarder</button>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Changer le mot de passe</h3></div>
        <div className="card-body">
          {pwMsg && <div className={`alert ${pwMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{pwMsg}</div>}
          <form onSubmit={handlePw}>
            <div className="form-group">
              <label className="form-label">Mot de passe actuel</label>
              <input type="password" className="form-control" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input type="password" className="form-control" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} minLength={6} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input type="password" className="form-control" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={loading}>Modifier le mot de passe</button>
          </form>
        </div>
      </div>
    </div>
  );
}
