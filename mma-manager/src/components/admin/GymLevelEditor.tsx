import { useAdminStore } from '../../store/adminStore';
import {
  createBlankGymLevel,
  type GymLevelDefinition,
} from '../../types/admin';
import { validateGymLevel } from './validation';

export default function GymLevelEditor() {
  const {
    bundle, editingId, setEditingId,
    addGymLevel, updateGymLevel, removeGymLevel, reorderGymLevels,
  } = useAdminStore();

  const levels = [...bundle.gymLevels].sort((a, b) => a.level - b.level);
  const editing = editingId ? levels.find((g) => g.id === editingId) : null;
  const validation = editing ? validateGymLevel(editing) : null;

  const handleNew = () => {
    const g = createBlankGymLevel();
    g.level = levels.length > 0 ? Math.max(...levels.map((l) => l.level)) + 1 : 1;
    addGymLevel(g);
  };

  const handleUpdate = (updates: Partial<GymLevelDefinition>) => {
    if (editingId) updateGymLevel(editingId, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this gym level?')) removeGymLevel(id);
  };

  const handleDuplicate = () => {
    if (!editing) return;
    const copy = createBlankGymLevel();
    copy.level = levels.length > 0 ? Math.max(...levels.map((l) => l.level)) + 1 : 1;
    copy.name = editing.name + ' (copy)';
    copy.upgradeCost = editing.upgradeCost;
    copy.capacity = editing.capacity;
    copy.weeklyRent = editing.weeklyRent;
    copy.trainingBonus = editing.trainingBonus;
    copy.description = editing.description;
    addGymLevel(copy);
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const arr = [...levels];
    // Swap level numbers too
    const tmpLevel = arr[idx].level;
    arr[idx] = { ...arr[idx], level: arr[idx - 1].level };
    arr[idx - 1] = { ...arr[idx - 1], level: tmpLevel };
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    reorderGymLevels(arr);
  };

  const moveDown = (idx: number) => {
    if (idx >= levels.length - 1) return;
    const arr = [...levels];
    const tmpLevel = arr[idx].level;
    arr[idx] = { ...arr[idx], level: arr[idx + 1].level };
    arr[idx + 1] = { ...arr[idx + 1], level: tmpLevel };
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    reorderGymLevels(arr);
  };

  // Max values for progression bars
  const maxCapacity = Math.max(1, ...levels.map((l) => l.capacity));
  const maxRent = Math.max(1, ...levels.map((l) => l.weeklyRent));
  const maxCost = Math.max(1, ...levels.map((l) => l.upgradeCost));

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Gym Levels</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ New Level</button>
      </div>

      <div className="admin-editor-layout">
        {/* List panel */}
        <div className="admin-list-panel">
          <div className="admin-item-list">
            {levels.length === 0 && <div className="admin-empty">No gym levels defined</div>}
            {levels.map((g, idx) => {
              const v = validateGymLevel(g);
              return (
                <div
                  key={g.id}
                  className={`admin-item ${editingId === g.id ? 'active' : ''}`}
                  onClick={() => setEditingId(g.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 4,
                      background: '#1a1a2e', border: '1px solid #333',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#d4a017', fontWeight: 'bold',
                    }}>
                      {g.level}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="admin-item-name">{g.name || 'Untitled'}</div>
                      <div className="admin-item-meta">
                        <span>Cap: {g.capacity}</span>
                        <span>Rent: ${g.weeklyRent}/wk</span>
                        {!v.valid && <span className="admin-badge admin-badge-error">!</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      className="admin-btn admin-btn-xs"
                      onClick={(e) => { e.stopPropagation(); moveUp(idx); }}
                      disabled={idx === 0}
                    >
                      ▲
                    </button>
                    <button
                      className="admin-btn admin-btn-xs"
                      onClick={(e) => { e.stopPropagation(); moveDown(idx); }}
                      disabled={idx === levels.length - 1}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progression visualization */}
          {levels.length > 1 && (
            <div style={{ marginTop: 12, padding: 8, border: '1px solid #333', background: '#0a0a1a' }}>
              <div style={{ fontSize: 8, color: '#888', marginBottom: 6, letterSpacing: 1 }}>PROGRESSION OVERVIEW</div>
              {levels.map((g) => (
                <div key={g.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 8, color: '#aaa', marginBottom: 2 }}>
                    Lv.{g.level} {g.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {/* Capacity bar */}
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(g.capacity / maxCapacity) * 100}%`,
                          height: '100%', background: '#22c55e', borderRadius: 2,
                        }} />
                      </div>
                      <div style={{ fontSize: 6, color: '#555' }}>Cap: {g.capacity}</div>
                    </div>
                    {/* Rent bar */}
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(g.weeklyRent / maxRent) * 100}%`,
                          height: '100%', background: '#ef4444', borderRadius: 2,
                        }} />
                      </div>
                      <div style={{ fontSize: 6, color: '#555' }}>Rent: ${g.weeklyRent}</div>
                    </div>
                    {/* Upgrade cost bar */}
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(g.upgradeCost / maxCost) * 100}%`,
                          height: '100%', background: '#d4a017', borderRadius: 2,
                        }} />
                      </div>
                      <div style={{ fontSize: 6, color: '#555' }}>Cost: ${g.upgradeCost.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, fontSize: 7, color: '#555', marginTop: 4 }}>
                <span><span style={{ color: '#22c55e' }}>■</span> Capacity</span>
                <span><span style={{ color: '#ef4444' }}>■</span> Rent</span>
                <span><span style={{ color: '#d4a017' }}>■</span> Upgrade Cost</span>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="admin-detail-panel">
          {!editing ? (
            <div className="admin-empty-detail">Select or create a gym level</div>
          ) : (
            <div className="admin-form">
              {/* Validation errors */}
              {validation && !validation.valid && (
                <div className="admin-validation-errors">
                  {validation.errors.map((err, i) => (
                    <div key={i} className="admin-error-msg">{err}</div>
                  ))}
                </div>
              )}

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Level Number</label>
                  <input className="admin-input" type="number" min={1} value={editing.level} onChange={(e) => handleUpdate({ level: +e.target.value })} />
                </div>
                <div className="admin-form-row">
                  <label>Gym Name</label>
                  <input className="admin-input" value={editing.name} onChange={(e) => handleUpdate({ name: e.target.value })} placeholder="e.g. Strip Mall Gym" />
                </div>
              </div>

              <div className="admin-form-row">
                <label>Description</label>
                <textarea className="admin-input admin-textarea" value={editing.description} onChange={(e) => handleUpdate({ description: e.target.value })} rows={2} maxLength={120} />
                <span style={{ fontSize: 7, color: '#666' }}>{editing.description.length}/120</span>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Fighter Capacity</label>
                  <input className="admin-input" type="number" min={1} value={editing.capacity} onChange={(e) => handleUpdate({ capacity: +e.target.value })} />
                </div>
                <div className="admin-form-row">
                  <label>Upgrade Cost ($)</label>
                  <input className="admin-input" type="number" min={0} value={editing.upgradeCost} onChange={(e) => handleUpdate({ upgradeCost: +e.target.value })} />
                </div>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Weekly Rent ($)</label>
                  <input className="admin-input" type="number" min={0} value={editing.weeklyRent} onChange={(e) => handleUpdate({ weeklyRent: +e.target.value })} />
                </div>
                <div className="admin-form-row">
                  <label>Training Bonus (%)</label>
                  <input className="admin-input" type="number" min={0} max={50} value={editing.trainingBonus} onChange={(e) => handleUpdate({ trainingBonus: +e.target.value })} />
                </div>
              </div>

              {/* Summary card */}
              <div style={{
                marginTop: 12, padding: 10,
                background: '#0f0f23', border: '1px solid #333',
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 8, color: '#888', marginBottom: 6, letterSpacing: 1 }}>LEVEL SUMMARY</div>
                <div style={{ fontSize: 9, color: '#ccc', lineHeight: 1.8 }}>
                  <strong style={{ color: '#d4a017' }}>Lv.{editing.level} "{editing.name || '?'}"</strong><br />
                  Holds {editing.capacity} fighter{editing.capacity !== 1 ? 's' : ''} •
                  Rent: ${editing.weeklyRent}/week •
                  Training +{editing.trainingBonus}%<br />
                  {editing.upgradeCost > 0
                    ? `Costs $${editing.upgradeCost.toLocaleString()} to upgrade to this level`
                    : 'Starting level (no upgrade cost)'}
                </div>
              </div>

              <div className="admin-form-footer">
                <button className="admin-btn admin-btn-sm" onClick={handleDuplicate}>Duplicate</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(editing.id)}>Delete Level</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
