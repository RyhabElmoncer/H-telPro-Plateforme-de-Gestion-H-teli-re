import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const [search, setSearch] = useState({ checkIn: today, checkOut: tomorrow, adults: 2, type: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(search);
    navigate(`/rooms?${params}`);
  };

  const features = [
    { icon: '🏆', title: 'Prestige & Excellence', desc: 'Une expérience hôtelière de classe mondiale' },
    { icon: '🍳', title: 'Restaurant Gastronomique', desc: 'Une cuisine raffinée par des chefs étoilés' },
    { icon: '💆', title: 'Spa & Bien-être', desc: 'Détente et relaxation absolues' },
    { icon: '🔒', title: 'Sécurité 24/7', desc: 'Votre sécurité est notre priorité' },
  ];

  const roomTypes = [
    { name: 'Suite Prestige', price: 'À partir de 349€', img: '🏨', type: 'suite' },
    { name: 'Chambre Double', price: 'À partir de 149€', img: '🛏️', type: 'double' },
    { name: 'Penthouse Royal', price: 'À partir de 890€', img: '✨', type: 'penthouse' },
  ];

  return (
    <div className="homepage">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient"/>
        </div>
        <div className="hero-content">
          <p className="hero-tagline">Bienvenue au</p>
          <h1 className="hero-title">Grand<em>Hôtel</em></h1>
          <p className="hero-subtitle">Une expérience de luxe incomparable au cœur de la ville</p>
        </div>
      </section>

      {/* Search form */}
      <section className="search-section">
        <div className="container">
          <div className="search-card">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-field">
                <label>Arrivée</label>
                <input type="date" className="form-control" value={search.checkIn} min={today}
                  onChange={e => setSearch({...search, checkIn: e.target.value})} required />
              </div>
              <div className="search-field">
                <label>Départ</label>
                <input type="date" className="form-control" value={search.checkOut} min={search.checkIn}
                  onChange={e => setSearch({...search, checkOut: e.target.value})} required />
              </div>
              <div className="search-field">
                <label>Adultes</label>
                <select className="form-control" value={search.adults} onChange={e => setSearch({...search, adults: e.target.value})}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n} adulte{n>1?'s':''}</option>)}
                </select>
              </div>
              <div className="search-field">
                <label>Type de chambre</label>
                <select className="form-control" value={search.type} onChange={e => setSearch({...search, type: e.target.value})}>
                  <option value="">Tous les types</option>
                  <option value="simple">Simple</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                  <option value="familiale">Familiale</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary search-btn">Rechercher</button>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Pourquoi nous choisir</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room types */}
      <section className="rooms-preview">
        <div className="container">
          <h2 className="section-title">Nos Chambres & Suites</h2>
          <div className="rooms-grid">
            {roomTypes.map((room, i) => (
              <div key={i} className="room-preview-card" onClick={() => navigate(`/rooms?type=${room.type}`)}>
                <div className="room-preview-img">{room.img}</div>
                <div className="room-preview-info">
                  <h3>{room.name}</h3>
                  <p className="room-preview-price">{room.price} / nuit</p>
                  <span className="btn btn-secondary btn-sm">Voir les chambres</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
