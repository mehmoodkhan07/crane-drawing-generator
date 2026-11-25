import { useEffect, useState } from 'react';
import type { DesignListItem } from '../types';
import { apiListDesigns, apiDeleteDesign, svgDownloadUrl } from '../api';

interface Props {
  refreshTrigger: number;
  editingId: number | null;
  onOpen: (id: number) => void;
  onDuplicate: (id: number) => void;
}

export function DesignsList({ refreshTrigger, editingId, onOpen, onDuplicate }: Props) {
  const [designs, setDesigns] = useState<DesignListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiListDesigns()
      .then((list) => { setDesigns(list); setError(null); })
      .catch(() => setError('Could not load designs (backend unreachable?).'))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiDeleteDesign(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert('Failed to delete design.');
    }
  }

  return (
    <div className="designs-list">
      <h3>Saved Designs</h3>
      {loading && <div className="list-status">Loading…</div>}
      {error && <div className="list-error">{error}</div>}
      {!loading && !error && designs.length === 0 && (
        <div className="list-status">No saved designs yet.</div>
      )}
      <ul>
        {designs.map((d) => (
          <li key={d.id} className={d.id === editingId ? 'list-item active' : 'list-item'}>
            <div className="list-item-info">
              <strong>{d.name}</strong>
              <span className="list-item-meta">
                {d.capacity_t}t · {d.span_m}m · {d.duty_class}
              </span>
              <span className="list-item-date">{d.updated_at.slice(0, 16).replace('T', ' ')}</span>
            </div>
            <div className="list-item-actions">
              <button className="btn-xs btn-primary" onClick={() => onOpen(d.id)}>
                Open
              </button>
              <button className="btn-xs btn-secondary" onClick={() => onDuplicate(d.id)}>
                Dup
              </button>
              <a
                className="btn-xs btn-secondary"
                href={svgDownloadUrl(d.id)}
                download={`crane-${d.id}.svg`}
              >
                SVG
              </a>
              <button className="btn-xs btn-danger" onClick={() => handleDelete(d.id, d.name)}>
                Del
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
