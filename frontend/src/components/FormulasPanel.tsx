import { useEffect, useState } from 'react';
import type { FormulaMeta, FormulaSource } from '../types';
import { apiGetFormulas } from '../api';

const SOURCE_LABELS: Record<FormulaSource, string> = {
  REFERENCE_DRAWING: 'Ref Drawing',
  ENGINEERING_RULE_OF_THUMB_ESTIMATE: 'Estimate',
  PHYSICS: 'Physics',
  TO_VERIFY_WITH_ENGINEERS: 'To Verify',
};

const SOURCE_CLASS: Record<FormulaSource, string> = {
  REFERENCE_DRAWING: 'tag-ref',
  ENGINEERING_RULE_OF_THUMB_ESTIMATE: 'tag-est',
  PHYSICS: 'tag-phys',
  TO_VERIFY_WITH_ENGINEERS: 'tag-tbd',
};

const CONF_CLASS: Record<string, string> = {
  high: 'conf-high',
  medium: 'conf-med',
  low: 'conf-low',
};

export function FormulasPanel() {
  const [formulas, setFormulas] = useState<FormulaMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiGetFormulas()
      .then((f) => { setFormulas(f); setError(null); })
      .catch(() => setError('Could not load formulas.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="formulas-panel">
      <button className="formulas-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▲' : '▼'} Assumptions &amp; Sources ({formulas.length})
      </button>
      {open && (
        <div className="formulas-content">
          <p className="formulas-note">
            Every computed value has an engineering source label. <strong>Estimates (est.)</strong>{' '}
            are rule-of-thumb approximations, not FEM/ISO structural calculations.
          </p>
          {loading && <div>Loading…</div>}
          {error && <div className="list-error">{error}</div>}
          <table className="formulas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Source</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {formulas.map((f) => (
                <tr key={f.id}>
                  <td><code>{f.id}</code></td>
                  <td>{f.description}</td>
                  <td>
                    <span className={`tag ${SOURCE_CLASS[f.source]}`}>
                      {SOURCE_LABELS[f.source]}
                    </span>
                  </td>
                  <td>
                    <span className={`conf ${CONF_CLASS[f.confidence]}`}>
                      {f.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
