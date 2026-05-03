import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../services/api';
import './AdminPages.css';

const METHOD_LABELS = { card: 'Carte bancaire', cash: 'Espèces', bank_transfer: 'Virement' };
const STATUS_LABELS = { pending: 'En attente', completed: 'Complété', failed: 'Échoué', refunded: 'Remboursé' };
const STATUS_COLORS = { pending: 'warning', completed: 'success', failed: 'error', refunded: 'info' };

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, revenue: 0 });

  useEffect(() => { fetchPayments(); }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await paymentsAPI.getAll(params);
      const data = res.data.data || [];
      setPayments(data);
      setStats({
        total: data.length,
        completed: data.filter(p => p.status === 'completed').length,
        failed: data.filter(p => p.status === 'failed').length,
        revenue: data.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0)
      });
    } catch { setError('Erreur chargement paiements'); }
    setLoading(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Gestion des Paiements</h1>
          <p>Historique et suivi des transactions</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}<button onClick={() => setError('')}>×</button></div>}

      <div className="stats-row">
        <div className="mini-stat"><span className="mini-stat-val">{stats.total}</span><span className="mini-stat-label">Total transactions</span></div>
        <div className="mini-stat success"><span className="mini-stat-val">{stats.completed}</span><span className="mini-stat-label">Complétées</span></div>
        <div className="mini-stat error"><span className="mini-stat-val">{stats.failed}</span><span className="mini-stat-label">Échouées</span></div>
        <div className="mini-stat gold"><span className="mini-stat-val">{stats.revenue.toFixed(0)} DT</span><span className="mini-stat-label">Revenu total</span></div>
      </div>

      <div className="filter-tabs">
        {[['all','Toutes'],['pending','En attente'],['completed','Complétées'],['failed','Échouées'],['refunded','Remboursées']].map(([v,l]) => (
          <button key={v} className={`tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="loading-spinner">Chargement...</div> : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr><th>Référence</th><th>Client</th><th>Réservation</th><th>Méthode</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
            </thead>
            <tbody>
              {payments.length === 0 ? <tr><td colSpan="7" className="empty-cell">Aucun paiement trouvé</td></tr> :
                payments.map(p => (
                  <tr key={p._id}>
                    <td><code>{p.transactionId || p._id?.slice(-8)}</code></td>
                    <td>{p.client ? `${p.client.firstName} ${p.client.lastName}` : '—'}</td>
                    <td><code>{p.reservation?.reservationNumber || '—'}</code></td>
                    <td>{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
                    <td><strong>{p.amount} DT</strong></td>
                    <td><span className={`badge badge-${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span></td>
                    <td>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
