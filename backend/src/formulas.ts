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

export const FORMULAS: Record<string, FormulaMeta> = {
  overall_length_mm: {
    id: 'overall_length_mm',
    description: 'span_mm + 270 mm end-carriage overhang (from 25270 mm at 25000 mm span)',
    source: 'REFERENCE_DRAWING',
    confidence: 'medium',
  },
  wheelbase_mm: {
    id: 'wheelbase_mm',
    description: 'span_mm / 6.6 clamped to [2000, 6000] mm (fitted to 3800 mm at 25 m)',
    source: 'ENGINEERING_RULE_OF_THUMB_ESTIMATE',
    confidence: 'low',
  },
  overall_width_mm: {
    id: 'overall_width_mm',
    description: 'wheelbase_mm + 510 mm buffer/end-plate allowance (from 4310 mm vs 3800 mm)',
    source: 'ENGINEERING_RULE_OF_THUMB_ESTIMATE',
    confidence: 'low',
  },
  girder_height_mm: {
    id: 'girder_height_mm',
    description: 'span_mm / 20 box-girder depth rule of thumb',
    source: 'ENGINEERING_RULE_OF_THUMB_ESTIMATE',
    confidence: 'low',
  },
  hook_headroom_mm: {
    id: 'hook_headroom_mm',
    description: '620 mm at 10 t, scaled mildly (+15 mm per tonne difference)',
    source: 'ENGINEERING_RULE_OF_THUMB_ESTIMATE',
    confidence: 'low',
  },
  wheel_diameter_mm: {
    id: 'wheel_diameter_mm',
    description: '250 mm default (<=12.5 t), 315 mm (>12.5 t)',
    source: 'REFERENCE_DRAWING',
    confidence: 'low',
  },
  trolley_weight_t: {
    id: 'trolley_weight_t',
    description: '0.68 t * (capacity_t / 10)^0.65 scaled from reference',
    source: 'ENGINEERING_RULE_OF_THUMB_ESTIMATE',
    confidence: 'low',
  },
  crane_weight_t: {
    id: 'crane_weight_t',
    description: '8.91 t * (capacity_t / 10)^0.5 * (span_m / 25)^1.1 scaled from reference',
    source: 'ENGINEERING_RULE_OF_THUMB_ESTIMATE',
    confidence: 'low',
  },
  max_static_wheel_load_kN: {
    id: 'max_static_wheel_load_kN',
    description:
      '((capacity + trolley_weight) * (span - min_approach) / span + crane_weight / 2) * 9.81 / 2 (2 wheels/end, no dynamic factors)',
    source: 'PHYSICS',
    confidence: 'medium',
  },
  supply_power_kW: {
    id: 'supply_power_kW',
    description: '14.3 kW * (capacity_t / 10) * (hoist_speed_m_min / 6) scaled from reference',
    source: 'ENGINEERING_RULE_OF_THUMB_ESTIMATE',
    confidence: 'low',
  },
  lifting_height_headroom_check: {
    id: 'lifting_height_headroom_check',
    description:
      'Reference drawing shows 7900 mm lifting height and 8321 mm floor-to-rail with 620 mm headroom; these do not satisfy our own rule (7900+620 > 8321). Seed uses 7700 mm. Real relation to be confirmed.',
    source: 'TO_VERIFY_WITH_ENGINEERS',
    confidence: 'low',
  },
};
