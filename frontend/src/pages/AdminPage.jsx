import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Users, MessageSquare, Search, Phone, Mail,
  MapPin, Building, Trash2, X, ChevronRight, TrendingUp,
  ArrowLeft, Home, Eye, RefreshCw, Filter, User, Calendar,
  IndianRupee, BedDouble, Check
} from 'lucide-react';
import { adminAPI } from '../api';

const AdminPage = () => {
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ totalLeads: 0, newToday: 0, byCity: [], byStatus: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter]);

  const fetchData = async () => {
    try {
      const [leadsData, statsData] = await Promise.all([
        adminAPI.getLeads(),
        adminAPI.getStats(),
      ]);
      if (leadsData.success) setLeads(leadsData.leads);
      if (statsData.success) setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const filters = {};
      if (searchQuery) filters.search = searchQuery;
      if (statusFilter !== 'all') filters.status = statusFilter;
      const data = await adminAPI.getLeads(filters);
      if (data.success) setLeads(data.leads);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  };

  const openLeadDrawer = async (lead) => {
    try {
      const data = await adminAPI.getLead(lead.id);
      if (data.success) {
        setSelectedLead(data.lead);
        setSelectedMessages(data.messages || []);
        setIsDrawerOpen(true);
      }
    } catch (err) {
      console.error('Failed to load lead details:', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateLeadStatus(id, status);
      setSelectedLead((prev) => ({ ...prev, status }));
      fetchLeads();
      fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await adminAPI.deleteLead(id);
      setIsDrawerOpen(false);
      setSelectedLead(null);
      fetchLeads();
      fetchData();
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      new: { bg: 'rgba(108,92,231,0.15)', color: '#a78bfa', border: 'rgba(108,92,231,0.3)' },
      contacted: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
      closed: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
    };
    const s = map[status] || map.new;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
        borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}>
        {status || 'new'}
      </span>
    );
  };

  // ─── Stats Cards ───
  const statsCards = [
    { icon: <Users size={22} />, label: 'Total Leads', value: stats.totalLeads, gradient: 'linear-gradient(135deg, #6c5ce7, #a855f7)' },
    { icon: <TrendingUp size={22} />, label: 'New Today', value: stats.newToday, gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { icon: <MapPin size={22} />, label: 'Cities', value: stats.byCity?.length || 0, gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { icon: <Check size={22} />, label: 'Closed', value: stats.byStatus?.find(s => s.status === 'closed')?.count || 0, gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
  ];

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogo}>
            <span style={{ fontSize: '22px' }}>🏠</span>
          </div>
          <div>
            <div style={styles.sidebarTitle}>RentalBot</div>
            <div style={styles.sidebarSubtitle}>Admin Panel</div>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            onClick={() => setView('dashboard')}
            style={{ ...styles.navItem, ...(view === 'dashboard' ? styles.navItemActive : {}) }}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setView('leads')}
            style={{ ...styles.navItem, ...(view === 'leads' ? styles.navItemActive : {}) }}
          >
            <Users size={18} />
            <span>Leads</span>
            {leads.length > 0 && (
              <span style={styles.navBadge}>{leads.length}</span>
            )}
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <Link to="/" style={styles.backToChat}>
            <ArrowLeft size={16} />
            <span>Back to Chat</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>
              {view === 'dashboard' ? '📊 Dashboard' : '👥 Leads'}
            </h1>
            <p style={styles.pageSubtitle}>
              {view === 'dashboard' ? 'Overview of your rental leads' : 'Manage and track your leads'}
            </p>
          </div>
          <button onClick={fetchData} style={styles.refreshBtn}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              {statsCards.map((card, i) => (
                <div key={i} style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: card.gradient }}>
                    {card.icon}
                  </div>
                  <div style={styles.statValue}>{card.value}</div>
                  <div style={styles.statLabel}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* City & Status Breakdown */}
            <div style={styles.breakdownGrid}>
              <div style={styles.breakdownCard}>
                <h3 style={styles.breakdownTitle}>
                  <MapPin size={16} /> Leads by City
                </h3>
                {stats.byCity?.length > 0 ? stats.byCity.map((c, i) => (
                  <div key={i} style={styles.breakdownRow}>
                    <span style={styles.breakdownLabel}>{c.city || 'Unknown'}</span>
                    <span style={styles.breakdownValue}>{c.count}</span>
                  </div>
                )) : (
                  <p style={styles.emptyText}>No data yet</p>
                )}
              </div>
              <div style={styles.breakdownCard}>
                <h3 style={styles.breakdownTitle}>
                  <Filter size={16} /> Leads by Status
                </h3>
                {stats.byStatus?.length > 0 ? stats.byStatus.map((s, i) => (
                  <div key={i} style={styles.breakdownRow}>
                    <span>{getStatusBadge(s.status)}</span>
                    <span style={styles.breakdownValue}>{s.count}</span>
                  </div>
                )) : (
                  <p style={styles.emptyText}>No data yet</p>
                )}
              </div>
            </div>

            {/* Recent Leads */}
            <div style={styles.recentSection}>
              <h3 style={styles.breakdownTitle}>
                <MessageSquare size={16} /> Recent Leads
              </h3>
              {leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => openLeadDrawer(lead)}
                  style={styles.recentRow}
                >
                  <div style={styles.recentInfo}>
                    <span style={styles.recentName}>{lead.name || 'Unknown User'}</span>
                    <span style={styles.recentMeta}>
                      {lead.city && `📍 ${lead.city}`}
                      {lead.category && ` • 🏠 ${lead.category}`}
                      {lead.bedrooms && ` • ${lead.bedrooms}`}
                    </span>
                  </div>
                  <div style={styles.recentRight}>
                    {getStatusBadge(lead.status)}
                    <ChevronRight size={16} style={{ color: '#55556a' }} />
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p style={styles.emptyText}>No leads yet. Start chatting to capture leads!</p>
              )}
            </div>
          </div>
        )}

        {/* Leads View */}
        {view === 'leads' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            {/* Search & Filters */}
            <div style={styles.filtersRow}>
              <div style={styles.searchWrapper}>
                <Search size={16} style={{ color: '#55556a', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, email, city..."
                  style={styles.searchInput}
                  id="search-leads"
                />
              </div>
              <div style={styles.filterBtns}>
                {['all', 'new', 'contacted', 'closed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      ...styles.filterBtn,
                      ...(statusFilter === s ? styles.filterBtnActive : {}),
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>City</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      style={styles.tr}
                      onClick={() => openLeadDrawer(lead)}
                    >
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.nameAvatar}>
                            {(lead.name || '?')[0].toUpperCase()}
                          </div>
                          <span style={styles.nameText}>{lead.name || '—'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{lead.phone || '—'}</td>
                      <td style={styles.td}>{lead.city || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ textTransform: 'capitalize' }}>{lead.property_type || '—'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ textTransform: 'capitalize' }}>{lead.category || '—'}</span>
                      </td>
                      <td style={styles.td}>{getStatusBadge(lead.status)}</td>
                      <td style={{ ...styles.td, fontSize: '0.8rem', color: '#8888a0' }}>
                        {formatDate(lead.created_at)}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openLeadDrawer(lead); }}
                          style={styles.viewBtn}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && (
                <div style={styles.tableEmpty}>
                  <Users size={40} style={{ color: '#55556a', marginBottom: '12px' }} />
                  <p style={styles.emptyText}>No leads found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Lead Detail Drawer */}
      {isDrawerOpen && selectedLead && (
        <>
          <div style={styles.overlay} onClick={() => setIsDrawerOpen(false)}></div>
          <div style={styles.drawer}>
            <div style={styles.drawerHeader}>
              <h2 style={styles.drawerTitle}>Lead Details</h2>
              <button onClick={() => setIsDrawerOpen(false)} style={styles.drawerClose}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.drawerBody}>
              {/* Lead Info Card */}
              <div style={styles.detailCard}>
                <div style={styles.detailRow}>
                  <User size={15} style={{ color: '#6c5ce7' }} />
                  <span style={styles.detailLabel}>Name</span>
                  <span style={styles.detailValue}>{selectedLead.name || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <Phone size={15} style={{ color: '#10b981' }} />
                  <span style={styles.detailLabel}>Phone</span>
                  <span style={styles.detailValue}>{selectedLead.phone || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <Mail size={15} style={{ color: '#3b82f6' }} />
                  <span style={styles.detailLabel}>Email</span>
                  <span style={styles.detailValue}>{selectedLead.email || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <MapPin size={15} style={{ color: '#f59e0b' }} />
                  <span style={styles.detailLabel}>City</span>
                  <span style={styles.detailValue}>{selectedLead.city || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <MapPin size={15} style={{ color: '#ec4899' }} />
                  <span style={styles.detailLabel}>Area</span>
                  <span style={styles.detailValue}>{selectedLead.area || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <Home size={15} style={{ color: '#a855f7' }} />
                  <span style={styles.detailLabel}>Type</span>
                  <span style={{ ...styles.detailValue, textTransform: 'capitalize' }}>
                    {selectedLead.property_type || '—'}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <Building size={15} style={{ color: '#6c5ce7' }} />
                  <span style={styles.detailLabel}>Category</span>
                  <span style={{ ...styles.detailValue, textTransform: 'capitalize' }}>
                    {selectedLead.category || '—'}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <BedDouble size={15} style={{ color: '#10b981' }} />
                  <span style={styles.detailLabel}>Bedrooms</span>
                  <span style={styles.detailValue}>{selectedLead.bedrooms || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <IndianRupee size={15} style={{ color: '#f59e0b' }} />
                  <span style={styles.detailLabel}>Budget</span>
                  <span style={styles.detailValue}>
                    {selectedLead.budget_min || selectedLead.budget_max
                      ? `₹${selectedLead.budget_min?.toLocaleString() || '?'} — ₹${selectedLead.budget_max?.toLocaleString() || '?'}`
                      : '—'}
                  </span>
                </div>
                {selectedLead.priority_notes && (
                  <div style={styles.detailRow}>
                    <MessageSquare size={15} style={{ color: '#8888a0' }} />
                    <span style={styles.detailLabel}>Notes</span>
                    <span style={styles.detailValue}>{selectedLead.priority_notes}</span>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div style={styles.statusSection}>
                <span style={styles.statusLabel}>Update Status:</span>
                <div style={styles.statusBtns}>
                  {['new', 'contacted', 'closed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedLead.id, s)}
                      style={{
                        ...styles.statusBtn,
                        ...(selectedLead.status === s ? styles.statusBtnActive : {}),
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Transcript */}
              <div style={styles.transcriptSection}>
                <h3 style={styles.transcriptTitle}>
                  <MessageSquare size={16} /> Chat Transcript
                </h3>
                <div style={styles.transcriptList}>
                  {selectedMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.transcriptMsg,
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, rgba(108,92,231,0.3), rgba(168,85,247,0.3))'
                          : 'rgba(255,255,255,0.04)',
                        borderColor: msg.role === 'user'
                          ? 'rgba(108,92,231,0.3)'
                          : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={styles.transcriptRole}>
                        {msg.role === 'user' ? '👤 User' : '🏠 Bot'}
                      </div>
                      <div style={styles.transcriptContent}>{msg.content}</div>
                      <div style={styles.transcriptTime}>{formatDate(msg.created_at)}</div>
                    </div>
                  ))}
                  {selectedMessages.length === 0 && (
                    <p style={styles.emptyText}>No messages in this session</p>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteLead(selectedLead.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} />
                <span>Delete Lead</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   Styles
   ══════════════════════════════════════ */
const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    background: '#0a0a0f',
    overflow: 'hidden',
  },

  // Sidebar
  sidebar: {
    width: '260px',
    background: 'rgba(18, 18, 26, 0.95)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(20px)',
    flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sidebarLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(108,92,231,0.3)',
  },
  sidebarTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f0f0f5',
  },
  sidebarSubtitle: {
    fontSize: '0.72rem',
    color: '#55556a',
    fontWeight: '500',
    marginTop: '1px',
  },
  sidebarNav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px 14px',
    borderRadius: '10px',
    background: 'transparent',
    border: 'none',
    color: '#8888a0',
    fontSize: '0.88rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    background: 'rgba(108,92,231,0.12)',
    color: '#a78bfa',
    border: '1px solid rgba(108,92,231,0.2)',
  },
  navBadge: {
    marginLeft: 'auto',
    background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  sidebarFooter: {
    padding: '16px 12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  backToChat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#8888a0',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
  },

  // Main Content
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 32px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '28px',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#f0f0f5',
  },
  pageSubtitle: {
    fontSize: '0.85rem',
    color: '#55556a',
    marginTop: '4px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#8888a0',
    fontSize: '0.82rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '22px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
    color: '#fff',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#f0f0f5',
    lineHeight: '1',
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '0.78rem',
    color: '#8888a0',
    fontWeight: '500',
  },

  // Breakdown
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  breakdownCard: {
    padding: '22px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  breakdownTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#f0f0f5',
    marginBottom: '16px',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  breakdownLabel: {
    fontSize: '0.88rem',
    color: '#8888a0',
    textTransform: 'capitalize',
  },
  breakdownValue: {
    fontSize: '0.92rem',
    fontWeight: '700',
    color: '#f0f0f5',
  },

  // Recent Leads
  recentSection: {
    padding: '22px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  recentRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  recentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  recentName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#f0f0f5',
  },
  recentMeta: {
    fontSize: '0.78rem',
    color: '#55556a',
  },
  recentRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  // Leads Table
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: '250px',
    padding: '10px 16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: '#f0f0f5',
    fontSize: '0.88rem',
    outline: 'none',
  },
  filterBtns: {
    display: 'flex',
    gap: '6px',
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#8888a0',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterBtnActive: {
    background: 'rgba(108,92,231,0.15)',
    borderColor: 'rgba(108,92,231,0.3)',
    color: '#a78bfa',
  },
  tableContainer: {
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#55556a',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
  },
  tr: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  td: {
    padding: '14px 16px',
    fontSize: '0.85rem',
    color: '#f0f0f5',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  nameAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, rgba(108,92,231,0.3), rgba(168,85,247,0.3))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#a78bfa',
  },
  nameText: {
    fontWeight: '600',
  },
  viewBtn: {
    padding: '6px 10px',
    borderRadius: '8px',
    background: 'rgba(108,92,231,0.12)',
    border: '1px solid rgba(108,92,231,0.2)',
    color: '#a78bfa',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  tableEmpty: {
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '0.85rem',
    color: '#55556a',
  },

  // Drawer
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '520px',
    maxWidth: '100vw',
    height: '100vh',
    background: '#12121a',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideDrawer 0.3s ease',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  drawerTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#f0f0f5',
  },
  drawerClose: {
    padding: '8px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: '#8888a0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },

  // Detail Card
  detailCard: {
    padding: '20px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  detailLabel: {
    fontSize: '0.8rem',
    color: '#55556a',
    fontWeight: '500',
    minWidth: '70px',
  },
  detailValue: {
    fontSize: '0.88rem',
    color: '#f0f0f5',
    fontWeight: '500',
    flex: 1,
  },

  // Status Section
  statusSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  statusLabel: {
    fontSize: '0.82rem',
    color: '#8888a0',
    fontWeight: '600',
  },
  statusBtns: {
    display: 'flex',
    gap: '6px',
  },
  statusBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#8888a0',
    fontSize: '0.78rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statusBtnActive: {
    background: 'rgba(108,92,231,0.15)',
    borderColor: 'rgba(108,92,231,0.3)',
    color: '#a78bfa',
  },

  // Transcript
  transcriptSection: {
    marginBottom: '16px',
  },
  transcriptTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#f0f0f5',
    marginBottom: '14px',
  },
  transcriptList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '14px',
    borderRadius: '14px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  transcriptMsg: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '0.84rem',
  },
  transcriptRole: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#8888a0',
    marginBottom: '4px',
  },
  transcriptContent: {
    color: '#f0f0f5',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  transcriptTime: {
    fontSize: '0.65rem',
    color: '#55556a',
    marginTop: '6px',
  },

  // Delete
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#ef4444',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
  },
};

export default AdminPage;
