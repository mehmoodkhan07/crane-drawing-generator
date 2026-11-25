import { CraneInput, ComputedCrane } from './calculations.js';

export function generateCraneSvg(input: CraneInput, computed: ComputedCrane): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">
  <rect width="800" height="200" fill="#ffffff" stroke="#1e293b" stroke-width="2" />
  <text x="24" y="48" font-family="monospace" font-size="18" font-weight="bold" fill="#0f172a">
    ${escapeXml(input.name)} — ${input.capacity_t}t / ${input.span_m}m
  </text>
  <text x="24" y="84" font-family="monospace" font-size="13" fill="#334155">
    Overall Length: ${computed.overall_length_mm} mm | Wheelbase: ${computed.wheelbase_mm} mm | Max Wheel Load: ${computed.max_static_wheel_load_kN} kN
  </text>
  <text x="24" y="116" font-family="monospace" font-size="12" fill="#64748b">
    NOT TO SCALE / PRELIMINARY (Placeholder SVG — full 3-view drawing in Part B)
  </text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
