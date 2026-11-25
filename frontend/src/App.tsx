import { useState, useCallback } from 'react';
import { CraneForm } from './components/CraneForm';
import { DrawingPreview } from './components/DrawingPreview';
import { DesignsList } from './components/DesignsList';
import { FormulasPanel } from './components/FormulasPanel';
import type { CraneFormData, ValidationError } from './types';
import { apiCreateDesign, apiUpdateDesign, apiGetDesign } from './api';
import { DEFAULT_FORM } from './defaults';
import './App.css';

export default function App() {
  const [form, setForm] = useState<CraneFormData>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleChange = useCallback((patch: Partial<CraneFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaveSuccess(false);
  }, []);

  const handlePreviewErrors = useCallback((errors: ValidationError[]) => {
    // Preview errors replace field errors so the form stays in sync with the live drawing
    setFieldErrors(errors);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setFieldErrors([]);
    try {
      if (editingId) {
        const updated = await apiUpdateDesign(editingId, form);
        setEditingId(updated.id);
      } else {
        const created = await apiCreateDesign(form);
        setEditingId(created.id);
      }
      setRefreshTrigger((n) => n + 1);
      setSaveSuccess(true);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        setFieldErrors((err as { errors: ValidationError[] }).errors);
      } else {
        setFieldErrors([{ field: 'body', message: 'Save failed: backend unreachable.' }]);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleNew() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setFieldErrors([]);
    setSaveSuccess(false);
  }

  async function handleOpen(id: number) {
    try {
      const d = await apiGetDesign(id);
      setForm({
        name: d.name,
        capacity_t: String(d.capacity_t),
        span_m: String(d.span_m),
        lifting_height_m: String(d.lifting_height_m),
        duty_class: d.duty_class,
        hoist_speed_m_min: String(d.hoist_speed_m_min),
        traverse_speed_m_min: String(d.traverse_speed_m_min),
        travel_speed_m_min: String(d.travel_speed_m_min),
        supply: d.supply,
        floor_to_rail_height_m: String(d.floor_to_rail_height_m),
        hook_approach_left_mm: String(d.hook_approach_left_mm),
        hook_approach_right_mm: String(d.hook_approach_right_mm),
      });
      setEditingId(d.id);
      setFieldErrors([]);
      setSaveSuccess(false);
    } catch {
      alert('Failed to load design.');
    }
  }

  async function handleDuplicate(id: number) {
    try {
      const d = await apiGetDesign(id);
      setForm({
        name: `${d.name} (copy)`,
        capacity_t: String(d.capacity_t),
        span_m: String(d.span_m),
        lifting_height_m: String(d.lifting_height_m),
        duty_class: d.duty_class,
        hoist_speed_m_min: String(d.hoist_speed_m_min),
        traverse_speed_m_min: String(d.traverse_speed_m_min),
        travel_speed_m_min: String(d.travel_speed_m_min),
        supply: d.supply,
        floor_to_rail_height_m: String(d.floor_to_rail_height_m),
        hook_approach_left_mm: String(d.hook_approach_left_mm),
        hook_approach_right_mm: String(d.hook_approach_right_mm),
      });
      setEditingId(null); // treat as new
      setFieldErrors([]);
      setSaveSuccess(false);
    } catch {
      alert('Failed to duplicate design.');
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Parametric Overhead Crane Drawing Generator</h1>
        <span className="header-subtitle">Single Girder EOT Crane · Modern Crane Co</span>
      </header>

      <main className="app-main">
        <section className="left-pane">
          <CraneForm
            form={form}
            errors={fieldErrors}
            saving={saving}
            editingId={editingId}
            onChange={handleChange}
            onSave={handleSave}
            onNew={handleNew}
          />
          {saveSuccess && <div className="save-success">✓ Design saved successfully.</div>}
          <DesignsList
            refreshTrigger={refreshTrigger}
            editingId={editingId}
            onOpen={handleOpen}
            onDuplicate={handleDuplicate}
          />
          <FormulasPanel />
        </section>

        <section className="right-pane">
          <DrawingPreview
            form={form}
            editingId={editingId}
            onPreviewErrors={handlePreviewErrors}
          />
        </section>
      </main>
    </div>
  );
}
