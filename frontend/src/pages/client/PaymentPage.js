import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationsAPI, paymentsAPI } from '../../services/api';

export default function PaymentPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ number: '', holderName: '', expiryMonth: '', expiryYear: '', cvv: '' });

  useEffect(() => {
    reservationsAPI.getOne(reservationId).then(r => setReservation(r.data.data));
  }, [reservationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await paymentsAPI.process({
        reservationId,
        method,
        cardInfo: method === 'card' ? card : undefined
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return <div className="loading-screen"><div className="spinner"/></div>;

  if (success) return (
    <div style={{maxWidth:520, margin:'80px auto', textAlign:'center', padding:'0 24px'}}>
      <div style={{fontSize:72, marginBottom:24}}>✅</div>
      <h1 style={{fontFamily:'Cormorant Garamond, serif', fontSize:36, marginBottom:12}}>Paiement confirmé !</h1>
      <p style={{color:'var(--text-secondary)', marginBottom:8}}>Votre réservation <strong>{reservation.reservationNumber}</strong> est confirmée.</p>
      <p style={{color:'var(--text-secondary)', marginBottom:28}}>Un email de confirmation vous a été envoyé.</p>
      <button className="btn btn-primary btn-lg" onClick={() => navigate('/my-reservations')}>Voir mes réservations</button>
    </div>
  );

  return (
    <div style={{maxWidth:760, margin:'0 auto', padding:'32px 24px'}}>
      <h1 style={{fontFamily:'Cormorant Garamond, serif', fontSize:36, marginBottom:24}}>Paiement sécurisé</h1>

      {error && <div className="alert alert-error" style={{marginBottom:20}}>{error}</div>}

      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:28, alignItems:'start'}}>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><h3 className="card-title">Méthode de paiement</h3></div>
            <div className="card-body">
              <div style={{display:'flex', gap:12, marginBottom:20}}>
                {['card', 'cash', 'bank_transfer'].map(m => (
                  <button key={m} type="button"
                    className={`btn ${method === m ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMethod(m)}
                  >
                    {m === 'card' ? '💳 Carte' : m === 'cash' ? '💵 Espèces' : '🏦 Virement'}
                  </button>
                ))}
              </div>

              {method === 'card' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Numéro de carte</label>
                    <input type="text" className="form-control" value={card.number} onChange={e => setCard({...card, number: e.target.value.replace(/\s/g,'').replace(/(.{4})/g,'$1 ').trim()})} placeholder="0000 0000 0000 0000" maxLength={19} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nom du titulaire</label>
                    <input type="text" className="form-control" value={card.holderName} onChange={e => setCard({...card, holderName: e.target.value})} placeholder="JEAN MARTIN" required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Mois d'expiration</label>
                      <select className="form-control" value={card.expiryMonth} onChange={e => setCard({...card, expiryMonth: e.target.value})} required>
                        <option value="">MM</option>
                        {Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Année</label>
                      <select className="form-control" value={card.expiryYear} onChange={e => setCard({...card, expiryYear: e.target.value})} required>
                        <option value="">YYYY</option>
                        {Array.from({length:10},(_,i)=>String(new Date().getFullYear()+i)).map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input type="text" className="form-control" value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value})} placeholder="123" maxLength={4} required />
                    </div>
                  </div>
                  <div style={{padding:10, background:'#FEF9EC', borderRadius:'var(--radius)', fontSize:12, color:'var(--gold-dark)', border:'1px solid var(--gold-light)'}}>
                    🔒 <strong>Mode démo :</strong> Utilisez n'importe quel numéro sauf xxxx-xxxx-xxxx-0000 (refusé).
                  </div>
                </div>
              )}
              {method !== 'card' && <p style={{color:'var(--text-secondary)', fontSize:14}}>Le paiement par {method === 'cash' ? 'espèces' : 'virement'} sera réglé à l'hôtel.</p>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Traitement...' : `Payer €${reservation.pricing?.total}`}
          </button>
        </form>

        {/* Summary */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Récapitulatif</h3></div>
          <div className="card-body">
            <p style={{fontWeight:600, marginBottom:4}}>{reservation.room?.name}</p>
            <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:12}}>
              {new Date(reservation.checkIn).toLocaleDateString('fr-FR')} → {new Date(reservation.checkOut).toLocaleDateString('fr-FR')}
            </p>
            <div style={{borderTop:'1px solid var(--border)', paddingTop:12}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4}}><span>Sous-total</span><span>€{reservation.pricing?.subtotal}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-secondary)', marginBottom:8}}><span>Taxes</span><span>€{reservation.pricing?.taxes}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:18}}><span>Total</span><span style={{color:'var(--gold-dark)'}}>€{reservation.pricing?.total}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
