import React, { useState, useEffect } from 'react';
import { reservationsAPI } from '../../services/api';
import './AdminPages.css';

const STATUS_LABELS = { pending: 'En attente', confirmed: 'Confirmée', checked_in: 'Arrivé', checked_out: 'Parti', cancelled: 'Annulée' };
const STATUS_COLORS = { pending: 'warning', confirmed: 'info', checked_in: 'success', checked_out: 'default', cancelled: 'error' };

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchReservations(); }, [filter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await reservationsAPI.getAll(params);
      setReservations(res.data.data || []);
    } catch { setError('Erreur chargement réservations'); }
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await reservationsAPI.updateStatus(id, newStatus);
      setSuccess('Statut mis à jour');
      fetchReservations();
      setSelected(null);
    } catch (err) { setError(err.response?.data?.message || 'Erreur mise à jour'); }
  };

  const filtered = reservations.filter(r => {
    const q = search.toLowerCase();
    return !q || r.reservationNumber?.includes(q) ||
      r.client?.firstName?.toLowerCase().includes(q) ||
      r.client?.lastName?.toLowerCase().includes(q) ||
      r.room?.roomNumber?.includes(q);
  });

  const nights = (r) => {
    const d = Math.ceil((new Date(r.checkOut) - new Date(r.checkIn)) / 86400000);
    return d > 0 ? d : 1;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Gestion des Réservations</h1>
          <p>Suivez et gérez toutes les réservations</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}<button onClick={() => setError('')}>×</button></div>}
      {success && <div className="alert alert-success">{success}<button onClick={() => setSuccess('')}>×</button></div>}

      <div className="toolbar">
        <div className="filter-tabs">
          {[['all','Toutes'],['pending','En attente'],['confirmed','Confirmées'],['checked_in','Arrivées'],['checked_out','Parties'],['cancelled','Annulées']].map(([v,l]) => (
            <button key={v} className={`tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <input className="search-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {loading ? <div className="loading-spinner">Chargement...</div> : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>N° Réservation</th>
                <th>Client</th>
                <th>Chambre</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Nuits</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="empty-cell">Aucune réservation trouvée</td></tr>
              ) : filtered.map(r => (
                <tr key={r._id} onClick={() => setSelected(r)} className="clickable-row">
                  <td><code>{r.reservationNumber}</code></td>
                  <td>{r.client ? `${r.client.firstName} ${r.client.lastName}` : 'N/A'}</td>
                  <td>{r.room ? `Ch. ${r.room.roomNumber} (${r.room.type})` : 'N/A'}</td>
                  <td>{new Date(r.checkIn).toLocaleDateString('fr-FR')}</td>
                  <td>{new Date(r.checkOut).toLocaleDateString('fr-FR')}</td>
                  <td>{nights(r)}</td>
                  <td><strong>{r.totalPrice} DT</strong></td>
                  <td><span className={`badge badge-${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <select className="status-select" value={r.status} onChange={e => handleStatusChange(r._id, e.target.value)}>
                      {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setSelected(null)}>
          <div className="modal-medium">
            <div className="modal-header">
              <h2>Détail — {selected.reservationNumber}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="detail-grid">
              <div className="detail-section">
                <h3>Client</h3>
                <p>{selected.client?.firstName} {selected.client?.lastName}</p>
                <p>{selected.client?.email}</p>
                <p>{selected.client?.phone}</p>
              </div>
              <div className="detail-section">
                <h3>Chambre</h3>
                <p>Chambre {selected.room?.roomNumber}</p>
                <p>Type : {selected.room?.type}</p>
                <p>Étage : {selected.room?.floor}</p>
              </div>
              <div className="detail-section">
                <h3>Séjour</h3>
                <p>Arrivée : {new Date(selected.checkIn).toLocaleDateString('fr-FR')}</p>
                <p>Départ : {new Date(selected.checkOut).toLocaleDateString('fr-FR')}</p>
                <p>Durée : {nights(selected)} nuit(s)</p>
              </div>
              <div className="detail-section">
                <h3>Facturation</h3>
                <p>Prix chambre : {selected.room?.pricePerNight} DT/nuit</p>
                <p>Taxes (10%) : {Math.round(selected.totalPrice * 10 / 110)} DT</p>
                <p><strong>Total : {selected.totalPrice} DT</strong></p>
              </div>
            </div>
            {selected.specialRequests && (
              <div className="detail-section full-width">
                <h3>Demandes spéciales</h3>
                <p>{selected.specialRequests}</p>
              </div>
            )}
            <div className="modal-footer">
              <select className="status-select-lg" value={selected.status} onChange={e => handleStatusChange(selected._id, e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className="btn-secondary" onClick={() => setSelected(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
