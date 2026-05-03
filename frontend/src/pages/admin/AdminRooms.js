import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../../services/api';
import './AdminPages.css';

const ROOM_TYPES = ['Simple', 'Double', 'Suite', 'Deluxe', 'Familiale', 'Présidentielle'];
const AMENITIES_LIST = ['WiFi', 'TV', 'Climatisation', 'Minibar', 'Coffre-fort', 'Balcon', 'Vue mer', 'Jacuzzi', 'Room service', 'Parking'];

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [filter, setFilter] = useState('active');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    roomNumber: '', type: 'Double', floor: '', pricePerNight: '',
    capacity: 2, description: '', amenities: [], images: []
  });

  useEffect(() => { fetchRooms(); }, [filter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? { includeArchived: true } : filter === 'archived' ? { archived: true } : {};
      const res = await roomsAPI.getAll(params);
      setRooms(res.data.data || []);
    } catch { setError('Erreur lors du chargement des chambres'); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditRoom(null);
    setForm({ roomNumber: '', type: 'Double', floor: '', pricePerNight: '', capacity: 2, description: '', amenities: [], images: [] });
    setShowForm(true);
  };

  const openEdit = (room) => {
    setEditRoom(room);
    setForm({
      roomNumber: room.roomNumber, type: room.type, floor: room.floor,
      pricePerNight: room.pricePerNight, capacity: room.capacity,
      description: room.description || '', amenities: room.amenities || [], images: []
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editRoom) {
        await roomsAPI.update(editRoom._id, form);
        setSuccess('Chambre mise à jour avec succès');
      } else {
        await roomsAPI.create(form);
        setSuccess('Chambre créée avec succès');
      }
      setShowForm(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archiver cette chambre ?')) return;
    try {
      await roomsAPI.archive(id);
      setSuccess('Chambre archivée'); fetchRooms();
    } catch (err) { setError(err.response?.data?.message || 'Erreur archivage'); }
  };

  const handleRestore = async (id) => {
    try {
      await roomsAPI.restore(id);
      setSuccess('Chambre restaurée'); fetchRooms();
    } catch { setError('Erreur restauration'); }
  };

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a]
    }));
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Gestion des Chambres</h1>
          <p>Gérez votre inventaire de chambres</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Nouvelle Chambre</button>
      </div>

      {error && <div className="alert alert-error">{error}<button onClick={() => setError('')}>×</button></div>}
      {success && <div className="alert alert-success">{success}<button onClick={() => setSuccess('')}>×</button></div>}

      <div className="filter-tabs">
        {[['active', 'Actives'], ['archived', 'Archivées'], ['all', 'Toutes']].map(([v, l]) => (
          <button key={v} className={`tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="loading-spinner">Chargement...</div> : (
        <div className="rooms-grid">
          {rooms.length === 0 ? <div className="empty-state">Aucune chambre trouvée</div> :
            rooms.map(room => (
              <div key={room._id} className={`room-card ${room.isArchived ? 'archived' : ''}`}>
                <div className="room-card-header">
                  <span className="room-number">Ch. {room.roomNumber}</span>
                  <span className={`status-badge ${room.isArchived ? 'archived' : room.status === 'available' ? 'available' : 'occupied'}`}>
                    {room.isArchived ? 'Archivée' : room.status === 'available' ? 'Libre' : 'Occupée'}
                  </span>
                </div>
                <div className="room-card-body">
                  <div className="room-type">{room.type}</div>
                  <div className="room-info">
                    <span>🏢 Étage {room.floor}</span>
                    <span>👥 {room.capacity} pers.</span>
                    <span>💰 {room.pricePerNight} DT/nuit</span>
                  </div>
                  {room.amenities?.length > 0 && (
                    <div className="amenities-list">
                      {room.amenities.slice(0, 3).map(a => <span key={a} className="amenity-tag">{a}</span>)}
                      {room.amenities.length > 3 && <span className="amenity-tag">+{room.amenities.length - 3}</span>}
                    </div>
                  )}
                </div>
                <div className="room-card-actions">
                  {!room.isArchived && <button className="btn-sm btn-edit" onClick={() => openEdit(room)}>Modifier</button>}
                  {room.isArchived
                    ? <button className="btn-sm btn-restore" onClick={() => handleRestore(room._id)}>Restaurer</button>
                    : <button className="btn-sm btn-archive" onClick={() => handleArchive(room._id)}>Archiver</button>
                  }
                </div>
              </div>
            ))
          }
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-large">
            <div className="modal-header">
              <h2>{editRoom ? 'Modifier la Chambre' : 'Nouvelle Chambre'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="room-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Numéro de chambre *</label>
                  <input type="text" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} required placeholder="Ex: 101"/>
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Étage *</label>
                  <input type="number" value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} required min="0" max="50"/>
                </div>
                <div className="form-group">
                  <label>Prix / nuit (DT) *</label>
                  <input type="number" value={form.pricePerNight} onChange={e => setForm({...form, pricePerNight: e.target.value})} required min="1"/>
                </div>
                <div className="form-group">
                  <label>Capacité *</label>
                  <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} required min="1" max="10"/>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" placeholder="Décrivez la chambre..."/>
              </div>
              <div className="form-group">
                <label>Équipements</label>
                <div className="amenities-grid">
                  {AMENITIES_LIST.map(a => (
                    <label key={a} className={`amenity-check ${form.amenities.includes(a) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} style={{display:'none'}}/>
                      {a}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary">{editRoom ? 'Mettre à jour' : 'Créer la chambre'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
