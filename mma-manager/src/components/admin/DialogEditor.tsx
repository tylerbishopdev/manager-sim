import { useState, useMemo, useEffect, useRef } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { createBlankDialog, type DialogTemplate } from '../../types/admin';
import { validateDialog } from './validation';
import { PLACEHOLDERS } from './assetGuidance';

export default function DialogEditor() {
  const { bundle, editingId, setEditingId, addDialog, updateDialog, removeDialog } = useAdminStore();
  const [filter, setFilter] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewVariantIdx, setPreviewVariantIdx] = useState(0);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const variantCountRef = useRef(0);

  const dialogs = bundle.dialogs.filter(
    (d) => !filter || d.action.toLowerCase().includes(filter.toLowerCase()) || d.speaker.toLowerCase().includes(filter.toLowerCase())
  );

  const editing = editingId ? bundle.dialogs.find((d) => d.id === editingId) : null;

  // Validation for all dialogs (for list badges)
  const validationMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof validateDialog>> = {};
    for (const d of bundle.dialogs) {
      map[d.id] = validateDialog(d);
    }
    return map;
  }, [bundle.dialogs]);

  const editingValidation = editing ? validationMap[editing.id] : null;

  // Keep variant count in a ref to avoid stale closures in setInterval
  variantCountRef.current = editing?.textVariants.length ?? 0;

  // Cycle through text variants in preview
  useEffect(() => {
    if (showPreview && editing && editing.textVariants.length > 1) {
      cycleRef.current = setInterval(() => {
        setPreviewVariantIdx((prev) => (prev + 1) % (variantCountRef.current || 1));
      }, 3000);
    }
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [showPreview, editing?.id, editing?.textVariants.length]);

  // Reset variant index when editing changes
  useEffect(() => {
    setPreviewVariantIdx(0);
  }, [editingId]);

  const handleNew = () => addDialog(createBlankDialog());

  const handleDuplicate = () => {
    if (!editing) return;
    const dupe: DialogTemplate = {
      ...structuredClone(editing),
      id: `dialog-${Date.now()}`,
      action: `${editing.action}_copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addDialog(dupe);
  };

  const handleUpdate = (updates: Partial<DialogTemplate>) => {
    if (editingId) updateDialog(editingId, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this dialog?')) removeDialog(id);
  };

  const addTextVariant = () => {
    if (!editing) return;
    handleUpdate({ textVariants: [...editing.textVariants, ''] });
  };

  const updateTextVariant = (idx: number, text: string) => {
    if (!editing) return;
    const variants = editing.textVariants.map((v, i) => (i === idx ? text : v));
    handleUpdate({ textVariants: variants });
  };

  const removeTextVariant = (idx: number) => {
    if (!editing || editing.textVariants.length <= 1) return;
    handleUpdate({ textVariants: editing.textVariants.filter((_, i) => i !== idx) });
  };

  // Insert placeholder into the currently focused variant
  const insertPlaceholder = (token: string, variantIdx: number) => {
    if (!editing) return;
    const variants = editing.textVariants.map((v, i) => (i === variantIdx ? v + token : v));
    handleUpdate({ textVariants: variants });
  };

  // Choice management for dialogs
  const addChoice = () => {
    if (!editing) return;
    const choices = [...(editing.choices ?? []), { label: '', action: '' }];
    handleUpdate({ choices });
  };

  const updateChoiceField = (idx: number, field: 'label' | 'action', value: string) => {
    if (!editing) return;
    const choices = (editing.choices ?? []).map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    handleUpdate({ choices });
  };

  const removeChoiceItem = (idx: number) => {
    if (!editing) return;
    handleUpdate({ choices: (editing.choices ?? []).filter((_, i) => i !== idx) });
  };

  // Preview text with placeholder substitution
  const getPreviewText = (text: string) =>
    text.replace(/\{playerName\}/g, 'Boss');

  const currentPreviewVariant = editing
    ? editing.textVariants[previewVariantIdx % editing.textVariants.length] ?? ''
    : '';

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Dialogs</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ New Dialog</button>
      </div>

      <div className="admin-editor-layout">
        <div className="admin-list-panel">
          <input className="admin-input admin-search" placeholder="Filter dialogs..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="admin-item-list">
            {dialogs.length === 0 && <div className="admin-empty">No dialogs yet</div>}
            {dialogs.map((d) => {
              const val = validationMap[d.id];
              return (
                <div key={d.id} className={`admin-item ${editingId === d.id ? 'active' : ''}`} onClick={() => setEditingId(d.id)}>
                  <div className="admin-item-name">
                    {d.action || 'Untitled'}
                    {!val?.valid && <span className="admin-badge-error" title={val?.errors.join(', ')}>!</span>}
                  </div>
                  <div className="admin-item-meta">
                    <span>{d.speaker || 'No speaker'}</span>
                    <span>{d.textVariants.length} variant{d.textVariants.length !== 1 ? 's' : ''}</span>
                    {d.choices && d.choices.length > 0 && (
                      <span className="admin-badge">{d.choices.length} choices</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-detail-panel">
          {!editing ? (
            <div className="admin-empty-detail">Select or create a dialog</div>
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
                <label>Action ID</label>
                <input className="admin-input" placeholder="e.g. open_gym, advance_day, custom_action" value={editing.action} onChange={(e) => handleUpdate({ action: e.target.value })} />
                <small style={{ color: '#888' }}>This is the action key triggered when this dialog is displayed</small>
              </div>
              <div className="admin-form-row">
                <label>Speaker</label>
                <input className="admin-input" value={editing.speaker} onChange={(e) => handleUpdate({ speaker: e.target.value })} maxLength={30} />
                <small style={{ color: '#888' }}>{editing.speaker.length}/30</small>
              </div>

              {/* Live preview toggle */}
              <div className="admin-section-header">
                <h3>Preview</h3>
                <button className="admin-btn admin-btn-sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>

              {showPreview && (
                <div className="admin-preview-box">
                  <div className="admin-dialog-preview">
                    {editing.speaker && (
                      <div className="admin-dialog-preview-speaker">{editing.speaker}</div>
                    )}
                    <div className="admin-dialog-preview-text">
                      {getPreviewText(currentPreviewVariant) || '(no text)'}
                    </div>
                    {editing.textVariants.length > 1 && (
                      <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                        Variant {(previewVariantIdx % editing.textVariants.length) + 1} of {editing.textVariants.length} (auto-cycling)
                      </div>
                    )}
                    {editing.choices && editing.choices.length > 0 && (
                      <div className="admin-dialog-preview-choices">
                        {editing.choices.map((c, i) => (
                          <div key={i} className="admin-dialog-preview-choice">▸ {c.label || '(empty)'}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Text variants */}
              <div className="admin-section-header">
                <h3>Text Variants</h3>
                <button className="admin-btn admin-btn-sm" onClick={addTextVariant}>+ Variant</button>
              </div>
              {editing.textVariants.map((text, i) => (
                <div key={i} className="admin-variant-row">
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#888', lineHeight: '22px' }}>#{i + 1}</span>
                    {PLACEHOLDERS.dialog.map((p) => (
                      <button
                        key={p.token}
                        className="admin-btn admin-btn-xs"
                        onClick={() => insertPlaceholder(p.token, i)}
                        title={p.desc}
                      >
                        {p.token}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <textarea className="admin-input admin-textarea" rows={2} value={text} onChange={(e) => updateTextVariant(i, e.target.value)} maxLength={200} style={{ flex: 1 }} />
                    {editing.textVariants.length > 1 && (
                      <button className="admin-btn admin-btn-danger admin-btn-xs" onClick={() => removeTextVariant(i)}>X</button>
                    )}
                  </div>
                  <small style={{ color: '#888' }}>{text.length}/200</small>
                </div>
              ))}

              {/* Choices */}
              <div className="admin-section-header">
                <h3>Choices (optional)</h3>
                <button className="admin-btn admin-btn-sm" onClick={addChoice}>+ Choice</button>
              </div>
              {(editing.choices ?? []).map((c, i) => (
                <div key={i} className="admin-choice-row">
                  <input className="admin-input" placeholder="Label" value={c.label} onChange={(e) => updateChoiceField(i, 'label', e.target.value)} maxLength={40} />
                  <input className="admin-input" placeholder="Action (e.g. dismiss, open_gym)" value={c.action} onChange={(e) => updateChoiceField(i, 'action', e.target.value)} />
                  <button className="admin-btn admin-btn-danger admin-btn-xs" onClick={() => removeChoiceItem(i)}>X</button>
                </div>
              ))}

              <div className="admin-form-row">
                <label>Tags (comma-separated)</label>
                <input className="admin-input" value={editing.tags.join(', ')} onChange={(e) => handleUpdate({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
              </div>

              <div className="admin-form-footer">
                <button className="admin-btn admin-btn-secondary" onClick={handleDuplicate}>📋 Duplicate</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(editing.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
