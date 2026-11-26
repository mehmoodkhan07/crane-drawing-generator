import { describe, it, expect } from 'vitest';
import { validateCraneInput } from '../validation.js';

const VALID_INPUT = {
  name: 'Test 10t Crane',
  capacity_t: 10,
  span_m: 25,
  lifting_height_m: 7.5,
  duty_class: 'A5',
  hoist_speed_m_min: 6,
  traverse_speed_m_min: 20,
  travel_speed_m_min: 32,
  supply: '380V/50Hz',
  floor_to_rail_height_m: 8.5,
  hook_approach_left_mm: 920,
  hook_approach_right_mm: 1150,
};

describe('validation', () => {
  it('accepts valid input', () => {
    const res = validateCraneInput(VALID_INPUT);
    expect(res.success).toBe(true);
  });

  it('rejects negative span', () => {
    const res = validateCraneInput({ ...VALID_INPUT, span_m: -5 });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.some((e) => e.field === 'span_m')).toBe(true);
    }
  });

  it('rejects span out of range', () => {
    const res = validateCraneInput({ ...VALID_INPUT, span_m: 35 });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.some((e) => e.field === 'span_m')).toBe(true);
    }
  });

  it('rejects missing name', () => {
    const res = validateCraneInput({ ...VALID_INPUT, name: '   ' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.some((e) => e.field === 'name')).toBe(true);
    }
  });

  it('rejects lifting height + headroom exceeding floor-to-rail height', () => {
    const res = validateCraneInput({
      ...VALID_INPUT,
      lifting_height_m: 8.0,
      floor_to_rail_height_m: 8.2,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.some((e) => e.field === 'lifting_height_m')).toBe(true);
    }
  });

  it('returns multiple errors at once', () => {
    const res = validateCraneInput({
      ...VALID_INPUT,
      name: '',
      span_m: -2,
      capacity_t: 50,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.length).toBeGreaterThanOrEqual(3);
      const fields = res.errors.map((e) => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('span_m');
      expect(fields).toContain('capacity_t');
    }
  });

  it('skips cross-field headroom check when capacity_t is out of range (avoids misleading headroom)', () => {
    const res = validateCraneInput({
      ...VALID_INPUT,
      name: '',
      span_m: -5,
      capacity_t: 500,
      lifting_height_m: 19,
      floor_to_rail_height_m: 8,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.some((e) => e.field === 'lifting_height_m')).toBe(false);
    }
  });

  it('returns cross-field headroom error together with another field error when capacity_t is valid', () => {
    const res = validateCraneInput({
      ...VALID_INPUT,
      name: '',
      capacity_t: 10,
      lifting_height_m: 19,
      floor_to_rail_height_m: 8,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = res.errors.map((e) => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('lifting_height_m');
    }
  });
});
