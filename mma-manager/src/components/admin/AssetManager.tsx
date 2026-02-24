import { useRef, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import type { AssetEntry } from '../../types/admin';
import { IMAGE_SPECS, getImageSpec, checkImageDimensions, checkFileSize } from './assetGuidance';

const CATEGORIES = ['portrait', 'sprite', 'icon', 'background', 'venue', 'sponsor_logo', 'misc'] as const;

interface UploadWarning {
  assetId: string;
  messages: string[];
}

export default function AssetManager() {
  const { bundle, addAsset, removeAsset, updateAssetCategory } = useAdminStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [preview, setPreview] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<UploadWarning[]>([]);

  const assets = bundle.assets.filter(
    (a) => filterCat === 'all' || a.category === filterCat
  );

  const currentSpec = filterCat !== 'all' ? getImageSpec(filterCat) : null;

  const handleUpload = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const assignedCategory = filterCat !== 'all' ? filterCat as AssetEntry['category'] : 'misc';
          const id = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          const entry: AssetEntry = {
            id,
            name: file.name.replace(/\.[^.]+$/, ''),
            category: assignedCategory,
            dataUrl: reader.result as string,
            width: img.width,
            height: img.height,
            createdAt: Date.now(),
          };
          addAsset(entry);

          // Check dimensions & file size warnings
          const msgs: string[] = [];
          const dimCheck = checkImageDimensions(assignedCategory, img.width, img.height);
          if (!dimCheck.ok) msgs.push(dimCheck.warning);
          const sizeCheck = checkFileSize(assignedCategory, file.size);
          if (!sizeCheck.ok) msgs.push(sizeCheck.warning);

          if (msgs.length > 0) {
            setWarnings((prev) => [...prev, { assetId: id, messages: msgs }]);
            // Auto-dismiss after 8 seconds
            setTimeout(() => {
              setWarnings((prev) => prev.filter((w) => w.assetId !== id));
            }, 8000);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this asset?')) removeAsset(id);
  };

  const handleCategoryChange = (id: string, category: AssetEntry['category']) => {
    updateAssetCategory(id, category);
  };

  const dismissWarning = (assetId: string) => {
    setWarnings((prev) => prev.filter((w) => w.assetId !== assetId));
  };

  // Estimate data URL size in KB
  const getAssetSizeKB = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1] ?? '';
    return Math.round((base64.length * 3) / 4 / 1024);
  };

  return (
    <div className="admin-editor">
      <div className="admin-editor-header">
        <h1 className="admin-page-title">Assets</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleUpload}>+ Upload</button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Upload warnings */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {warnings.map((w) => (
            <div key={w.assetId} className="admin-guidance-banner admin-guidance-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {w.messages.map((m, i) => (
                  <div key={i}>⚠ {m}</div>
                ))}
              </div>
              <button className="admin-btn admin-btn-xs" onClick={() => dismissWarning(w.assetId)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="admin-tabs">
        <button className={`admin-tab ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>
          All ({bundle.assets.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = bundle.assets.filter((a) => a.category === c).length;
          return (
            <button key={c} className={`admin-tab ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>
              {c.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Guidance banner for selected category */}
      {currentSpec && (
        <div className="admin-guidance-banner">
          <strong>{currentSpec.label}</strong> — {currentSpec.usage}
          <br />
          Recommended: <strong>{currentSpec.width === 0 ? 'Any size' : `${currentSpec.width}×${currentSpec.height}px`}</strong>
          {' · '}{currentSpec.aspectRatio}
          {' · '}{currentSpec.formats.join('/')}
          {' · '}Max {currentSpec.maxFileSizeKB >= 1024 ? `${(currentSpec.maxFileSizeKB / 1024).toFixed(0)}MB` : `${currentSpec.maxFileSizeKB}KB`}
          <br />
          <span style={{ fontStyle: 'italic', color: '#6e7681' }}>{currentSpec.tips}</span>
        </div>
      )}

      {/* Asset grid */}
      <div className="admin-asset-grid">
        {assets.length === 0 && <div className="admin-empty">No assets uploaded{filterCat !== 'all' ? ` in ${filterCat.replace(/_/g, ' ')}` : ''}</div>}
        {assets.map((a) => {
          const sizeKB = getAssetSizeKB(a.dataUrl);
          const spec = getImageSpec(a.category);
          const dimCheck = a.width && a.height ? checkImageDimensions(a.category, a.width, a.height) : null;

          return (
            <div key={a.id} className="admin-asset-card">
              <div className="admin-asset-thumb" onClick={() => setPreview(a.dataUrl)}>
                <img src={a.dataUrl} alt={a.name} />
              </div>
              <div className="admin-asset-info">
                <span className="admin-asset-name">{a.name}</span>
                <select
                  className="admin-input admin-input-sm"
                  value={a.category}
                  onChange={(e) => handleCategoryChange(a.id, e.target.value as AssetEntry['category'])}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>

                {/* Dimension + size badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {a.width && a.height && (
                    <span
                      className="admin-asset-dims"
                      style={{ color: dimCheck && !dimCheck.ok ? '#f59e0b' : undefined }}
                      title={dimCheck && !dimCheck.ok ? dimCheck.warning : `${a.width}×${a.height}px`}
                    >
                      {a.width}×{a.height}
                      {dimCheck && !dimCheck.ok && ' ⚠'}
                    </span>
                  )}
                  <span
                    className="admin-asset-dims"
                    style={{ color: spec && sizeKB > spec.maxFileSizeKB ? '#f59e0b' : undefined }}
                  >
                    {sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`}
                  </span>
                </div>

                <button className="admin-btn admin-btn-danger admin-btn-xs" onClick={() => handleDelete(a.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spec reference table */}
      <div style={{ marginTop: 24, borderTop: '1px solid #30363d', paddingTop: 16 }}>
        <h3 style={{ fontSize: 13, color: '#8b949e', marginBottom: 10 }}>Image Specification Reference</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#8b949e' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #30363d', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Category</th>
                <th style={{ padding: '6px 8px' }}>Size</th>
                <th style={{ padding: '6px 8px' }}>Ratio</th>
                <th style={{ padding: '6px 8px' }}>Format</th>
                <th style={{ padding: '6px 8px' }}>Max Size</th>
                <th style={{ padding: '6px 8px' }}>Usage</th>
              </tr>
            </thead>
            <tbody>
              {IMAGE_SPECS.map((s) => (
                <tr key={s.category} style={{ borderBottom: '1px solid #21262d' }}>
                  <td style={{ padding: '6px 8px', color: '#e6edf3', fontWeight: 500 }}>{s.label}</td>
                  <td style={{ padding: '6px 8px' }}>{s.width === 0 ? 'Any' : `${s.width}×${s.height}`}</td>
                  <td style={{ padding: '6px 8px' }}>{s.aspectRatio}</td>
                  <td style={{ padding: '6px 8px' }}>{s.formats.join(', ')}</td>
                  <td style={{ padding: '6px 8px' }}>{s.maxFileSizeKB >= 1024 ? `${(s.maxFileSizeKB / 1024).toFixed(0)}MB` : `${s.maxFileSizeKB}KB`}</td>
                  <td style={{ padding: '6px 8px' }}>{s.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="admin-modal-overlay" onClick={() => setPreview(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={preview} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
            <button className="admin-btn admin-btn-secondary" onClick={() => setPreview(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
