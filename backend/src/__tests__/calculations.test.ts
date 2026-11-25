import { describe, it, expect } from 'vitest';
import { computeCrane, computeMaxStaticWheelLoadKn, CraneInput } from '../calculations.js';
import { FORMULAS } from '../formulas.js';

const REFERENCE_INPUT: CraneInput = {
  name: 'Reference 10t / 25m Single Girder',
  capacity_t: 10,
  span_m: 25,
  lifting_height_m: 7.9,
  duty_class: 'A5',
  hoist_speed_m_min: 6,
  traverse_speed_m_min: 20,
  travel_speed_m_min: 32,
  supply: '380V/50Hz',
  floor_to_rail_height_m: 8.321,
  hook_approach_left_mm: 920,
  hook_approach_right_mm: 1150,
};

describe('calculations', () => {
  it('computes reference crane dimensions and wheel load near 72.3 kN (vs 74.8 kN on drawing)', () => {
    const result = computeCrane(REFERENCE_INPUT);

    expect(result.span_mm).toBe(25000);
    expect(result.overall_length_mm).toBe(25270);
    expect(result.wheelbase_mm).toBe(3788); // 25000 / 6.6 rounded (reference drawing: 3800)
    expect(result.overall_width_mm).toBe(4298); // wheelbase + 510 (reference drawing: 4310)
    expect(result.hook_headroom_mm).toBe(620);
    expect(result.wheel_diameter_mm).toBe(250);
    expect(result.trolley_weight_t).toBe(0.68);
    expect(result.crane_weight_t).toBe(8.91);
    expect(result.supply_power_kW).toBe(14.3);

    const directWheelLoad = computeMaxStaticWheelLoadKn({
      capacity_t: 10,
      trolley_weight_t: 0.68,
      crane_weight_t: 8.91,
      span_m: 25,
      min_approach_m: 0.92,
    });

    const drawingWheelLoad = 74.8;
    const diffKn = Number((drawingWheelLoad - directWheelLoad).toFixed(2));
    const diffPct = Number(((diffKn / drawingWheelLoad) * 100).toFixed(2));
    console.log(
      `[Reference Wheel Load] Computed: ${directWheelLoad} kN | Drawing: ${drawingWheelLoad} kN | Diff: ${diffKn} kN (${diffPct}%)`
    );

    expect(directWheelLoad).toBeCloseTo(72.31, 1);
    expect(result.max_static_wheel_load_kN).toBeCloseTo(72.31, 1);
  });

  it('includes formula source and confidence metadata in computed result', () => {
    const result = computeCrane(REFERENCE_INPUT);
    expect(result.formulas).toEqual(FORMULAS);
    expect(result.formulas.max_static_wheel_load_kN.source).toBe('PHYSICS');
    expect(result.formulas.overall_length_mm.source).toBe('REFERENCE_DRAWING');
    expect(result.formulas.girder_height_mm.source).toBe('ENGINEERING_RULE_OF_THUMB_ESTIMATE');
  });
});
