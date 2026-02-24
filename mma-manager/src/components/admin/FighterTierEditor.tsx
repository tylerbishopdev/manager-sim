import { useAdminStore } from '../../store/adminStore';
import {
  createBlankFighterTier,
  type FighterTierDefinition,
} from '../../types/admin';
import { validateFighterTier } from './validation';

const PRESET_COLORS = [
  '#6b7280', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
];

export default function FighterTierEditor() {
  const {
    bundle, editingId, setEditingId,
    addFighterTier, updateFighterTier, removeFighterTier, reorderFighterTiers,
  } = useAdminStore();

  const tiers = bundle.fighterTiers;
  const editing = editingId ? tiers.find((t) => t.id === editingId) : null;
  const validation = editing ? validateFighterTier(editing) : null;

  const handleNew = () => {
    const t = createBlankFighterTier();
    addFighterTier(t);
  };

  const handleUpdate = (updates: Partial<FighterTierDefinition>) => {
    if (editingId) updateFighterTier(editingId, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this tier?')) removeFighterTier(id);
  };

  const handleDuplicate = () => {
    if (!editing) return;
    const copy = createBlankFighterTier();
    copy.name = editing.name + ' (copy)';
    copy.minOverall = editing.minOverall;
    copy.maxOverall = editing.maxOverall;
    copy.potentialCap = editing.potentialCap;
    copy.scoutCostRange = [...editing.scoutCostRange];
    copy.fightPurseRange = [...editing.fightPurseRange];
    copy.salaryRange = [...editing.salaryRange];
    copy.color = editing.color;
    addFighterTier(copy);
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const arr = [...tiers];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    reorderFighterTiers(arr);
  };

  const moveDown = (idx: number) => {
    if (idx >= tiers.length - 1) return;
    const arr = [...tiers];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    reorderFighterTiers(arr);
  };

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Fighter Tiers</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ New Tier</button>
      </div>

      <div className="admin-editor-layout">
        {/* List panel */}
        <div className="admin-list-panel">
          <div className="admin-item-list">
            {tiers.length === 0 && <div className="admin-empty">No tiers defined</div>}
            {tiers.map((t, idx) => {
              const v = validateFighterTier(t);
              return (
                <div
                  key={t.id}
                  className={`admin-item ${editingId === t.id ? 'active' : ''}`}
                  onClick={() => setEditingId(t.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div
                      style={{
                        width: 12, height: 12, borderRadius: 2,
                        background: t.color, flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="admin-item-name">{t.name || 'Untitled'}</div>
                      <div className="admin-item-meta">
                        <span>Stats: {t.minOverall}-{t.maxOverall}</span>
                        <span>Cap: {t.potentialCap}</span>
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
                      disabled={idx === tiers.length - 1}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stat range overview */}
          {tiers.length > 0 && (
            <div style={{ marginTop: 12, padding: 8, border: '1px solid #333', background: '#0a0a1a' }}>
              <div style={{ fontSize: 8, color: '#888', marginBottom: 6, letterSpacing: 1 }}>STAT RANGE OVERVIEW</div>
              {tiers.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 8, color: t.color, width: 60, textAlign: 'right' }}>
                    {t.name || '?'}
                  </span>
                  <div style={{ flex: 1, height: 8, background: '#1a1a2e', position: 'relative', borderRadius: 2 }}>
                    <div style={{
                      position: 'absolute',
                      left: `${(t.minOverall / 10) * 100}%`,
                      width: `${((t.maxOverall - t.minOverall) / 10) * 100}%`,
                      height: '100%',
                      background: t.color,
                      borderRadius: 2,
                      opacity: 0.7,
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: `${(t.potentialCap / 10) * 100}%`,
                      width: 2, height: '100%',
                      background: '#fff',
                      opacity: 0.5,
                    }} />
                  </div>
                  <span style={{ fontSize: 7, color: '#666', width: 24 }}>{t.minOverall}-{t.maxOverall}</span>
                </div>
              ))}
              <div style={{ fontSize: 7, color: '#555', marginTop: 4 }}>
                Bar = stat range | White line = potential cap
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="admin-detail-panel">
          {!editing ? (
            <div className="admin-empty-detail">Select or create a fighter tier</div>
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

              <div className="admin-form-row">
                <label>Tier Name</label>
                <input className="admin-input" value={editing.name} onChange={(e) => handleUpdate({ name: e.target.value })} placeholder="e.g. regional" />
              </div>

              <div className="admin-form-row">
                <label>Badge Color</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      onClick={() => handleUpdate({ color })}
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        background: color, cursor: 'pointer',
                        border: editing.color === color ? '2px solid #fff' : '2px solid transparent',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={editing.color}
                    onChange={(e) => handleUpdate({ color: e.target.value })}
                    style={{ width: 32, height: 24, cursor: 'pointer', border: 'none', background: 'none' }}
                  />
                </div>
              </div>

              {/* Stat range */}
              <div className="admin-section-header">
                <h3>Stat Range (1-10)</h3>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Min Overall</label>
                  <input className="admin-input" type="number" min={1} max={10} value={editing.minOverall} onChange={(e) => handleUpdate({ minOverall: +e.target.value })} />
                </div>
                <div className="admin-form-row">
                  <label>Max Overall</label>
                  <input className="admin-input" type="number" min={1} max={10} value={editing.maxOverall} onChange={(e) => handleUpdate({ maxOverall: +e.target.value })} />
                </div>
              </div>

              <div className="admin-form-row">
                <label>Potential Cap</label>
                <input className="admin-input" type="number" min={1} max={10} value={editing.potentialCap} onChange={(e) => handleUpdate({ potentialCap: +e.target.value })} />
              </div>

              {/* Visual range bar */}
              <div className="admin-form-row">
                <label>Visual Range</label>
                <div style={{ height: 16, background: '#1a1a2e', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute',
                    left: `${(editing.minOverall / 10) * 100}%`,
                    width: `${((editing.maxOverall - editing.minOverall) / 10) * 100}%`,
                    height: '100%',
                    background: editing.color,
                    opacity: 0.6,
                    borderRadius: 4,
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: `${(editing.potentialCap / 10) * 100}%`,
                    width: 3, height: '100%',
                    background: '#fff',
                    opacity: 0.8,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#666', marginTop: 2 }}>
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                </div>
              </div>

              {/* Economy ranges */}
              <div className="admin-section-header">
                <h3>Economy</h3>
              </div>

              <div className="admin-form-row">
                <label>Scout Cost Range ($)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="admin-input" type="number" min={0} placeholder="Min" value={editing.scoutCostRange[0]}
                    onChange={(e) => handleUpdate({ scoutCostRange: [+e.target.value, editing.scoutCostRange[1]] })} />
                  <span style={{ color: '#666', alignSelf: 'center' }}>to</span>
                  <input className="admin-input" type="number" min={0} placeholder="Max" value={editing.scoutCostRange[1]}
                    onChange={(e) => handleUpdate({ scoutCostRange: [editing.scoutCostRange[0], +e.target.value] })} />
                </div>
              </div>

              <div className="admin-form-row">
                <label>Fight Purse Range ($)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="admin-input" type="number" min={0} placeholder="Min" value={editing.fightPurseRange[0]}
                    onChange={(e) => handleUpdate({ fightPurseRange: [+e.target.value, editing.fightPurseRange[1]] })} />
                  <span style={{ color: '#666', alignSelf: 'center' }}>to</span>
                  <input className="admin-input" type="number" min={0} placeholder="Max" value={editing.fightPurseRange[1]}
                    onChange={(e) => handleUpdate({ fightPurseRange: [editing.fightPurseRange[0], +e.target.value] })} />
                </div>
              </div>

              <div className="admin-form-row">
                <label>Weekly Salary Range ($)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="admin-input" type="number" min={0} placeholder="Min" value={editing.salaryRange[0]}
                    onChange={(e) => handleUpdate({ salaryRange: [+e.target.value, editing.salaryRange[1]] })} />
                  <span style={{ color: '#666', alignSelf: 'center' }}>to</span>
                  <input className="admin-input" type="number" min={0} placeholder="Max" value={editing.salaryRange[1]}
                    onChange={(e) => handleUpdate({ salaryRange: [editing.salaryRange[0], +e.target.value] })} />
                </div>
              </div>

              <div className="admin-form-footer">
                <button className="admin-btn admin-btn-sm" onClick={handleDuplicate}>Duplicate</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(editing.id)}>Delete Tier</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
