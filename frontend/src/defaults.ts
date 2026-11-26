import { CraneFormData } from './types';

export const DEFAULT_FORM: CraneFormData = {
  name: 'New 10t / 25m Crane',
  capacity_t: '10',
  span_m: '25',
  lifting_height_m: '7.7',
  duty_class: 'A5',
  hoist_speed_m_min: '6',
  traverse_speed_m_min: '20',
  travel_speed_m_min: '32',
  supply: '380V/50Hz',
  floor_to_rail_height_m: '8.5',
  hook_approach_left_mm: '920',
  hook_approach_right_mm: '1150',
};
