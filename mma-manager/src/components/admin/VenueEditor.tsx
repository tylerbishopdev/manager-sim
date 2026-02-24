import { useState, useMemo } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { createBlankVenue, type VenueTemplate } from '../../types/admin';
import { validateVenue } from './validation';
import AssetPickerModal from './AssetPickerModal';

export default function VenueEditor() {
  const { bundle, editingId, setEditingId, addVenue, updateVenue, removeVenue } = useAdminStore();
  const [filter, setFilter] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const venues = bundle.venues.filter(
    (v) => !filter || v.name.toLowerCase().includes(filter.toLowerCase()) || v.city.toLowerCase().includes(filter.toLowerCase())
  );

  const editing = editingId ? bundle.venues.find((v) => v.id === editingId) : null;

  // Validation for all venues (for list badges)
  const validationMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof validateVenue>> = {};
    for (const v of bundle.venues) {
      map[v.id] = validateVenue(v);
    }
    return map;
  }, [bundle.venues]);

  const editingValidation = editing ? validationMap[editing.id] : null;

  const handleNew = () => addVenue(createBlankVenue());

  const handleDuplicate = () => {
    if (!editing) return;
    const dupe: VenueTemplate = {
      ...structuredClone(editing),
      id: `venue-${Date.now()}`,
      name: `${editing.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addVenue(dupe);
  };

  const handleUpdate = (updates: Partial<VenueTemplate>) => {
    if (editingId) updateVenue(editingId, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this venue?')) removeVenue(id);
  };

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Venues</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ New Venue</button>
      </div>

      <div className="admin-editor-layout">
        <div className="admin-list-panel">
          <input className="admin-input admin-search" placeholder="Filter venues..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="admin-item-list">
            {venues.length === 0 && <div className="admin-empty">No venues yet</div>}
            {venues.map((v) => {
              const val = validationMap[v.id];
              return (
                <div key={v.id} className={`admin-item ${editingId === v.id ? 'active' : ''}`} onClick={() => setEditingId(v.id)}>
                  <div className="admin-item-name">
                    {v.name || 'Untitled'}
                    {!val?.valid && <span className="admin-badge-error" title={val?.errors.join(', ')}>!</span>}
                  </div>
                  <div className="admin-item-meta">
                    <span>{v.city || 'No city'}</span>
                    <span>Cap: {v.capacity}</span>
                    <span className="admin-badge">★{v.prestige}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-detail-panel">
          {!editing ? (
            <div className="admin-empty-detail">Select or create a venue</div>
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
                <label>Venue Name</label>
                <input className="admin-input" value={editing.name} onChange={(e) => handleUpdate({ name: e.target.value })} maxLength={50} />
                <small style={{ color: '#888' }}>{editing.name.length}/50</small>
              </div>
              <div className="admin-form-row">
                <label>City</label>
                <input className="admin-input" value={editing.city} onChange={(e) => handleUpdate({ city: e.target.value })} maxLength={40} />
              </div>
              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Capacity</label>
                  <input className="admin-input" type="number" min={0} value={editing.capacity} onChange={(e) => handleUpdate({ capacity: +e.target.value })} />
                </div>
                <div className="admin-form-row">
                  <label>Prestige (1-10)</label>
                  <input className="admin-input" type="number" min={1} max={10} value={editing.prestige} onChange={(e) => handleUpdate({ prestige: +e.target.value })} />
                </div>
              </div>
              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Base Purse ($)</label>
                  <input className="admin-input" type="number" min={0} value={editing.basePurse} onChange={(e) => handleUpdate({ basePurse: +e.target.value })} />
                </div>
                <div className="admin-form-row">
                  <label>Ticket Revenue Split (%)</label>
                  <input className="admin-input" type="number" min={0} max={100} value={editing.ticketRevenueSplit} onChange={(e) => handleUpdate({ ticketRevenueSplit: +e.target.value })} />
                </div>
              </div>
              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={editing.ppvAvailable} onChange={(e) => handleUpdate({ ppvAvailable: e.target.checked })} />
                    PPV Available
                  </label>
                </div>
                <div className="admin-form-row">
                  <label>Min Reputation</label>
                  <input className="admin-input" type="number" min={0} value={editing.minReputation} onChange={(e) => handleUpdate({ minReputation: +e.target.value })} />
                </div>
              </div>

              {/* Image URL with asset picker */}
              <div className="admin-form-row">
                <label>Venue Image</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="admin-input"
                    placeholder="Image URL or pick from assets"
                    value={editing.imageUrl ?? ''}
                    onChange={(e) => handleUpdate({ imageUrl: e.target.value || undefined })}
                    style={{ flex: 1 }}
                  />
                  <button className="admin-btn admin-btn-sm" onClick={() => setShowAssetPicker(true)}>📁 Pick</button>
                </div>
                {editing.imageUrl && (
                  <img src={editing.imageUrl} alt="venue preview" style={{ maxHeight: 80, marginTop: 4, borderRadius: 4, border: '1px solid #333' }} />
                )}
              </div>

              <div className="admin-form-row">
                <label>Tags (comma-separated)</label>
                <input className="admin-input" value={editing.tags.join(', ')} onChange={(e) => handleUpdate({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
              </div>

              {/* Venue summary card */}
              <div className="admin-preview-box">
                <div style={{ fontSize: 11, color: '#ffc107', marginBottom: 4, fontWeight: 700 }}>VENUE CARD PREVIEW</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {editing.imageUrl && (
                    <img src={editing.imageUrl} alt="" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{editing.name || 'Unnamed Venue'}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{editing.city || 'Unknown City'} · Cap: {editing.capacity.toLocaleString()} · ★{editing.prestige}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>Purse: ${editing.basePurse.toLocaleString()} · Rev Split: {editing.ticketRevenueSplit}%</div>
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
          categories={['venue', 'background', 'misc']}
          onSelect={(asset) => {
            handleUpdate({ imageUrl: asset.dataUrl });
            setShowAssetPicker(false);
          }}
          onClose={() => setShowAssetPicker(false)}
        />
      )}
    </div>
  );
}
