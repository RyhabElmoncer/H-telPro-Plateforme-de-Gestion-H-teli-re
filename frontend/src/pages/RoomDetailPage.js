import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { roomsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays } from 'date-fns';

const AMENITY_LABELS = {
  wifi: '📶 WiFi', tv: '📺 TV', minibar: '🍸 Minibar', jacuzzi: '🛁 Jacuzzi',
  balcony: '🌅 Balcon', sea_view: '🌊 Vue mer', pool_view: '🏊 Vue piscine',
  air_conditioning: '❄️ Climatisation', safe: '🔒 Coffre-fort', coffee_maker: '☕ Machine à café',
  bathrobe: '🩱 Peignoir', hair_dryer: '💨 Sèche-cheveux', parking: '🅿️ Parking',
  room_service: '🍽️ Room service', gym_access: '🏋️ Salle de sport'
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || tomorrow);
  const [adults, setAdults] = useState(2);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    roomsAPI.getOne(id).then(r => { setRoom(r.data.data); setLoading(false); }).catch(() => navigate('/rooms'));
  }, [id]);

  const checkAvailability = async () => {
    try {
      const { data } = await roomsAPI.getAvailability(id, { checkIn, checkOut });
      setAvailability(data.data.isAvailable);
    } catch {}
  };

  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000) : 0;
  const total = room ? Math.round(room.price.perNight * nights * 1.1) : 0;

  const handleBook = () => {
    if (!user) return navigate(`/login?redirect=/rooms/${id}`);
    if (user.role !== 'client') return alert('Seuls les clients peuvent réserver.');
    navigate(`/book/${id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!room) return null;

  return (
    <div style={{maxWidth:1100, margin:'0 auto', padding:'32px 24px'}}>
      <button className="btn btn-ghost" onClick={() => navigate('/rooms')} style={{marginBottom:20}}>← Retour</button>

      <div style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:32, alignItems:'start'}}>
        {/* Left */}
        <div>
          <div style={{background:'linear-gradient(135deg, #f0ead6, #e8dfc8)', height:340, borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:96, marginBottom:24}}>
            {room.type === 'penthouse' ? '✨' : room.type === 'suite' ? '🏨' : '🛏️'}
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                <h1 style={{fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:600}}>{room.name}</h1>
                <span style={{fontSize:13, color:'var(--text-muted)'}}>Chambre N° {room.number}</span>
              </div>
              <p style={{color:'var(--text-secondary)', lineHeight:1.7, marginBottom:24}}>{room.description}</p>

              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24}}>
                <div style={{background:'var(--mist)', padding:16, borderRadius:'var(--radius)', textAlign:'center'}}>
                  <div style={{fontSize:24}}>👥</div>
                  <div style={{fontSize:12, color:'var(--text-secondary)', marginTop:4}}>Capacité</div>
                  <div style={{fontWeight:600}}>{room.capacity.adults} adultes</div>
                </div>
                <div style={{background:'var(--mist)', padding:16, borderRadius:'var(--radius)', textAlign:'center'}}>
                  <div style={{fontSize:24}}>📐</div>
                  <div style={{fontSize:12, color:'var(--text-secondary)', marginTop:4}}>Surface</div>
                  <div style={{fontWeight:600}}>{room.size || '--'} m²</div>
                </div>
                <div style={{background:'var(--mist)', padding:16, borderRadius:'var(--radius)', textAlign:'center'}}>
                  <div style={{fontSize:24}}>🏢</div>
                  <div style={{fontSize:12, color:'var(--text-secondary)', marginTop:4}}>Étage</div>
                  <div style={{fontWeight:600}}>{room.floor}e étage</div>
                </div>
              </div>

              <h3 style={{fontFamily:'Cormorant Garamond, serif', fontSize:22, marginBottom:14}}>Équipements</h3>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                {room.amenities?.map(a => (
                  <span key={a} style={{background:'var(--mist)', border:'1px solid var(--border)', padding:'6px 14px', borderRadius:100, fontSize:13}}>
                    {AMENITY_LABELS[a]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking card */}
        <div className="card" style={{position:'sticky', top:80}}>
          <div className="card-body">
            <div style={{textAlign:'center', marginBottom:20}}>
              <span style={{fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:700, color:'var(--gold-dark)'}}>€{room.price.perNight}</span>
              <span style={{fontSize:13, color:'var(--text-muted)'}}> / nuit</span>
            </div>

            <div className="form-group">
              <label className="form-label">Arrivée</label>
              <input type="date" className="form-control" value={checkIn} min={today} onChange={e => { setCheckIn(e.target.value); setAvailability(null); }} />
            </div>
            <div className="form-group">
              <label className="form-label">Départ</label>
              <input type="date" className="form-control" value={checkOut} min={checkIn} onChange={e => { setCheckOut(e.target.value); setAvailability(null); }} />
            </div>
            <div className="form-group">
              <label className="form-label">Adultes</label>
              <select className="form-control" value={adults} onChange={e => setAdults(e.target.value)}>
                {Array.from({length: room.capacity.adults}, (_, i) => i+1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {nights > 0 && (
              <div style={{background:'var(--mist)', padding:16, borderRadius:'var(--radius)', marginBottom:16}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4}}>
                  <span>€{room.price.perNight} × {nights} nuit{nights>1?'s':''}</span>
                  <span>€{room.price.perNight * nights}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8, color:'var(--text-secondary)'}}>
                  <span>Taxes (10%)</span>
                  <span>€{Math.round(room.price.perNight * nights * 0.1)}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontWeight:700, borderTop:'1px solid var(--border)', paddingTop:8}}>
                  <span>Total</span>
                  <span>€{total}</span>
                </div>
              </div>
            )}

            {availability !== null && (
              <div className={`alert ${availability ? 'alert-success' : 'alert-error'}`} style={{marginBottom:12}}>
                {availability ? '✅ Chambre disponible pour ces dates.' : '❌ Chambre non disponible.'}
              </div>
            )}

            <button className="btn btn-secondary" style={{width:'100%', marginBottom:8}} onClick={checkAvailability}>
              Vérifier la disponibilité
            </button>
            <button className="btn btn-primary" style={{width:'100%'}} onClick={handleBook} disabled={nights < 1}>
              Réserver maintenant
            </button>

            {!user && <p style={{textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:8}}>Connexion requise pour réserver</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
