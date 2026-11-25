import { z } from 'zod';
import { CraneInput, computeHookHeadroomMm } from './calculations.js';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export type ValidationResult =
  | { success: true; data: CraneInput }
  | { success: false; errors: ValidationErrorItem[] };

// ASSUMPTION: Input ranges for single-girder EOT crane
export const craneInputSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name must be between 1 and 80 characters')
    .max(80, 'Name must be between 1 and 80 characters'),
  capacity_t: z
    .number({ required_error: 'Capacity is required', invalid_type_error: 'Capacity must be a number' })
    .min(1, 'Capacity must be between 1 and 20 t')
    .max(20, 'Capacity must be between 1 and 20 t'),
  span_m: z
    .number({ required_error: 'Span is required', invalid_type_error: 'Span must be a number' })
    .min(7.5, 'Span must be between 7.5 and 30 m')
    .max(30, 'Span must be between 7.5 and 30 m'),
  lifting_height_m: z
    .number({ required_error: 'Lifting height is required', invalid_type_error: 'Lifting height must be a number' })
    .min(3, 'Lifting height must be between 3 and 20 m')
    .max(20, 'Lifting height must be between 3 and 20 m'),
  duty_class: z.enum(['A3', 'A4', 'A5', 'A6'], {
    errorMap: () => ({ message: 'Duty class must be A3, A4, A5, or A6' }),
  }),
  hoist_speed_m_min: z
    .number({ required_error: 'Hoist speed is required', invalid_type_error: 'Hoist speed must be a number' })
    .positive('Hoist speed must be positive')
    .max(30, 'Hoist speed must be at most 30 m/min'),
  traverse_speed_m_min: z
    .number({ required_error: 'Traverse speed is required', invalid_type_error: 'Traverse speed must be a number' })
    .positive('Traverse speed must be positive')
    .max(60, 'Traverse speed must be at most 60 m/min'),
  travel_speed_m_min: z
    .number({ required_error: 'Travel speed is required', invalid_type_error: 'Travel speed must be a number' })
    .positive('Travel speed must be positive')
    .max(80, 'Travel speed must be at most 80 m/min'),
  supply: z.enum(['380V/50Hz', '400V/50Hz', '415V/50Hz'], {
    errorMap: () => ({ message: 'Supply must be 380V/50Hz, 400V/50Hz, or 415V/50Hz' }),
  }),
  floor_to_rail_height_m: z
    .number({
      required_error: 'Floor-to-rail height is required',
      invalid_type_error: 'Floor-to-rail height must be a number',
    })
    .min(4, 'Floor-to-rail height must be between 4 and 25 m')
    .max(25, 'Floor-to-rail height must be between 4 and 25 m'),
  hook_approach_left_mm: z
    .number({
      required_error: 'Left hook approach is required',
      invalid_type_error: 'Left hook approach must be a number',
    })
    .min(300, 'Left hook approach must be between 300 and 5000 mm')
    .max(5000, 'Left hook approach must be between 300 and 5000 mm'),
  hook_approach_right_mm: z
    .number({
      required_error: 'Right hook approach is required',
      invalid_type_error: 'Right hook approach must be a number',
    })
    .min(300, 'Right hook approach must be between 300 and 5000 mm')
    .max(5000, 'Right hook approach must be between 300 and 5000 mm'),
});

export function validateCraneInput(raw: unknown): ValidationResult {
  const parsed = craneInputSchema.safeParse(raw);
  const errors: ValidationErrorItem[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      });
    }
    // Still run headroom cross-field check if its own numeric inputs are present
    if (raw && typeof raw === 'object') {
      const r = raw as Record<string, unknown>;
      if (
        typeof r.lifting_height_m === 'number' &&
        Number.isFinite(r.lifting_height_m) &&
        typeof r.floor_to_rail_height_m === 'number' &&
        Number.isFinite(r.floor_to_rail_height_m) &&
        typeof r.capacity_t === 'number' &&
        Number.isFinite(r.capacity_t)
      ) {
        const headroom_mm = computeHookHeadroomMm(r.capacity_t);
        if (r.lifting_height_m * 1000 + headroom_mm > r.floor_to_rail_height_m * 1000) {
          errors.push({
            field: 'lifting_height_m',
            message: `Lifting height (${r.lifting_height_m * 1000} mm) + hook headroom (${headroom_mm} mm) exceeds floor-to-rail height (${r.floor_to_rail_height_m * 1000} mm)`,
          });
        }
      }
    }
    return { success: false, errors };
  }

  const data = parsed.data;
  const headroom_mm = computeHookHeadroomMm(data.capacity_t);

  if (data.lifting_height_m * 1000 + headroom_mm > data.floor_to_rail_height_m * 1000) {
    errors.push({
      field: 'lifting_height_m',
      message: `Lifting height (${data.lifting_height_m * 1000} mm) + hook headroom (${headroom_mm} mm) exceeds floor-to-rail height (${data.floor_to_rail_height_m * 1000} mm)`,
    });
  }

  // ASSUMPTION: Single-girder EOT envelope limit (capacity * span <= 450 t·m)
  if (data.capacity_t * data.span_m > 450) {
    errors.push({
      field: 'span_m',
      message: `Capacity (${data.capacity_t} t) × span (${data.span_m} m) exceeds single-girder envelope (450 t·m); consider a double-girder crane`,
    });
  }

  if (data.hook_approach_left_mm + data.hook_approach_right_mm >= data.span_m * 1000) {
    errors.push({
      field: 'hook_approach_left_mm',
      message: 'Sum of left and right hook approaches must be less than the crane span',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}
