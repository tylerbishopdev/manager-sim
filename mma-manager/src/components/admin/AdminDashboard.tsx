import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useAdminStore } from '../../store/adminStore';
import type { AdminSection } from '../../store/adminStore';
import { validateBundle } from './validation';
import { isAdminContentActive } from '../../services/contentResolver';
import { fetchActivity, setupSchema } from '../../services/adminApi';
import type { ActivityEntry } from '../../services/adminApi';

export default function AdminDashboard() {
  const {
    bundle, exportBundle, importBundle, resetBundle, undo, canUndo,
    setSection, lastSaved, getStorageUsage,
    syncStatus, dbConnected, lastSyncedAt, syncError, initFromApi,
  } = useAdminStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [settingUp, setSettingUp] = useState(false);

  const nameCount = bundle.namePool.firstNames.length + bundle.namePool.lastNames.length + bundle.namePool.nicknames.length;

  const stats: { label: string; count: number; section: AdminSection; icon: string }[] = [
    { label: 'Scenarios', count: bundle.scenarios.length, section: 'scenarios', icon: '\uD83C\uDFAC' },
    { label: 'Venues', count: bundle.venues.length, section: 'venues', icon: '\uD83C\uDFDF' },
    { label: 'Sponsors', count: bundle.sponsors.length, section: 'sponsors', icon: '\uD83D\uDCB0' },
    { label: 'Dialogs', count: bundle.dialogs.length, section: 'dialogs', icon: '\uD83D\uDCAC' },
    { label: 'Commentary', count: bundle.commentary.length, section: 'commentary', icon: '\uD83C\uDF99' },
    { label: 'Names', count: nameCount, section: 'names', icon: '\uD83D\uDCCB' },
    { label: 'Assets', count: bundle.assets.length, section: 'assets', icon: '\uD83D\uDDBC' },
    { label: 'Fighter Tiers', count: bundle.fighterTiers.length, section: 'fighter_tiers', icon: '\u2694' },
    { label: 'Gym Levels', count: bundle.gymLevels.length, section: 'gym_levels', icon: '\uD83C\uDFCB' },
  ];

  const validation = useMemo(() => validateBundle(bundle), [bundle]);
  const contentActive = isAdminContentActive();
  const storage = getStorageUsage();

  const totalItems = bundle.scenarios.length + bundle.venues.length + bundle.sponsors.length
    + bundle.dialogs.length + bundle.commentary.length + bundle.fighterTiers.length + bundle.gymLevels.length;

  // Load recent activity when DB is connected
  const loadActivity = useCallback(async () => {
    if (!dbConnected) return;
    const entries = await fetchActivity(10);
    setActivity(entries);
  }, [dbConnected]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity, lastSyncedAt]);

  // Timestamped export
  const handleExport = () => {
    const json = exportBundle();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    a.download = `mma-admin-bundle-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importBundle(reader.result as string);
      if (!ok) alert('Invalid bundle file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Reset all admin content? This will clear everything.')) {
      resetBundle();
    }
  };

  const handleUndo = () => {
    if (canUndo()) undo();
  };

  const handleSetupDb = async () => {
    setSettingUp(true);
    const ok = await setupSchema();
    if (ok) {
      await initFromApi();
    }
    setSettingUp(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const lastSavedStr = lastSaved
    ? new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  const lastSyncedStr = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  // DB status display
  const dbStatusLabel = (() => {
    switch (syncStatus) {
      case 'loading': return 'Connecting...';
      case 'saving': return 'Saving...';
      case 'error': return syncError ?? 'Error';
      case 'offline': return 'Offline';
      case 'idle': return dbConnected ? 'Connected' : 'Offline';
      default: return 'Unknown';
    }
  })();

  const dbStatusClass = (() => {
    if (syncStatus === 'error') return 'error';
    if (syncStatus === 'loading' || syncStatus === 'saving') return '';
    if (dbConnected) return 'success';
    return '';
  })();

  return (
    <div className="admin-dashboard">
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-subtitle">Manage your game content. Add scenarios, venues, sponsors, and more.</p>

      {/* Health cards */}
      <div className="admin-health-grid">
        <div className="admin-health-card">
          <div className="admin-health-card-title">Content Status</div>
          <div className={`admin-health-card-value ${contentActive ? 'success' : ''}`}>
            {contentActive ? '\u2713 Active' : '\u25CB No custom content'}
          </div>
        </div>
        <div className="admin-health-card">
          <div className="admin-health-card-title">Validation</div>
          <div className={`admin-health-card-value ${validation.totalErrors > 0 ? 'error' : 'success'}`}>
            {validation.totalErrors === 0 ? '\u2713 All clear' : `\u26A0 ${validation.totalErrors} error${validation.totalErrors !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="admin-health-card">
          <div className="admin-health-card-title">Database</div>
          <div className={`admin-health-card-value ${dbStatusClass}`}>
            {dbStatusLabel}
          </div>
          {!dbConnected && syncStatus === 'offline' && (
            <button
              className="admin-btn admin-btn-xs"
              onClick={handleSetupDb}
              disabled={settingUp}
              style={{ marginTop: 4, fontSize: 10 }}
            >
              {settingUp ? 'Setting up...' : 'Setup Database'}
            </button>
          )}
        </div>
        <div className="admin-health-card">
          <div className="admin-health-card-title">Last Saved</div>
          <div className="admin-health-card-value">{lastSavedStr}</div>
          {dbConnected && (
            <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2 }}>
              DB sync: {lastSyncedStr}
            </div>
          )}
        </div>
      </div>

      {/* Validation detail (if errors) */}
      {validation.totalErrors > 0 && (
        <div className="admin-guidance-banner admin-guidance-warning" style={{ marginBottom: 12 }}>
          <strong>Validation Issues</strong>
          <div style={{ fontSize: 11, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {validation.scenarioErrors > 0 && (
              <button className="admin-btn admin-btn-xs" onClick={() => setSection('scenarios')} style={{ textDecoration: 'underline', color: '#f59e0b', background: 'none', border: 'none', padding: 0, fontSize: 11 }}>
                Scenarios: {validation.scenarioErrors}
              </button>
            )}
            {validation.venueErrors > 0 && (
              <button className="admin-btn admin-btn-xs" onClick={() => setSection('venues')} style={{ textDecoration: 'underline', color: '#f59e0b', background: 'none', border: 'none', padding: 0, fontSize: 11 }}>
                Venues: {validation.venueErrors}
              </button>
            )}
            {validation.sponsorErrors > 0 && (
              <button className="admin-btn admin-btn-xs" onClick={() => setSection('sponsors')} style={{ textDecoration: 'underline', color: '#f59e0b', background: 'none', border: 'none', padding: 0, fontSize: 11 }}>
                Sponsors: {validation.sponsorErrors}
              </button>
            )}
            {validation.dialogErrors > 0 && (
              <button className="admin-btn admin-btn-xs" onClick={() => setSection('dialogs')} style={{ textDecoration: 'underline', color: '#f59e0b', background: 'none', border: 'none', padding: 0, fontSize: 11 }}>
                Dialogs: {validation.dialogErrors}
              </button>
            )}
            {validation.commentaryErrors > 0 && (
              <button className="admin-btn admin-btn-xs" onClick={() => setSection('commentary')} style={{ textDecoration: 'underline', color: '#f59e0b', background: 'none', border: 'none', padding: 0, fontSize: 11 }}>
                Commentary: {validation.commentaryErrors}
              </button>
            )}
            {validation.fighterTierErrors > 0 && (
              <button className="admin-btn admin-btn-xs" onClick={() => setSection('fighter_tiers')} style={{ textDecoration: 'underline', color: '#f59e0b', background: 'none', border: 'none', padding: 0, fontSize: 11 }}>
                Fighter Tiers: {validation.fighterTierErrors}
              </button>
            )}
            {validation.gymLevelErrors > 0 && (
              <button className="admin-btn admin-btn-xs" onClick={() => setSection('gym_levels')} style={{ textDecoration: 'underline', color: '#f59e0b', background: 'none', border: 'none', padding: 0, fontSize: 11 }}>
                Gym Levels: {validation.gymLevelErrors}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="admin-stat-grid">
        {stats.map((s) => (
          <button key={s.label} className="admin-stat-card" onClick={() => setSection(s.section)}>
            <span className="admin-stat-count">{s.icon} {s.count}</span>
            <span className="admin-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Storage usage */}
      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8b949e', marginBottom: 4 }}>
          <span>Local Storage</span>
          <span>{formatBytes(storage.used)} / {formatBytes(storage.limit)} ({storage.percentage}%)</span>
        </div>
        <div className="admin-storage-bar">
          <div
            className={`admin-storage-fill${storage.percentage > 80 ? ' danger' : storage.percentage > 60 ? ' warning' : ''}`}
            style={{ width: `${Math.min(100, storage.percentage)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="admin-actions-bar">
        <button className="admin-btn admin-btn-primary" onClick={handleExport}>Export Bundle</button>
        <button className="admin-btn admin-btn-secondary" onClick={handleImport}>Import Bundle</button>
        <button className="admin-btn admin-btn-secondary" onClick={handleUndo} disabled={!canUndo()}>
          Undo
        </button>
        <button className="admin-btn admin-btn-danger" onClick={handleReset}>Reset All</button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Recent Activity (only when DB connected) */}
      {dbConnected && activity.length > 0 && (
        <div className="admin-activity-section">
          <h3 className="admin-section-subtitle">Recent Activity</h3>
          <div className="admin-activity-list">
            {activity.map((entry) => (
              <div key={entry.id} className="admin-activity-row">
                <span className="admin-activity-action">{entry.action}</span>
                {entry.entity_type && (
                  <span className="admin-activity-entity">{entry.entity_type}</span>
                )}
                {entry.entity_name && (
                  <span className="admin-activity-name">{entry.entity_name}</span>
                )}
                <span className="admin-activity-time">
                  {new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bundle meta */}
      <div className="admin-meta">
        Bundle v{bundle.version} &middot; {totalItems} total items &middot; Game Settings: {bundle.gameSettings ? 'Configured' : 'Default'}
      </div>
    </div>
  );
}
