import { useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import type { AssetEntry } from '../../types/admin';

interface Props {
  /** Filter assets to these categories (empty = show all) */
  categories?: AssetEntry['category'][];
  onSelect: (asset: AssetEntry) => void;
  onClose: () => void;
}

export default function AssetPickerModal({ categories, onSelect, onClose }: Props) {
  const { bundle } = useAdminStore();
  const [filterCat, setFilterCat] = useState<string>('all');

  const available = bundle.assets.filter((a) => {
    if (categories && categories.length > 0 && !categories.includes(a.category)) return false;
    if (filterCat !== 'all' && a.category !== filterCat) return false;
    return true;
  });

  const cats = categories && categories.length > 0
    ? categories
    : (['portrait', 'sprite', 'icon', 'background', 'venue', 'sponsor_logo', 'misc'] as const);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content admin-asset-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-asset-picker-header">
          <h3>Choose an Asset</h3>
          <button className="admin-btn admin-btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Category filter chips */}
        <div className="admin-tabs" style={{ marginBottom: 12 }}>
          <button
            className={`admin-tab ${filterCat === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCat('all')}
          >
            All
          </button>
          {cats.map((c) => {
            const count = bundle.assets.filter((a) => a.category === c).length;
            if (count === 0) return null;
            return (
              <button
                key={c}
                className={`admin-tab ${filterCat === c ? 'active' : ''}`}
                onClick={() => setFilterCat(c)}
              >
                {String(c).replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>

        {/* Asset grid */}
        <div className="admin-asset-picker-grid">
          {available.length === 0 && (
            <div className="admin-empty">
              No assets found. Upload assets in the Assets section first.
            </div>
          )}
          {available.map((a) => (
            <div
              key={a.id}
              className="admin-asset-picker-item"
              onClick={() => onSelect(a)}
              title={`${a.name} (${a.width}×${a.height})`}
            >
              <img src={a.dataUrl} alt={a.name} />
              <span className="admin-asset-picker-name">{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
