import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import './AdminPages.css';

const PERMS = [
  { key: 'canManageRooms', label: 'Gérer les chambres' },
  { key: 'canManageReservations', label: 'Gérer les réservations' },
  { key: 'canViewDashboard', label: 'Voir le tableau de bord' },
  { key: 'canManagePayments', label: 'Gérer les paiements' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'receptionist', password: '',
    permissions: { canManageRooms: false, canManageReservations: true, canViewDashboard: true, canManagePayments: false }
  });

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = roleFilter !== 'all' ? { role: roleFilter } : {};
      const res = await usersAPI.getAll(params);
      setUsers(res.data.data || []);
    } catch { setError('Erreur chargement utilisateurs'); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'receptionist', password: '',
      permissions: { canManageRooms: false, canManageReservations: true, canViewDashboard: true, canManagePayments: false }
    });
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '',
      role: u.role, password: '', permissions: u.permissions || {} });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editUser) {
        await usersAPI.update(editUser._id, payload);
        setSuccess('Utilisateur mis à jour');
      } else {
        await usersAPI.create(payload);
        setSuccess('Utilisateur créé');
      }
      setShowForm(false); fetchUsers();
    } catch (err) { setError(err.response?.data?.message || 'Erreur sauvegarde'); }
  };

  const toggleActive = async (u) => {
    try {
      await usersAPI.toggleActive(u._id);
      setSuccess(`Compte ${u.isActive ? 'désactivé' : 'activé'}`); fetchUsers();
    } catch { setError('Erreur changement statut'); }
  };

  const roleLabel = { admin: 'Admin', receptionist: 'Réceptionniste', client: 'Client', visitor: 'Visiteur' };
  const roleColor = { admin: 'error', receptionist: 'info', client: 'success', visitor: 'default' };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p>Gérez le personnel et les clients</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouveau Staff</button>
      </div>

      {error && <div className="alert alert-error">{error}<button onClick={() => setError('')}>×</button></div>}
      {success && <div className="alert alert-success">{success}<button onClick={() => setSuccess('')}>×</button></div>}

      <div className="filter-tabs">
        {[['all','Tous'],['admin','Admins'],['receptionist','Réceptionnistes'],['client','Clients']].map(([v,l]) => (
          <button key={v} className={`tab ${roleFilter===v?'active':''}`} onClick={() => setRoleFilter(v)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="loading-spinner">Chargement...</div> : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Statut</th><th>Inscrit le</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? <tr><td colSpan="7" className="empty-cell">Aucun utilisateur</td></tr> :
                users.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.firstName} {u.lastName}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`badge badge-${roleColor[u.role]}`}>{roleLabel[u.role]}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>{u.isActive ? 'Actif' : 'Inactif'}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {u.role !== 'admin' && <>
                        <button className="btn-sm btn-edit" onClick={() => openEdit(u)}>Modifier</button>
                        <button className={`btn-sm ${u.isActive ? 'btn-archive' : 'btn-restore'}`} onClick={() => toggleActive(u)}>
                          {u.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </>}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal-large">
            <div className="modal-header">
              <h2>{editUser ? 'Modifier Utilisateur' : 'Nouveau Membre Staff'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="room-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required/>
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Rôle *</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="receptionist">Réceptionniste</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{editUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editUser} minLength="6"/>
                </div>
              </div>
              {form.role === 'receptionist' && (
                <div className="form-group">
                  <label>Permissions du réceptionniste</label>
                  <div className="perms-grid">
                    {PERMS.map(p => (
                      <label key={p.key} className={`perm-check ${form.permissions[p.key] ? 'selected' : ''}`}>
                        <input type="checkbox" checked={!!form.permissions[p.key]}
                          onChange={e => setForm({...form, permissions: {...form.permissions, [p.key]: e.target.checked}})}
                          style={{marginRight:'8px'}}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editUser ? 'Mettre à jour' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
