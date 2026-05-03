import React, { useState } from 'react';
import { notificationsAPI } from '../../services/api';
import './AdminPages.css';

export default function AdminNotifications() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [promoForm, setPromoForm] = useState({ subject: '', message: '', discount: '' });

  const sendTestNotification = async (type) => {
    setSending(true); setResult(''); setError('');
    try {
      await notificationsAPI.sendTest({ type });
      setResult(`Notification "${type}" envoyée avec succès via n8n`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur envoi — vérifiez que n8n est actif');
    }
    setSending(false);
  };

  const sendPromo = async (e) => {
    e.preventDefault(); setSending(true); setResult(''); setError('');
    try {
      await notificationsAPI.sendPromo(promoForm);
      setResult('Email promotionnel envoyé à tous les clients actifs');
      setPromoForm({ subject: '', message: '', discount: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur envoi promotion');
    }
    setSending(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Notifications & n8n</h1>
          <p>Gérez les notifications automatisées et les campagnes promotionnelles</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}<button onClick={() => setError('')}>×</button></div>}
      {result && <div className="alert alert-success">{result}<button onClick={() => setResult('')}>×</button></div>}

      <div className="notif-grid">
        <div className="notif-card">
          <h2>🔔 Notifications automatiques</h2>
          <p>Ces notifications sont envoyées automatiquement par le système via les webhooks n8n.</p>
          <div className="notif-list">
            {[
              { type: 'confirmation', icon: '✅', label: 'Confirmation de réservation', desc: 'Envoyée au client lors de la création d\'une réservation' },
              { type: 'reminder', icon: '⏰', label: 'Rappel avant arrivée', desc: 'Envoyé 24h avant la date d\'arrivée' },
              { type: 'cancellation', icon: '❌', label: 'Annulation', desc: 'Envoyée lors de l\'annulation d\'une réservation' },
              { type: 'payment', icon: '💳', label: 'Confirmation de paiement', desc: 'Envoyée après chaque paiement validé' },
            ].map(n => (
              <div key={n.type} className="notif-item">
                <div className="notif-item-info">
                  <span className="notif-icon">{n.icon}</span>
                  <div>
                    <strong>{n.label}</strong>
                    <p>{n.desc}</p>
                  </div>
                </div>
                <button className="btn-sm btn-edit" onClick={() => sendTestNotification(n.type)} disabled={sending}>
                  {sending ? '...' : 'Tester'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="notif-card">
          <h2>📧 Campagne Promotionnelle</h2>
          <p>Envoyez une offre spéciale à tous vos clients actifs.</p>
          <form onSubmit={sendPromo} className="room-form">
            <div className="form-group">
              <label>Sujet de l'email *</label>
              <input value={promoForm.subject} onChange={e => setPromoForm({...promoForm, subject: e.target.value})}
                required placeholder="Ex: Offre spéciale été 2025 🌞"/>
            </div>
            <div className="form-group">
              <label>Message *</label>
              <textarea value={promoForm.message} onChange={e => setPromoForm({...promoForm, message: e.target.value})}
                required rows="4" placeholder="Rédigez votre message promotionnel..."/>
            </div>
            <div className="form-group">
              <label>Réduction (%)</label>
              <input type="number" value={promoForm.discount} onChange={e => setPromoForm({...promoForm, discount: e.target.value})}
                min="1" max="90" placeholder="Ex: 20"/>
            </div>
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? 'Envoi...' : '📤 Envoyer la campagne'}
            </button>
          </form>
        </div>

        <div className="notif-card full-width">
          <h2>⚙️ Configuration n8n</h2>
          <div className="config-grid">
            <div className="config-item">
              <strong>URL du webhook</strong>
              <code>{process.env.REACT_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/hotel'}</code>
            </div>
            <div className="config-item">
              <strong>Statut</strong>
              <span className="badge badge-warning">Configurable dans .env</span>
            </div>
          </div>
          <div className="info-box">
            <h4>Comment configurer n8n ?</h4>
            <ol>
              <li>Démarrez n8n : <code>npx n8n</code></li>
              <li>Importez le workflow depuis <code>/n8n-workflows/hotel-notifications.json</code></li>
              <li>Configurez vos credentials email (SMTP) dans n8n</li>
              <li>Définissez <code>N8N_WEBHOOK_URL</code> dans le <code>.env</code> backend</li>
              <li>Activez le workflow dans l'interface n8n</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
