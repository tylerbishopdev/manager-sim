import { useState } from 'react';
import { useAdminStore } from '../../store/adminStore';

type PoolKey = 'firstNames' | 'lastNames' | 'nicknames';

const POOLS: { key: PoolKey; label: string }[] = [
  { key: 'firstNames', label: 'First Names' },
  { key: 'lastNames', label: 'Last Names' },
  { key: 'nicknames', label: 'Nicknames' },
];

export default function NamePoolEditor() {
  const { bundle, addNames, removeName } = useAdminStore();
  const [activePool, setActivePool] = useState<PoolKey>('firstNames');
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('');

  const names = bundle.namePool[activePool].filter(
    (n) => !filter || n.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = () => {
    const newNames = input
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (newNames.length > 0) {
      addNames(activePool, newNames);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Name Pool</h1>
      </div>

      {/* Pool tabs */}
      <div className="admin-tabs">
        {POOLS.map((p) => (
          <button
            key={p.key}
            className={`admin-tab ${activePool === p.key ? 'active' : ''}`}
            onClick={() => { setActivePool(p.key); setFilter(''); }}
          >
            {p.label} ({bundle.namePool[p.key].length})
          </button>
        ))}
      </div>

      {/* Add names */}
      <div className="admin-name-add">
        <textarea
          className="admin-input admin-textarea"
          placeholder="Add names (comma or line-separated)..."
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="admin-btn admin-btn-primary" onClick={handleAdd}>Add Names</button>
      </div>

      {/* Filter */}
      <input className="admin-input admin-search" placeholder="Filter names..." value={filter} onChange={(e) => setFilter(e.target.value)} />

      {/* Name list */}
      <div className="admin-name-grid">
        {names.length === 0 && <div className="admin-empty">No names in this pool</div>}
        {names.map((name) => (
          <div key={name} className="admin-name-tag">
            <span>{name}</span>
            <button className="admin-name-remove" onClick={() => removeName(activePool, name)}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}
