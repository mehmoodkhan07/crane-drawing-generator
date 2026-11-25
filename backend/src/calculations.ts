import { FORMULAS, FormulaMeta } from './formulas.js';

export interface CraneInput {
  name: string;
  capacity_t: number;
  span_m: number;
  lifting_height_m: number;
  duty_class: 'A3' | 'A4' | 'A5' | 'A6';
  hoist_speed_m_min: number;
  traverse_speed_m_min: number;
  travel_speed_m_min: number;
  supply: '380V/50Hz' | '400V/50Hz' | '415V/50Hz';
  floor_to_rail_height_m: number;
  hook_approach_left_mm: number;
  hook_approach_right_mm: number;
}

export interface ComputedCrane {
  span_mm: number;
  overall_length_mm: number;
  wheelbase_mm: number;
  overall_width_mm: number;
  girder_height_mm: number;
  hook_headroom_mm: number;
  lifting_height_mm: number;
  floor_to_rail_height_mm: number;
  wheel_diameter_mm: number;
  trolley_weight_t: number;
  crane_weight_t: number;
  max_static_wheel_load_kN: number;
  supply_power_kW: number;
  formulas: Record<string, FormulaMeta>;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function computeHookHeadroomMm(capacity_t: number): number {
  return Math.round(620 + (capacity_t - 10) * 15);
}

export function computeMaxStaticWheelLoadKn(params: {
  capacity_t: number;
  trolley_weight_t: number;
  crane_weight_t: number;
  span_m: number;
  min_approach_m: number;
}): number {
  const { capacity_t, trolley_weight_t, crane_weight_t, span_m, min_approach_m } = params;
  const endReactionTonnes =
    ((capacity_t + trolley_weight_t) * (span_m - min_approach_m)) / span_m + crane_weight_t / 2;
  const wheelLoadKn = (endReactionTonnes * 9.81) / 2;
  return Number(wheelLoadKn.toFixed(2));
}

export function computeCrane(input: CraneInput): ComputedCrane {
  const span_mm = Math.round(input.span_m * 1000);
  const overall_length_mm = span_mm + 270;
  const wheelbase_mm = Math.round(clamp(span_mm / 6.6, 2000, 6000));
  const overall_width_mm = wheelbase_mm + 510;
  const girder_height_mm = Math.round(span_mm / 20);
  const hook_headroom_mm = computeHookHeadroomMm(input.capacity_t);
  const lifting_height_mm = Math.round(input.lifting_height_m * 1000);
  const floor_to_rail_height_mm = Math.round(input.floor_to_rail_height_m * 1000);
  const wheel_diameter_mm = input.capacity_t <= 12.5 ? 250 : 315;

  const trolley_weight_t = Number((0.68 * Math.pow(input.capacity_t / 10, 0.65)).toFixed(2));
  const crane_weight_t = Number(
    (8.91 * Math.pow(input.capacity_t / 10, 0.5) * Math.pow(input.span_m / 25, 1.1)).toFixed(2)
  );

  const min_approach_m =
    Math.min(input.hook_approach_left_mm, input.hook_approach_right_mm) / 1000;

  const max_static_wheel_load_kN = computeMaxStaticWheelLoadKn({
    capacity_t: input.capacity_t,
    trolley_weight_t,
    crane_weight_t,
    span_m: input.span_m,
    min_approach_m,
  });

  const supply_power_kW = Number(
    (14.3 * (input.capacity_t / 10) * (input.hoist_speed_m_min / 6)).toFixed(1)
  );

  return {
    span_mm,
    overall_length_mm,
    wheelbase_mm,
    overall_width_mm,
    girder_height_mm,
    hook_headroom_mm,
    lifting_height_mm,
    floor_to_rail_height_mm,
    wheel_diameter_mm,
    trolley_weight_t,
    crane_weight_t,
    max_static_wheel_load_kN,
    supply_power_kW,
    formulas: FORMULAS,
  };
}
