import { useState, useMemo } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { createBlankSponsor, type SponsorTemplate } from '../../types/admin';
import { validateSponsor } from './validation';
import AssetPickerModal from './AssetPickerModal';

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 (Basic)',
  2: 'Tier 2 (Mid)',
  3: 'Tier 3 (Premium)',
};

export default function SponsorEditor() {
  const { bundle, editingId, setEditingId, addSponsor, updateSponsor, removeSponsor } = useAdminStore();
  const [filter, setFilter] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const sponsors = bundle.sponsors.filter(
    (s) => !filter || s.name.toLowerCase().includes(filter.toLowerCase())
  );

  const editing = editingId ? bundle.sponsors.find((s) => s.id === editingId) : null;

  // Validation for all sponsors (for list badges)
  const validationMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof validateSponsor>> = {};
    for (const s of bundle.sponsors) {
      map[s.id] = validateSponsor(s);
    }
    return map;
  }, [bundle.sponsors]);

  const editingValidation = editing ? validationMap[editing.id] : null;

  const handleNew = () => addSponsor(createBlankSponsor());

  const handleDuplicate = () => {
    if (!editing) return;
    const dupe: SponsorTemplate = {
      ...structuredClone(editing),
      id: `sponsor-${Date.now()}`,
      name: `${editing.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addSponsor(dupe);
  };

  const handleUpdate = (updates: Partial<SponsorTemplate>) => {
    if (editingId) updateSponsor(editingId, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this sponsor?')) removeSponsor(id);
  };

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Sponsors</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ New Sponsor</button>
      </div>

      <div className="admin-editor-layout">
        <div className="admin-list-panel">
          <input className="admin-input admin-search" placeholder="Filter sponsors..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="admin-item-list">
            {sponsors.length === 0 && <div className="admin-empty">No sponsors yet</div>}
            {sponsors.map((s) => {
              const val = validationMap[s.id];
              return (
                <div key={s.id} className={`admin-item ${editingId === s.id ? 'active' : ''}`} onClick={() => setEditingId(s.id)}>
                  <div className="admin-item-name">
                    {s.logoUrl && <img src={s.logoUrl} alt="" style={{ width: 20, height: 10, objectFit: 'contain', marginRight: 4, verticalAlign: 'middle' }} />}
                    {s.name || 'Untitled'}
                    {!val?.valid && <span className="admin-badge-error" title={val?.errors.join(', ')}>!</span>}
                  </div>
                  <div className="admin-item-meta">
                    <span className="admin-badge">Tier {s.tier}</span>
                    <span>${s.weeklyPaymentRange[0]}-${s.weeklyPaymentRange[1]}/wk</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-detail-panel">
          {!editing ? (
            <div className="admin-empty-detail">Select or create a sponsor</div>
          ) : (
            <div className="admin-form">
              {/* Validation errors */}
              {editingValidation && !editingValidation.valid && (
                <div className="admin-validation-errors">
                  {editingValidation.errors.map((err, i) => (
                    <div key={i} className="admin-error-msg">⚠ {err}</div>
                  ))}
                </div>
              )}

              <div className="admin-form-row">
                <label>Sponsor Name</label>
                <input className="admin-input" value={editing.name} onChange={(e) => handleUpdate({ name: e.target.value })} maxLength={50} />
                <small style={{ color: '#888' }}>{editing.name.length}/50</small>
              </div>
              <div className="admin-form-row">
                <label>Tier</label>
                <select className="admin-input" value={editing.tier} onChange={(e) => handleUpdate({ tier: +e.target.value as 1 | 2 | 3 })}>
                  <option value={1}>Tier 1 (Basic)</option>
                  <option value={2}>Tier 2 (Mid)</option>
                  <option value={3}>Tier 3 (Premium)</option>
                </select>
              </div>
              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Weekly Pay Min ($)</label>
                  <input className="admin-input" type="number" min={0} value={editing.weeklyPaymentRange[0]} onChange={(e) => handleUpdate({ weeklyPaymentRange: [+e.target.value, editing.weeklyPaymentRange[1]] })} />
                </div>
                <div className="admin-form-row">
                  <label>Weekly Pay Max ($)</label>
                  <input className="admin-input" type="number" min={0} value={editing.weeklyPaymentRange[1]} onChange={(e) => handleUpdate({ weeklyPaymentRange: [editing.weeklyPaymentRange[0], +e.target.value] })} />
                </div>
              </div>
              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Fight Bonus Min ($)</label>
                  <input className="admin-input" type="number" min={0} value={editing.fightBonusRange[0]} onChange={(e) => handleUpdate({ fightBonusRange: [+e.target.value, editing.fightBonusRange[1]] })} />
                </div>
                <div className="admin-form-row">
                  <label>Fight Bonus Max ($)</label>
                  <input className="admin-input" type="number" min={0} value={editing.fightBonusRange[1]} onChange={(e) => handleUpdate({ fightBonusRange: [editing.fightBonusRange[0], +e.target.value] })} />
                </div>
              </div>
              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Duration Min (weeks)</label>
                  <input className="admin-input" type="number" min={1} value={editing.durationWeeksRange[0]} onChange={(e) => handleUpdate({ durationWeeksRange: [+e.target.value, editing.durationWeeksRange[1]] })} />
                </div>
                <div className="admin-form-row">
                  <label>Duration Max (weeks)</label>
                  <input className="admin-input" type="number" min={1} value={editing.durationWeeksRange[1]} onChange={(e) => handleUpdate({ durationWeeksRange: [editing.durationWeeksRange[0], +e.target.value] })} />
                </div>
              </div>
              <div className="admin-form-row">
                <label>Requirement (optional)</label>
                <input className="admin-input" value={editing.requirement ?? ''} onChange={(e) => handleUpdate({ requirement: e.target.value || undefined })} placeholder="e.g. reputation > 50" />
              </div>

              {/* Logo URL with asset picker */}
              <div className="admin-form-row">
                <label>Sponsor Logo</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="admin-input"
                    placeholder="Logo URL or pick from assets"
                    value={editing.logoUrl ?? ''}
                    onChange={(e) => handleUpdate({ logoUrl: e.target.value || undefined })}
                    style={{ flex: 1 }}
                  />
                  <button className="admin-btn admin-btn-sm" onClick={() => setShowAssetPicker(true)}>📁 Pick</button>
                </div>
                {editing.logoUrl && (
                  <img src={editing.logoUrl} alt="logo preview" style={{ maxHeight: 40, marginTop: 4, borderRadius: 4, background: '#1a1a2e', padding: 4 }} />
                )}
              </div>

              <div className="admin-form-row">
                <label>Tags (comma-separated)</label>
                <input className="admin-input" value={editing.tags.join(', ')} onChange={(e) => handleUpdate({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
              </div>

              {/* Sponsor summary card */}
              <div className="admin-preview-box">
                <div style={{ fontSize: 11, color: '#ffc107', marginBottom: 4, fontWeight: 700 }}>SPONSOR DEAL PREVIEW</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {editing.logoUrl && (
                    <img src={editing.logoUrl} alt="" style={{ width: 48, height: 24, objectFit: 'contain', background: '#1a1a2e', borderRadius: 4, padding: 2 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{editing.name || 'Unnamed Sponsor'}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>
                      {TIER_LABELS[editing.tier]} · ${editing.weeklyPaymentRange[0]}-${editing.weeklyPaymentRange[1]}/wk
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>
                      Fight Bonus: ${editing.fightBonusRange[0]}-${editing.fightBonusRange[1]} · Duration: {editing.durationWeeksRange[0]}-{editing.durationWeeksRange[1]} wk
                    </div>
                    {editing.requirement && (
                      <div style={{ fontSize: 11, color: '#f59e0b' }}>Req: {editing.requirement}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-form-footer">
                <button className="admin-btn admin-btn-secondary" onClick={handleDuplicate}>📋 Duplicate</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(editing.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset picker modal */}
      {showAssetPicker && (
        <AssetPickerModal
          categories={['sponsor_logo', 'icon', 'misc']}
          onSelect={(asset) => {
            handleUpdate({ logoUrl: asset.dataUrl });
            setShowAssetPicker(false);
          }}
          onClose={() => setShowAssetPicker(false)}
        />
      )}
    </div>
  );
}
