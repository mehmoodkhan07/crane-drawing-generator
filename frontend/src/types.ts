// All shared TypeScript types for the frontend — mirrors backend models

export type DutyClass = 'A3' | 'A4' | 'A5' | 'A6';
export type Supply = '380V/50Hz' | '400V/50Hz' | '415V/50Hz';
export type FormulaSource =
  | 'REFERENCE_DRAWING'
  | 'ENGINEERING_RULE_OF_THUMB_ESTIMATE'
  | 'PHYSICS'
  | 'TO_VERIFY_WITH_ENGINEERS';
export type Confidence = 'high' | 'medium' | 'low';

export interface FormulaMeta {
  id: string;
  description: string;
  source: FormulaSource;
  confidence: Confidence;
}

export interface CraneFormData {
  name: string;
  capacity_t: string;
  span_m: string;
  lifting_height_m: string;
  duty_class: DutyClass;
  hoist_speed_m_min: string;
  traverse_speed_m_min: string;
  travel_speed_m_min: string;
  supply: Supply;
  floor_to_rail_height_m: string;
  hook_approach_left_mm: string;
  hook_approach_right_mm: string;
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

export interface DesignListItem {
  id: number;
  name: string;
  capacity_t: number;
  span_m: number;
  lifting_height_m: number;
  duty_class: DutyClass;
  updated_at: string;
}

export interface DesignFull {
  id: number;
  name: string;
  capacity_t: number;
  span_m: number;
  lifting_height_m: number;
  duty_class: DutyClass;
  hoist_speed_m_min: number;
  traverse_speed_m_min: number;
  travel_speed_m_min: number;
  supply: Supply;
  floor_to_rail_height_m: number;
  hook_approach_left_mm: number;
  hook_approach_right_mm: number;
  computed: ComputedCrane;
  created_at: string;
  updated_at: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  errors: ValidationError[];
}

export interface PreviewResponse {
  computed: ComputedCrane;
  svg: string;
}
