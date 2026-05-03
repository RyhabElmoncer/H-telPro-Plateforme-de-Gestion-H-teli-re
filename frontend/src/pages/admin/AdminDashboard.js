import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const STATUS_COLORS = { pending: '#F59E0B', confirmed: '#10B981', checked_in: '#3B82F6', checked_out: '#6B7280', cancelled: '#EF4444', no_show: '#EC4899' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardAPI.getStats(), dashboardAPI.getActivity()])
      .then(([s, a]) => { setStats(s.data.data); setActivity(a.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div>;
  if (!stats) return null;

  const revenueData = (stats.revenue.byMonth || []).map(d => ({
    name: MONTHS[d._id.month - 1],
    revenu: Math.round(d.total)
  }));

  const statusData = (stats.reservations.byStatus || []).map(d => ({
    name: d._id, value: d.count, color: STATUS_COLORS[d._id] || '#6B7280'
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Tableau de bord</h2>
          <p className="page-subtitle">Vue d'ensemble de l'activité hôtelière</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gold">🏨</div>
          <div>
            <p className="stat-label">Chambres actives</p>
            <p className="stat-value">{stats.rooms.total}</p>
            <p className="stat-change">Taux d'occupation: {stats.rooms.occupationRate}%</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div>
            <p className="stat-label">Réservations</p>
            <p className="stat-value">{stats.reservations.total}</p>
            <p className="stat-change">Actives: {stats.reservations.active}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💶</div>
          <div>
            <p className="stat-label">Revenu du mois</p>
            <p className="stat-value">€{Math.round(stats.revenue.monthly).toLocaleString()}</p>
            <p className="stat-change">Total: €{Math.round(stats.revenue.total).toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">👥</div>
          <div>
            <p className="stat-label">Clients</p>
            <p className="stat-value">{stats.clients.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">📥</div>
          <div>
            <p className="stat-label">Check-ins aujourd'hui</p>
            <p className="stat-value">{stats.reservations.todayCheckIns}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📤</div>
          <div>
            <p className="stat-label">Check-outs aujourd'hui</p>
            <p className="stat-value">{stats.reservations.todayCheckOuts}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:24, marginBottom:28}}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Revenus (6 derniers mois)</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2}/><stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece3"/>
                <XAxis dataKey="name" fontSize={12}/>
                <YAxis fontSize={12}/>
                <Tooltip formatter={v => [`€${v}`, 'Revenu']}/>
                <Area type="monotone" dataKey="revenu" stroke="#C9A84C" strokeWidth={2} fill="url(#colorRev)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Réservations par statut</h3></div>
          <div className="card-body" style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
            <PieChart width={180} height={180}>
              <Pie data={statusData} cx={90} cy={90} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
            </PieChart>
            <div style={{width:'100%'}}>
              {statusData.map(s => (
                <div key={s.name} style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, marginBottom:4}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <div style={{width:10, height:10, borderRadius:2, background:s.color}}/>
                    <span style={{color:'var(--text-secondary)'}}>{s.name}</span>
                  </div>
                  <span style={{fontWeight:600}}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {activity && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Réservations récentes</h3></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Référence</th><th>Client</th><th>Chambre</th><th>Arrivée</th><th>Départ</th><th>Statut</th><th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {(activity.recentReservations || []).map(r => (
                  <tr key={r._id}>
                    <td><code style={{fontSize:12}}>{r.reservationNumber}</code></td>
                    <td>{r.client?.firstName} {r.client?.lastName}</td>
                    <td>{r.room?.name}</td>
                    <td style={{fontSize:13}}>{new Date(r.checkIn).toLocaleDateString('fr-FR')}</td>
                    <td style={{fontSize:13}}>{new Date(r.checkOut).toLocaleDateString('fr-FR')}</td>
                    <td><span className={`badge badge-${r.status === 'confirmed' ? 'success' : r.status === 'cancelled' ? 'error' : r.status === 'pending' ? 'warning' : 'gray'}`}>{r.status}</span></td>
                    <td style={{fontWeight:600}}>€{r.pricing?.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
