import React from 'react';
import type { CraneFormData, ValidationError, DutyClass, Supply } from '../types';

interface Props {
  form: CraneFormData;
  errors: ValidationError[];
  saving: boolean;
  editingId: number | null;
  onChange: (patch: Partial<CraneFormData>) => void;
  onSave: () => void;
  onNew: () => void;
}

function fieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

function Field({
  label,
  unit,
  error,
  children,
}: {
  label: string;
  unit?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>
        {label}
        {unit && <span className="unit"> ({unit})</span>}
      </label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function CraneForm({ form, errors, saving, editingId, onChange, onSave, onNew }: Props) {
  const f = (field: keyof CraneFormData) => fieldError(errors, field);

  // Errors that have no specific field (body / cross-field)
  const unattachedErrors = errors.filter(
    (e) => !Object.keys(form).includes(e.field) && e.field !== 'id'
  );

  return (
    <form className="crane-form" onSubmit={(ev) => { ev.preventDefault(); onSave(); }}>
      <div className="form-header">
        <h2>{editingId ? `Editing design #${editingId}` : 'New design'}</h2>
        <span className="units-note">Units: metric — drawing dimensions in mm</span>
      </div>

      {unattachedErrors.length > 0 && (
        <div className="form-errors-banner">
          {unattachedErrors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </div>
      )}

      <Field label="Design Name" error={f('name')}>
        <input
          type="text"
          value={form.name}
          maxLength={80}
          placeholder="e.g. Workshop Crane A"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </Field>

      <div className="field-row">
        <Field label="Capacity" unit="t" error={f('capacity_t')}>
          <input
            type="number"
            value={form.capacity_t}
            min={1}
            max={20}
            step={0.5}
            onChange={(e) => onChange({ capacity_t: e.target.value })}
          />
        </Field>
        <Field label="Span" unit="m" error={f('span_m')}>
          <input
            type="number"
            value={form.span_m}
            min={7.5}
            max={30}
            step={0.5}
            onChange={(e) => onChange({ span_m: e.target.value })}
          />
        </Field>
      </div>

      <div className="field-row">
        <Field label="Lifting Height" unit="m" error={f('lifting_height_m')}>
          <input
            type="number"
            value={form.lifting_height_m}
            min={3}
            max={20}
            step={0.1}
            onChange={(e) => onChange({ lifting_height_m: e.target.value })}
          />
        </Field>
        <Field label="Floor to Rail Height" unit="m" error={f('floor_to_rail_height_m')}>
          <input
            type="number"
            value={form.floor_to_rail_height_m}
            min={4}
            max={25}
            step={0.1}
            onChange={(e) => onChange({ floor_to_rail_height_m: e.target.value })}
          />
        </Field>
      </div>

      <div className="field-row">
        <Field label="Duty Class (FEM/ISO)" error={f('duty_class')}>
          <select value={form.duty_class} onChange={(e) => onChange({ duty_class: e.target.value as DutyClass })}>
            {(['A3', 'A4', 'A5', 'A6'] as DutyClass[]).map((dc) => (
              <option key={dc} value={dc}>{dc}</option>
            ))}
          </select>
        </Field>
        <Field label="Supply" error={f('supply')}>
          <select value={form.supply} onChange={(e) => onChange({ supply: e.target.value as Supply })}>
            {(['380V/50Hz', '400V/50Hz', '415V/50Hz'] as Supply[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="field-row">
        <Field label="Hoist Speed" unit="m/min" error={f('hoist_speed_m_min')}>
          <input
            type="number"
            value={form.hoist_speed_m_min}
            min={0.1}
            max={30}
            step={0.5}
            onChange={(e) => onChange({ hoist_speed_m_min: e.target.value })}
          />
        </Field>
        <Field label="Traverse Speed" unit="m/min" error={f('traverse_speed_m_min')}>
          <input
            type="number"
            value={form.traverse_speed_m_min}
            min={0.1}
            max={60}
            step={1}
            onChange={(e) => onChange({ traverse_speed_m_min: e.target.value })}
          />
        </Field>
        <Field label="Travel Speed" unit="m/min" error={f('travel_speed_m_min')}>
          <input
            type="number"
            value={form.travel_speed_m_min}
            min={0.1}
            max={80}
            step={1}
            onChange={(e) => onChange({ travel_speed_m_min: e.target.value })}
          />
        </Field>
      </div>

      <div className="field-row">
        <Field label="Min Hook Approach Left" unit="mm" error={f('hook_approach_left_mm')}>
          <input
            type="number"
            value={form.hook_approach_left_mm}
            min={300}
            max={5000}
            step={10}
            onChange={(e) => onChange({ hook_approach_left_mm: e.target.value })}
          />
        </Field>
        <Field label="Min Hook Approach Right" unit="mm" error={f('hook_approach_right_mm')}>
          <input
            type="number"
            value={form.hook_approach_right_mm}
            min={300}
            max={5000}
            step={10}
            onChange={(e) => onChange({ hook_approach_right_mm: e.target.value })}
          />
        </Field>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editingId ? 'Update Design' : 'Save Design'}
        </button>
        {editingId && (
          <button type="button" className="btn-secondary" onClick={onNew}>
            + New Design
          </button>
        )}
      </div>
    </form>
  );
}
