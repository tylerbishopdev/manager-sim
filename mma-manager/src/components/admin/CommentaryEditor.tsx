import { useState, useMemo } from 'react';
import { useAdminStore } from '../../store/adminStore';
import {
  createBlankCommentary,
  type CommentaryTemplate,
  type CommentaryCategory,
} from '../../types/admin';
import { validateCommentary } from './validation';
import { COMMENTARY_CATEGORIES } from './assetGuidance';

const SAMPLE_NAMES = {
  attacker: ['McGregor', 'Diaz', 'Jones', 'Nunes'],
  defender: ['Silva', 'Khabib', 'Rousey', 'Adesanya'],
};

function sampleName(key: 'attacker' | 'defender') {
  const pool = SAMPLE_NAMES[key];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function CommentaryEditor() {
  const {
    bundle, editingId, setEditingId,
    addCommentary, updateCommentary, removeCommentary,
  } = useAdminStore();

  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CommentaryCategory | ''>('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState<CommentaryCategory>('strike_hit');

  const commentary = bundle.commentary.filter((c) => {
    if (categoryFilter && c.category !== categoryFilter) return false;
    if (filter && !c.text.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const editing = editingId ? bundle.commentary.find((c) => c.id === editingId) : null;
  const validation = editing ? validateCommentary(editing) : null;

  // Memoize validation for the list to avoid per-render recomputation
  const validationMap = useMemo(() => {
    const map: Record<string, { valid: boolean }> = {};
    for (const c of bundle.commentary) {
      map[c.id] = validateCommentary(c);
    }
    return map;
  }, [bundle.commentary]);

  const handleNew = () => {
    const c = createBlankCommentary();
    if (categoryFilter) c.category = categoryFilter;
    addCommentary(c);
  };

  const handleUpdate = (updates: Partial<CommentaryTemplate>) => {
    if (editingId) updateCommentary(editingId, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this commentary line?')) removeCommentary(id);
  };

  const handleDuplicate = () => {
    if (!editing) return;
    const copy = createBlankCommentary();
    copy.category = editing.category;
    copy.text = editing.text;
    copy.tags = [...editing.tags];
    addCommentary(copy);
  };

  const insertPlaceholder = (token: string) => {
    if (!editing) return;
    handleUpdate({ text: editing.text + token });
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    for (const line of lines) {
      const c = createBlankCommentary();
      c.id = `commentary-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      c.category = bulkCategory;
      c.text = line;
      addCommentary(c);
    }
    setBulkText('');
    setBulkMode(false);
  };

  // Live preview with sample names
  const previewText = editing
    ? editing.text
        .replace(/\{attacker\}/g, sampleName('attacker'))
        .replace(/\{defender\}/g, sampleName('defender'))
    : '';

  // Count per category
  const categoryCounts: Record<string, number> = {};
  for (const c of bundle.commentary) {
    categoryCounts[c.category] = (categoryCounts[c.category] ?? 0) + 1;
  }

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Commentary</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="admin-btn admin-btn-sm" onClick={() => setBulkMode(!bulkMode)}>
            {bulkMode ? 'Cancel Bulk' : 'Bulk Add'}
          </button>
          <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ New Line</button>
        </div>
      </div>

      {/* Bulk add panel */}
      {bulkMode && (
        <div className="admin-form" style={{ marginBottom: 16, padding: 12, border: '1px solid #333', background: 'rgba(0,0,0,0.2)' }}>
          <div className="admin-form-row" style={{ marginBottom: 8 }}>
            <label>Category for all lines:</label>
            <select className="admin-input" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value as CommentaryCategory)}>
              {COMMENTARY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-row" style={{ marginBottom: 8 }}>
            <label>Paste lines (one per row). Use {'{attacker}'} and {'{defender}'} placeholders.</label>
            <textarea
              className="admin-input admin-textarea"
              rows={6}
              placeholder={`{attacker} lands a CRISP jab on {defender}!\n{defender} barely dodges the hook from {attacker}!`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleBulkAdd}>
            Add {bulkText.split('\n').filter((l) => l.trim()).length} Lines
          </button>
        </div>
      )}

      <div className="admin-editor-layout">
        {/* List panel */}
        <div className="admin-list-panel">
          <input
            className="admin-input admin-search"
            placeholder="Filter commentary..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {/* Category filter chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '8px 0' }}>
            <button
              className={`admin-badge ${!categoryFilter ? 'admin-badge-active' : ''}`}
              onClick={() => setCategoryFilter('')}
              style={{ cursor: 'pointer', fontSize: 9 }}
            >
              ALL ({bundle.commentary.length})
            </button>
            {COMMENTARY_CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={`admin-badge ${categoryFilter === c.value ? 'admin-badge-active' : ''}`}
                onClick={() => setCategoryFilter(categoryFilter === c.value ? '' : c.value as CommentaryCategory)}
                style={{ cursor: 'pointer', fontSize: 9 }}
              >
                {c.label} ({categoryCounts[c.value] ?? 0})
              </button>
            ))}
          </div>

          <div className="admin-item-list">
            {commentary.length === 0 && <div className="admin-empty">No commentary lines yet</div>}
            {commentary.map((c) => (
                <div
                  key={c.id}
                  className={`admin-item ${editingId === c.id ? 'active' : ''}`}
                  onClick={() => setEditingId(c.id)}
                >
                  <div className="admin-item-name" style={{ fontSize: 9 }}>
                    {c.text || 'Empty line'}
                  </div>
                  <div className="admin-item-meta">
                    <span className="admin-badge">{c.category.replace(/_/g, ' ')}</span>
                    {validationMap[c.id] && !validationMap[c.id].valid && <span className="admin-badge admin-badge-error">!</span>}
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="admin-detail-panel">
          {!editing ? (
            <div className="admin-empty-detail">Select or create a commentary line</div>
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
                <label>Category</label>
                <select
                  className="admin-input"
                  value={editing.category}
                  onChange={(e) => handleUpdate({ category: e.target.value as CommentaryCategory })}
                >
                  {COMMENTARY_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} — {c.desc}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-row">
                <label>
                  Text
                  <span style={{ color: '#666', fontSize: 9, marginLeft: 8 }}>
                    {editing.text.length}/120 chars
                  </span>
                </label>
                <textarea
                  className="admin-input admin-textarea"
                  value={editing.text}
                  onChange={(e) => handleUpdate({ text: e.target.value })}
                  rows={3}
                  maxLength={120}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button className="admin-btn admin-btn-xs" onClick={() => insertPlaceholder('{attacker}')}>
                    + {'{attacker}'}
                  </button>
                  <button className="admin-btn admin-btn-xs" onClick={() => insertPlaceholder('{defender}')}>
                    + {'{defender}'}
                  </button>
                </div>
              </div>

              {/* Live preview */}
              {editing.text && (
                <div className="admin-form-row">
                  <label>Preview</label>
                  <div className="admin-preview-box">
                    {previewText}
                  </div>
                </div>
              )}

              <div className="admin-form-row">
                <label>Tags (comma-separated)</label>
                <input
                  className="admin-input"
                  value={editing.tags.join(', ')}
                  onChange={(e) => handleUpdate({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                />
              </div>

              <div className="admin-form-footer">
                <button className="admin-btn admin-btn-sm" onClick={handleDuplicate}>Duplicate</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(editing.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
