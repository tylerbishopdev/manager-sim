import { useState, useMemo } from 'react';
import { useAdminStore } from '../../store/adminStore';
import {
  createBlankScenario,
  type ScenarioTemplate,
  type ScenarioCategory,
  type ScenarioEffect,
} from '../../types/admin';
import { validateScenario } from './validation';
import { PLACEHOLDERS } from './assetGuidance';
import AssetPickerModal from './AssetPickerModal';

const CATEGORIES: ScenarioCategory[] = [
  'injury', 'drama', 'opportunity', 'rival', 'sponsor',
  'news', 'training', 'media', 'fan', 'custom',
];

const TRIGGER_TYPES = [
  'random', 'fighter_count', 'money_above', 'money_below',
  'reputation_above', 'reputation_below', 'day_of_week',
  'gym_level', 'win_streak', 'loss_streak', 'always',
] as const;

const EFFECT_TYPE_VALUES = [
  'money', 'morale', 'health', 'fame', 'reputation',
  'injury_days', 'add_sponsor', 'screen', 'dismiss',
] as const;

const TARGETS = ['player', 'random_fighter', 'all_fighters', 'gym'] as const;

export default function ScenarioEditor() {
  const { bundle, editingId, setEditingId, addScenario, updateScenario, removeScenario } = useAdminStore();
  const [filter, setFilter] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const scenarios = bundle.scenarios.filter(
    (s) => !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || s.category.includes(filter.toLowerCase())
  );

  const editing = editingId ? bundle.scenarios.find((s) => s.id === editingId) : null;

  // Validation for all scenarios (for list badges)
  const validationMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof validateScenario>> = {};
    for (const s of bundle.scenarios) {
      map[s.id] = validateScenario(s);
    }
    return map;
  }, [bundle.scenarios]);

  const editingValidation = editing ? validationMap[editing.id] : null;

  const handleNew = () => {
    const s = createBlankScenario();
    addScenario(s);
  };

  const handleDuplicate = () => {
    if (!editing) return;
    const dupe: ScenarioTemplate = {
      ...structuredClone(editing),
      id: `scenario-${Date.now()}`,
      name: `${editing.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addScenario(dupe);
  };

  const handleTestInGame = () => {
    if (!editing) return;
    localStorage.setItem('mma-test-scenario', editing.id);
    // Navigate back to game
    window.location.hash = '#game-test';
    window.location.reload();
  };

  const handleUpdate = (updates: Partial<ScenarioTemplate>) => {
    if (editingId) updateScenario(editingId, updates);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this scenario?')) removeScenario(id);
  };

  // Placeholder insert helper
  const insertPlaceholder = (token: string) => {
    if (!editing) return;
    handleUpdate({ text: editing.text + token });
  };

  // Choice management
  const addChoice = () => {
    if (!editing) return;
    const choices = [...editing.choices, { label: '', effects: [{ type: 'dismiss' as const, value: 0, target: 'player' as const }] }];
    handleUpdate({ choices });
  };

  const updateChoice = (idx: number, label: string) => {
    if (!editing) return;
    const choices = editing.choices.map((c, i) => (i === idx ? { ...c, label } : c));
    handleUpdate({ choices });
  };

  const removeChoice = (idx: number) => {
    if (!editing) return;
    handleUpdate({ choices: editing.choices.filter((_, i) => i !== idx) });
  };

  // Effect management
  const addEffect = (choiceIdx: number) => {
    if (!editing) return;
    const choices = editing.choices.map((c, i) => {
      if (i !== choiceIdx) return c;
      return { ...c, effects: [...c.effects, { type: 'dismiss' as const, value: 0, target: 'player' as const }] };
    });
    handleUpdate({ choices });
  };

  const updateEffect = (choiceIdx: number, effectIdx: number, updates: Partial<ScenarioEffect>) => {
    if (!editing) return;
    const choices = editing.choices.map((c, ci) => {
      if (ci !== choiceIdx) return c;
      return {
        ...c,
        effects: c.effects.map((e, ei) => (ei === effectIdx ? { ...e, ...updates } : e)),
      };
    });
    handleUpdate({ choices });
  };

  const removeEffect = (choiceIdx: number, effectIdx: number) => {
    if (!editing) return;
    const choices = editing.choices.map((c, ci) => {
      if (ci !== choiceIdx) return c;
      return { ...c, effects: c.effects.filter((_, ei) => ei !== effectIdx) };
    });
    handleUpdate({ choices });
  };

  // Preview text with placeholder substitution
  const previewText = editing
    ? editing.text
        .replace(/\{fighterName\}/g, 'Jake "The Snake" Martinez')
        .replace(/\{playerName\}/g, 'Boss')
    : '';

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Scenarios</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleNew}>+ New Scenario</button>
      </div>

      <div className="admin-editor-layout">
        {/* List panel */}
        <div className="admin-list-panel">
          <input
            className="admin-input admin-search"
            placeholder="Filter scenarios..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="admin-item-list">
            {scenarios.length === 0 && <div className="admin-empty">No scenarios yet</div>}
            {scenarios.map((s) => {
              const v = validationMap[s.id];
              return (
                <div
                  key={s.id}
                  className={`admin-item ${editingId === s.id ? 'active' : ''}`}
                  onClick={() => setEditingId(s.id)}
                >
                  <div className="admin-item-name">
                    {s.name || 'Untitled'}
                    {!v?.valid && <span className="admin-badge-error" title={v?.errors.join(', ')}>!</span>}
                  </div>
                  <div className="admin-item-meta">
                    <span className="admin-badge">{s.category}</span>
                    <span>{s.choices.length} choices</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="admin-detail-panel">
          {!editing ? (
            <div className="admin-empty-detail">Select or create a scenario</div>
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
                <label>Name</label>
                <input className="admin-input" value={editing.name} onChange={(e) => handleUpdate({ name: e.target.value })} maxLength={60} />
                <small style={{ color: '#888' }}>{editing.name.length}/60</small>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Category</label>
                  <select className="admin-input" value={editing.category} onChange={(e) => handleUpdate({ category: e.target.value as ScenarioCategory })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="admin-form-row">
                  <label>Probability (%)</label>
                  <input className="admin-input" type="number" min={0} max={100} value={editing.probability} onChange={(e) => handleUpdate({ probability: +e.target.value })} />
                </div>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Trigger Type</label>
                  <select className="admin-input" value={editing.triggerCondition.type} onChange={(e) => handleUpdate({ triggerCondition: { ...editing.triggerCondition, type: e.target.value as typeof TRIGGER_TYPES[number] } })}>
                    {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="admin-form-row">
                  <label>Trigger Value</label>
                  <input className="admin-input" type="number" value={editing.triggerCondition.value ?? ''} onChange={(e) => handleUpdate({ triggerCondition: { ...editing.triggerCondition, value: e.target.value ? +e.target.value : undefined } })} />
                </div>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label>Min Day</label>
                  <input className="admin-input" type="number" min={0} value={editing.minDay} onChange={(e) => handleUpdate({ minDay: +e.target.value })} />
                </div>
                <div className="admin-form-row">
                  <label>Max Day (0 = no limit)</label>
                  <input className="admin-input" type="number" min={0} value={editing.maxDay} onChange={(e) => handleUpdate({ maxDay: +e.target.value })} />
                </div>
              </div>

              <div className="admin-form-row-2col">
                <div className="admin-form-row">
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={editing.repeatable} onChange={(e) => handleUpdate({ repeatable: e.target.checked })} />
                    Repeatable
                  </label>
                </div>
                <div className="admin-form-row">
                  <label>Cooldown (days)</label>
                  <input className="admin-input" type="number" min={0} value={editing.cooldownDays} onChange={(e) => handleUpdate({ cooldownDays: +e.target.value })} />
                </div>
              </div>

              <div className="admin-form-row">
                <label>Speaker</label>
                <input className="admin-input" value={editing.speaker} onChange={(e) => handleUpdate({ speaker: e.target.value })} maxLength={30} />
              </div>

              <div className="admin-form-row">
                <label>Text</label>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {PLACEHOLDERS.scenario.map((p) => (
                    <button
                      key={p.token}
                      className="admin-btn admin-btn-xs"
                      onClick={() => insertPlaceholder(p.token)}
                      title={p.desc}
                    >
                      {p.token}
                    </button>
                  ))}
                </div>
                <textarea className="admin-input admin-textarea" value={editing.text} onChange={(e) => handleUpdate({ text: e.target.value })} rows={3} maxLength={300} />
                <small style={{ color: '#888' }}>{editing.text.length}/300</small>
              </div>

              {/* Image URL with asset picker */}
              <div className="admin-form-row">
                <label>Image</label>
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
                  <img src={editing.imageUrl} alt="preview" style={{ maxHeight: 60, marginTop: 4, borderRadius: 4 }} />
                )}
              </div>

              <div className="admin-form-row">
                <label>Tags (comma-separated)</label>
                <input className="admin-input" value={editing.tags.join(', ')} onChange={(e) => handleUpdate({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
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
                    <div className="admin-dialog-preview-text">{previewText || '(no text)'}</div>
                    {editing.choices.length > 0 && (
                      <div className="admin-dialog-preview-choices">
                        {editing.choices.map((c, i) => (
                          <div key={i} className="admin-dialog-preview-choice">▸ {c.label || '(empty)'}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Choices */}
              <div className="admin-section-header">
                <h3>Choices</h3>
                <button className="admin-btn admin-btn-sm" onClick={addChoice}>+ Choice</button>
              </div>

              {editing.choices.map((choice, ci) => (
                <div key={ci} className="admin-choice-block">
                  <div className="admin-choice-header">
                    <input
                      className="admin-input"
                      placeholder="Choice label"
                      value={choice.label}
                      onChange={(e) => updateChoice(ci, e.target.value)}
                      maxLength={40}
                    />
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeChoice(ci)}>X</button>
                  </div>

                  {/* Effects */}
                  <div className="admin-effects">
                    {choice.effects.map((effect, ei) => (
                      <div key={ei} className="admin-effect-row">
                        <select className="admin-input admin-input-sm" value={effect.type} onChange={(e) => updateEffect(ci, ei, { type: e.target.value as typeof EFFECT_TYPE_VALUES[number] })}>
                          {EFFECT_TYPE_VALUES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input className="admin-input admin-input-sm" placeholder="Value" value={effect.value} onChange={(e) => updateEffect(ci, ei, { value: isNaN(+e.target.value) ? e.target.value : +e.target.value })} />
                        <select className="admin-input admin-input-sm" value={effect.target} onChange={(e) => updateEffect(ci, ei, { target: e.target.value as typeof TARGETS[number] })}>
                          {TARGETS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                        <button className="admin-btn admin-btn-danger admin-btn-xs" onClick={() => removeEffect(ci, ei)}>X</button>
                      </div>
                    ))}
                    <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => addEffect(ci)}>+ Effect</button>
                  </div>
                </div>
              ))}

              {/* Footer actions */}
              <div className="admin-form-footer">
                <button className="admin-btn admin-btn-secondary" onClick={handleDuplicate}>📋 Duplicate</button>
                <button className="admin-btn admin-btn-accent" onClick={handleTestInGame} title="Test this scenario in the game">🎮 Test in Game</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(editing.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset picker modal */}
      {showAssetPicker && (
        <AssetPickerModal
          categories={['background', 'venue', 'misc']}
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
