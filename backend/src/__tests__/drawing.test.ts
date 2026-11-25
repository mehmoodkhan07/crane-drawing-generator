import { describe, it, expect } from 'vitest';
import { computeCrane, CraneInput } from '../calculations.js';
import { generateCraneSvg } from '../drawing.js';

const BASE_INPUT: CraneInput = {
  name: 'Reference 10t / 25m',
  capacity_t: 10,
  span_m: 25,
  lifting_height_m: 7.7,
  duty_class: 'A5',
  hoist_speed_m_min: 6,
  traverse_speed_m_min: 20,
  travel_speed_m_min: 32,
  supply: '380V/50Hz',
  floor_to_rail_height_m: 8.321,
  hook_approach_left_mm: 920,
  hook_approach_right_mm: 1150,
};

describe('drawing (SVG)', () => {
  it('contains all 3 views, required dimension labels, est. tags, and title block', () => {
    const computed = computeCrane(BASE_INPUT);
    const svg = generateCraneSvg(BASE_INPUT, computed);

    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('1. FRONT ELEVATION');
    expect(svg).toContain('2. PLAN VIEW (TOP)');
    expect(svg).toContain('3. END VIEW');
    expect(svg).toContain('SPAN: 25000 mm');
    expect(svg).toContain('OVERALL LENGTH: 25270 mm');
    expect(svg).toContain('LIFTING HEIGHT: 7700 mm');
    expect(svg).toContain('FLOOR TO RAIL: 8321 mm');
    expect(svg).toContain('HEADROOM: 620 mm');
    expect(svg).toContain('MIN APP L: 920 mm');
    expect(svg).toContain('MIN APP R: 1150 mm');
    expect(svg).toContain(`WHEELBASE: ${computed.wheelbase_mm} mm`);
    expect(svg).toContain(`OVERALL WIDTH: ${computed.overall_width_mm} mm`);
    expect(svg).toContain('est.');
    expect(svg).toContain('NOT TO SCALE / PRELIMINARY');
  });

  it('changes dimensions when span changes', () => {
    const svg25 = generateCraneSvg(BASE_INPUT, computeCrane(BASE_INPUT));
    const input12 = { ...BASE_INPUT, span_m: 12 };
    const svg12 = generateCraneSvg(input12, computeCrane(input12));

    expect(svg25).toContain('SPAN: 25000 mm');
    expect(svg12).toContain('SPAN: 12000 mm');
    expect(svg12).toContain('OVERALL LENGTH: 12270 mm');
    expect(svg25).not.toBe(svg12);
  });

  it('escapes XML special characters in user-provided design name', () => {
    const xssInput: CraneInput = {
      ...BASE_INPUT,
      name: '<script>alert(1)</script> & "quotes"',
    };
    const svg = generateCraneSvg(xssInput, computeCrane(xssInput));

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;');
  });
});
