import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { roomsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './RoomsPage.css';

const AMENITY_LABELS = {
  wifi: '📶 WiFi', tv: '📺 TV', minibar: '🍸 Minibar', jacuzzi: '🛁 Jacuzzi',
  balcony: '🌅 Balcon', sea_view: '🌊 Vue mer', pool_view: '🏊 Vue piscine',
  air_conditioning: '❄️ Climatisation', safe: '🔒 Coffre-fort', coffee_maker: '☕ Café',
  bathrobe: '🩱 Peignoir', hair_dryer: '💨 Sèche-cheveux', parking: '🅿️ Parking',
  room_service: '🍽️ Room service', gym_access: '🏋️ Salle de sport'
};

const TYPE_LABELS = {
  simple: 'Chambre Simple', double: 'Chambre Double',
  double_superieure: 'Double Supérieure', suite: 'Suite',
  suite_presidentielle: 'Suite Présidentielle', familiale: 'Familiale', penthouse: 'Penthouse'
};

export function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    minPrice: '', maxPrice: '',
    adults: searchParams.get('adults') || ''
  });
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  useEffect(() => {
    loadRooms();
  }, [filters]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (checkIn && checkOut) {
        // get available rooms
        const { data } = await roomsAPI.getAvailable({ ...params, checkIn, checkOut });
        setRooms(data.data);
      } else {
        const { data } = await roomsAPI.getAll(params);
        setRooms(data.data.filter(r => !r.isArchived));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rooms-page">
      <div className="rooms-header">
        <div className="container">
          <h1 className="rooms-page-title">Nos Chambres & Suites</h1>
          {checkIn && checkOut && (
            <p className="rooms-dates">Disponibilités du <strong>{new Date(checkIn).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(checkOut).toLocaleDateString('fr-FR')}</strong></p>
          )}
        </div>
      </div>

      <div className="rooms-layout container">
        <aside className="filters-sidebar">
          <h3>Filtres</h3>
          <div className="filter-group">
            <label>Type de chambre</label>
            <select className="form-control" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option value="">Tous</option>
              {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Prix min (€)</label>
            <input type="number" className="form-control" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice: e.target.value})} placeholder="0" />
          </div>
          <div className="filter-group">
            <label>Prix max (€)</label>
            <input type="number" className="form-control" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} placeholder="999" />
          </div>
          <button className="btn btn-secondary btn-sm" style={{width:'100%', marginTop:8}} onClick={() => setFilters({type:'',minPrice:'',maxPrice:'',adults:''})}>Réinitialiser</button>
        </aside>

        <div className="rooms-grid-section">
          {loading ? (
            <div className="loading-center"><div className="spinner"/></div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <p>Aucune chambre disponible pour ces critères.</p>
              <Link to="/rooms" className="btn btn-primary" style={{marginTop:16}}>Voir toutes les chambres</Link>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map(room => (
                <div key={room._id} className="room-card" onClick={() => navigate(`/rooms/${room._id}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`)}>
                  <div className="room-card-img">
                    {room.primaryImage ? <img src={room.primaryImage} alt={room.name}/> : <span>{room.type === 'penthouse' ? '✨' : room.type === 'suite' ? '🏨' : '🛏️'}</span>}
                    <div className="room-card-badge">{TYPE_LABELS[room.type]}</div>
                  </div>
                  <div className="room-card-body">
                    <div className="room-card-header">
                      <h3>{room.name}</h3>
                      <span className="room-card-num">N° {room.number}</span>
                    </div>
                    <p className="room-card-desc">{room.description}</p>
                    <div className="room-card-amenities">
                      {room.amenities?.slice(0,4).map(a => <span key={a} className="amenity-tag">{AMENITY_LABELS[a]}</span>)}
                    </div>
                    <div className="room-card-footer">
                      <div>
                        <span className="room-price">€{room.price.perNight}</span>
                        <span className="room-price-label"> / nuit</span>
                      </div>
                      <div className="room-capacity">👥 {room.capacity.adults} adultes</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomsPage;
