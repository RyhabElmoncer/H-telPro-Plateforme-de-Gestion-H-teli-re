import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { roomsAPI, reservationsAPI } from '../../services/api';

export default function BookingPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: { adults: Number(searchParams.get('adults')) || 2, children: 0 },
    specialRequests: ''
  });

  useEffect(() => {
    roomsAPI.getOne(roomId).then(r => setRoom(r.data.data));
  }, [roomId]);

  const nights = form.checkIn && form.checkOut ? Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000) : 0;
  const subtotal = room ? room.price.perNight * nights : 0;
  const taxes = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + taxes;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nights < 1) return setError('Les dates sont invalides.');
    setLoading(true); setError('');
    try {
      const { data } = await reservationsAPI.create({ roomId, ...form });
      navigate(`/payment/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (!room) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div style={{maxWidth:900, margin:'0 auto', padding:'32px 24px'}}>
      <button className="btn btn-ghost" onClick={() => navigate(`/rooms/${roomId}`)} style={{marginBottom:24}}>← Retour</button>
      <h1 style={{fontFamily:'Cormorant Garamond, serif', fontSize:36, marginBottom:24}}>Finaliser votre réservation</h1>

      {error && <div className="alert alert-error" style={{marginBottom:20}}>{error}</div>}

      <div style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:32, alignItems:'start'}}>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><h3 className="card-title">Chambre sélectionnée</h3></div>
            <div className="card-body" style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:80, height:80, background:'linear-gradient(135deg, #f0ead6, #e8dfc8)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36}}>
                {room.type === 'suite' ? '🏨' : '🛏️'}
              </div>
              <div>
                <h4 style={{fontFamily:'Cormorant Garamond, serif', fontSize:22}}>{room.name}</h4>
                <p style={{color:'var(--text-secondary)', fontSize:13}}>Chambre N° {room.number} — Étage {room.floor}</p>
                <p style={{color:'var(--gold-dark)', fontWeight:600}}>€{room.price.perNight} / nuit</p>
              </div>
            </div>
          </div>

          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><h3 className="card-title">Dates & Voyageurs</h3></div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Arrivée</label>
                  <input type="date" className="form-control" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Départ</label>
                  <input type="date" className="form-control" value={form.checkOut} min={form.checkIn} onChange={e => setForm({...form, checkOut: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Adultes</label>
                  <select className="form-control" value={form.guests.adults} onChange={e => setForm({...form, guests: {...form.guests, adults: Number(e.target.value)}})}>
                    {Array.from({length: room.capacity.adults}, (_,i) => i+1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Enfants</label>
                  <select className="form-control" value={form.guests.children} onChange={e => setForm({...form, guests: {...form.guests, children: Number(e.target.value)}})}>
                    {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{marginBottom:24}}>
            <div className="card-header"><h3 className="card-title">Demandes spéciales</h3></div>
            <div className="card-body">
              <textarea className="form-control" rows={4} placeholder="Arrivée tardive, préférences de chambre, régimes alimentaires..." value={form.specialRequests} onChange={e => setForm({...form, specialRequests: e.target.value})} style={{resize:'vertical'}}/>
              <p style={{fontSize:12, color:'var(--text-muted)', marginTop:6}}>Nous ferons de notre mieux pour satisfaire vos demandes.</p>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading || nights < 1}>
            {loading ? 'Réservation...' : `Confirmer et payer (€${total})`}
          </button>
        </form>

        {/* Summary */}
        <div className="card" style={{position:'sticky', top:80}}>
          <div className="card-header"><h3 className="card-title">Récapitulatif</h3></div>
          <div className="card-body">
            <div style={{borderBottom:'1px solid var(--border)', paddingBottom:16, marginBottom:16}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:14}}>
                <span>€{room.price.perNight} × {nights} nuit{nights>1?'s':''}</span>
                <span>€{subtotal}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-secondary)'}}>
                <span>Taxes (10%)</span>
                <span>€{taxes}</span>
              </div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:18}}>
              <span>Total</span>
              <span style={{color:'var(--gold-dark)'}}>€{total}</span>
            </div>
            <div style={{marginTop:16, padding:12, background:'var(--mist)', borderRadius:'var(--radius)', fontSize:12, color:'var(--text-secondary)'}}>
              <strong>✅ Annulation gratuite</strong> jusqu'à 48h avant l'arrivée.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
