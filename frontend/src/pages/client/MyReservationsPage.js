import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationsAPI } from '../../services/api';

const STATUS_CONFIG = {
  pending: { label: 'En attente', class: 'badge-warning' },
  confirmed: { label: 'Confirmée', class: 'badge-success' },
  checked_in: { label: 'En cours', class: 'badge-info' },
  checked_out: { label: 'Terminée', class: 'badge-gray' },
  cancelled: { label: 'Annulée', class: 'badge-error' },
  no_show: { label: 'Non présenté', class: 'badge-error' }
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const { data } = await reservationsAPI.getMy();
      setReservations(data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    setCancellingId(id);
    try {
      await reservationsAPI.cancel(id, { reason: 'Annulée par le client' });
      setReservations(prev => prev.map(r => r._id === id ? {...r, status: 'cancelled'} : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    } finally { setCancellingId(null); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div style={{maxWidth:900, margin:'0 auto', padding:'32px 24px'}}>
      <h1 style={{fontFamily:'Cormorant Garamond, serif', fontSize:40, marginBottom:8}}>Mes Réservations</h1>
      <p style={{color:'var(--text-secondary)', marginBottom:32}}>{reservations.length} réservation{reservations.length !== 1 ? 's' : ''}</p>

      {reservations.length === 0 ? (
        <div style={{textAlign:'center', padding:60}}>
          <div style={{fontSize:64, marginBottom:16}}>🛏️</div>
          <h3 style={{fontFamily:'Cormorant Garamond, serif', fontSize:28, marginBottom:8}}>Aucune réservation</h3>
          <p style={{color:'var(--text-secondary)', marginBottom:24}}>Vous n'avez pas encore de réservation.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/rooms')}>Découvrir nos chambres</button>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {reservations.map(r => (
            <div key={r._id} className="card">
              <div className="card-body" style={{display:'grid', gridTemplateColumns:'1fr auto', gap:20}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                    <h3 style={{fontFamily:'Cormorant Garamond, serif', fontSize:22}}>{r.room?.name}</h3>
                    <span className={`badge ${STATUS_CONFIG[r.status]?.class}`}>{STATUS_CONFIG[r.status]?.label}</span>
                  </div>
                  <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:4}}>
                    📋 Réf: <strong>{r.reservationNumber}</strong>
                  </p>
                  <p style={{fontSize:14, marginBottom:4}}>
                    📅 {new Date(r.checkIn).toLocaleDateString('fr-FR')} → {new Date(r.checkOut).toLocaleDateString('fr-FR')}
                    <span style={{color:'var(--text-muted)', marginLeft:8}}>({r.pricing?.nights} nuit{r.pricing?.nights > 1 ? 's' : ''})</span>
                  </p>
                  <p style={{fontSize:14}}>
                    👥 {r.guests?.adults} adulte{r.guests?.adults > 1 ? 's' : ''}
                    {r.guests?.children > 0 && `, ${r.guests.children} enfant(s)`}
                  </p>
                  {r.paymentStatus === 'unpaid' && r.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" style={{marginTop:12}} onClick={() => navigate(`/payment/${r._id}`)}>
                      Procéder au paiement
                    </button>
                  )}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'Cormorant Garamond, serif', fontSize:28, fontWeight:700, color:'var(--gold-dark)', marginBottom:8}}>
                    €{r.pricing?.total}
                  </div>
                  <span className={`badge ${r.paymentStatus === 'paid' ? 'badge-success' : r.paymentStatus === 'refunded' ? 'badge-info' : 'badge-warning'}`} style={{marginBottom:12, display:'block'}}>
                    {r.paymentStatus === 'paid' ? '✅ Payé' : r.paymentStatus === 'refunded' ? '↩️ Remboursé' : '⏳ À payer'}
                  </span>
                  {['pending', 'confirmed'].includes(r.status) && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r._id)} disabled={cancellingId === r._id}>
                      {cancellingId === r._id ? '...' : 'Annuler'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
