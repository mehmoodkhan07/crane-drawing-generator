import { CraneInput, ComputedCrane } from './calculations.js';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function dimH(x1: number, x2: number, y: number, label: string, extY1?: number, extY2?: number): string {
  const mid = (x1 + x2) / 2;
  const ext1 = extY1 !== undefined ? `<line x1="${x1}" y1="${extY1}" x2="${x1}" y2="${y - 4}" stroke="#64748b" stroke-width="0.8" />` : '';
  const ext2 = extY2 !== undefined ? `<line x1="${x2}" y1="${extY2}" x2="${x2}" y2="${y - 4}" stroke="#64748b" stroke-width="0.8" />` : '';
  return `
    ${ext1}${ext2}
    <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#0f172a" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
    <rect x="${mid - label.length * 3.3 - 4}" y="${y - 14}" width="${label.length * 6.6 + 8}" height="13" fill="#ffffff" />
    <text x="${mid}" y="${y - 4}" text-anchor="middle" font-family="monospace" font-size="11" fill="#0f172a">${escapeXml(label)}</text>
  `;
}

function dimV(x: number, y1: number, y2: number, label: string, extX1?: number, extX2?: number): string {
  const mid = (y1 + y2) / 2;
  const ext1 = extX1 !== undefined ? `<line x1="${extX1}" y1="${y1}" x2="${x - 4}" y2="${y1}" stroke="#64748b" stroke-width="0.8" />` : '';
  const ext2 = extX2 !== undefined ? `<line x1="${extX2}" y1="${y2}" x2="${x - 4}" y2="${y2}" stroke="#64748b" stroke-width="0.8" />` : '';
  return `
    ${ext1}${ext2}
    <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#0f172a" stroke-width="1" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
    <text x="${x - 6}" y="${mid}" text-anchor="middle" font-family="monospace" font-size="11" fill="#0f172a" transform="rotate(-90 ${x - 6} ${mid})">${escapeXml(label)}</text>
  `;
}

function isEstimate(computed: ComputedCrane, formulaId: string): boolean {
  const meta = computed.formulas[formulaId];
  return (
    meta?.source === 'ENGINEERING_RULE_OF_THUMB_ESTIMATE' ||
    meta?.source === 'TO_VERIFY_WITH_ENGINEERS'
  );
}

export function generateCraneSvg(input: CraneInput, computed: ComputedCrane): string {
  const today = new Date().toISOString().slice(0, 10);

  // Proportional scaling for Front Elevation (max width 660px, max height 260px)
  const elevX0 = 150;
  const elevSpanPx = Math.max(320, Math.min(660, (computed.span_mm / 30000) * 660));
  const elevX1 = elevX0 + elevSpanPx;
  const railY = 170;
  const floorY = railY + Math.max(120, Math.min(240, (computed.floor_to_rail_height_mm / 25000) * 240));
  const girderH = Math.max(22, Math.min(44, (computed.girder_height_mm / 1500) * 40));
  const girderTopY = railY - girderH - 12;
  const headroomPx = Math.max(18, Math.min(40, (computed.hook_headroom_mm / 1000) * 30));
  const hookY = railY + headroomPx;
  const liftPx = Math.max(60, Math.min(floorY - hookY - 12, (computed.lifting_height_mm / computed.floor_to_rail_height_mm) * (floorY - railY)));

  const leftAppPx = Math.max(35, (input.hook_approach_left_mm / computed.span_mm) * elevSpanPx);
  const rightAppPx = Math.max(35, (input.hook_approach_right_mm / computed.span_mm) * elevSpanPx);
  const trolleyX = elevX0 + elevSpanPx * 0.42;

  // Plan View (Top) below Front Elevation
  const planY0 = 540;
  const wbPx = Math.max(80, Math.min(180, (computed.wheelbase_mm / 6000) * 180));
  const owPx = wbPx + 24;
  const planCenterY = planY0 + owPx / 2;
  const overhangPx = 14;

  // End View (top-right)
  const endCx = 1120;
  const endRailY = 200;

  const techRows: Array<{ label: string; value: string; est?: boolean }> = [
    { label: 'CAPACITY (LOAD)', value: `${input.capacity_t} t` },
    { label: 'SPAN', value: `${computed.span_mm} mm` },
    { label: 'LIFTING HEIGHT', value: `${computed.lifting_height_mm} mm` },
    { label: 'FLOOR TO RAIL', value: `${computed.floor_to_rail_height_mm} mm` },
    { label: 'DUTY CLASS', value: input.duty_class },
    { label: 'HOIST SPEED', value: `${input.hoist_speed_m_min} m/min` },
    { label: 'TRAVERSE SPEED', value: `${input.traverse_speed_m_min} m/min` },
    { label: 'TRAVEL SPEED', value: `${input.travel_speed_m_min} m/min` },
    { label: 'POWER SUPPLY', value: input.supply },
    { label: 'SUPPLY POWER', value: `${computed.supply_power_kW} kW`, est: isEstimate(computed, 'supply_power_kW') },
    { label: 'OVERALL LENGTH', value: `${computed.overall_length_mm} mm` },
    { label: 'WHEELBASE', value: `${computed.wheelbase_mm} mm`, est: isEstimate(computed, 'wheelbase_mm') },
    { label: 'OVERALL WIDTH', value: `${computed.overall_width_mm} mm`, est: isEstimate(computed, 'overall_width_mm') },
    { label: 'GIRDER HEIGHT', value: `${computed.girder_height_mm} mm`, est: isEstimate(computed, 'girder_height_mm') },
    { label: 'HOOK HEADROOM', value: `${computed.hook_headroom_mm} mm`, est: isEstimate(computed, 'hook_headroom_mm') },
    { label: 'WHEEL DIAMETER', value: `${computed.wheel_diameter_mm} mm` },
    { label: 'TROLLEY WEIGHT', value: `${computed.trolley_weight_t} t`, est: isEstimate(computed, 'trolley_weight_t') },
    { label: 'CRANE WEIGHT', value: `${computed.crane_weight_t} t`, est: isEstimate(computed, 'crane_weight_t') },
    { label: 'MAX STATIC WHEEL LOAD', value: `${computed.max_static_wheel_load_kN} kN` },
  ];

  const tableStartY = 340;
  const rowH = 21;
  const techRowsSvg = techRows
    .map((r, i) => {
      const y = tableStartY + 26 + i * rowH;
      const estTag = r.est ? `<text x="1365" y="${y}" text-anchor="end" font-family="monospace" font-size="9" fill="#b45309">est.</text>` : '';
      return `
        <line x1="920" y1="${y + 5}" x2="1375" y2="${y + 5}" stroke="#e2e8f0" stroke-width="0.8" />
        <text x="928" y="${y}" font-family="monospace" font-size="10.5" fill="#334155">${escapeXml(r.label)}</text>
        <text x="1335" y="${y}" text-anchor="end" font-family="monospace" font-size="10.5" font-weight="bold" fill="#0f172a">${escapeXml(r.value)}</text>
        ${estTag}
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="980" viewBox="0 0 1400 980">
  <defs>
    <marker id="arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 10 1 L 0 5 L 10 9 z" fill="#0f172a" />
    </marker>
    <marker id="arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
    </marker>
  </defs>

  <!-- Sheet Background & Outer Border -->
  <rect width="1400" height="980" fill="#ffffff" />
  <rect x="16" y="16" width="1368" height="948" fill="none" stroke="#0f172a" stroke-width="2" />
  <line x1="900" y1="16" x2="900" y2="964" stroke="#0f172a" stroke-width="1.5" />

  <!-- VIEW 1: FRONT ELEVATION -->
  <text x="36" y="44" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">1. FRONT ELEVATION</text>

  <!-- Runway columns & rails -->
  <rect x="${elevX0 - 14}" y="${railY}" width="28" height="${floorY - railY}" fill="#f1f5f9" stroke="#475569" stroke-width="1.2" />
  <rect x="${elevX1 - 14}" y="${railY}" width="28" height="${floorY - railY}" fill="#f1f5f9" stroke="#475569" stroke-width="1.2" />
  <line x1="${elevX0 - 40}" y1="${floorY}" x2="${elevX1 + 40}" y2="${floorY}" stroke="#0f172a" stroke-width="2" />
  <text x="${elevX0 + 24}" y="${floorY - 6}" font-family="monospace" font-size="10" fill="#475569">FLOOR ±0</text>

  <!-- End carriages & bridge girder -->
  <rect x="${elevX0 - 18}" y="${railY - 18}" width="36" height="18" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.2" />
  <rect x="${elevX1 - 18}" y="${railY - 18}" width="36" height="18" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.2" />
  <rect x="${elevX0 - 12}" y="${girderTopY}" width="${elevSpanPx + 24}" height="${girderH}" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" />
  <text x="${(elevX0 + elevX1) / 2}" y="${girderTopY + girderH / 2 + 4}" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a">${input.capacity_t}t</text>

  <!-- Trolley & Hook -->
  <rect x="${trolleyX - 24}" y="${girderTopY + girderH}" width="48" height="22" fill="#94a3b8" stroke="#0f172a" stroke-width="1.2" />
  <line x1="${trolleyX}" y1="${girderTopY + girderH + 22}" x2="${trolleyX}" y2="${hookY}" stroke="#0f172a" stroke-width="1.5" />
  <path d="M ${trolleyX - 6} ${hookY} A 6 6 0 1 0 ${trolleyX + 6} ${hookY + 6}" fill="none" stroke="#0f172a" stroke-width="2" />

  <!-- Front Elevation Dimensions (offset rows to avoid overlap) -->
  ${dimH(elevX0, elevX1, 78, `SPAN: ${computed.span_mm} mm`, railY, railY)}
  ${dimH(elevX0, elevX0 + leftAppPx, 104, `MIN APP L: ${input.hook_approach_left_mm} mm`)}
  ${dimH(elevX1 - rightAppPx, elevX1, 104, `MIN APP R: ${input.hook_approach_right_mm} mm`)}
  ${dimV(84, railY, floorY, `FLOOR TO RAIL: ${computed.floor_to_rail_height_mm} mm`, elevX0, elevX0)}
  ${dimV(trolleyX - 42, railY, hookY, `HEADROOM: ${computed.hook_headroom_mm} mm`, trolleyX, trolleyX)}
  ${dimV(trolleyX + 42, hookY, hookY + liftPx, `LIFTING HEIGHT: ${computed.lifting_height_mm} mm`, trolleyX, trolleyX)}

  <!-- VIEW 2: PLAN VIEW (TOP) -->
  <text x="36" y="495" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">2. PLAN VIEW (TOP)</text>
  <!-- Runway rails -->
  <line x1="${elevX0}" y1="${planY0 - 25}" x2="${elevX0}" y2="${planY0 + owPx + 25}" stroke="#475569" stroke-width="2" stroke-dasharray="6,4" />
  <line x1="${elevX1}" y1="${planY0 - 25}" x2="${elevX1}" y2="${planY0 + owPx + 25}" stroke="#475569" stroke-width="2" stroke-dasharray="6,4" />
  <!-- End carriages -->
  <rect x="${elevX0 - overhangPx}" y="${planY0}" width="28" height="${owPx}" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.5" />
  <rect x="${elevX1 - 28 + overhangPx}" y="${planY0}" width="28" height="${owPx}" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.5" />
  <!-- Bridge girder -->
  <rect x="${elevX0}" y="${planCenterY - 14}" width="${elevSpanPx}" height="28" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5" />

  <!-- Plan View Dimensions -->
  ${dimH(elevX0 - overhangPx, elevX1 + overhangPx, planY0 + owPx + 45, `OVERALL LENGTH: ${computed.overall_length_mm} mm`, planY0 + owPx, planY0 + owPx)}
  ${dimV(110, planY0 + 12, planY0 + owPx - 12, `WHEELBASE: ${computed.wheelbase_mm} mm`, elevX0 - overhangPx, elevX0 - overhangPx)}
  ${dimV(72, planY0, planY0 + owPx, `OVERALL WIDTH: ${computed.overall_width_mm} mm`, elevX0 - overhangPx, elevX0 - overhangPx)}

  <!-- VIEW 3: END VIEW -->
  <text x="920" y="44" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">3. END VIEW</text>
  <!-- Runway rail -->
  <rect x="${endCx - 16}" y="${endRailY}" width="32" height="14" fill="#64748b" stroke="#0f172a" stroke-width="1.2" />
  <!-- Wheel & End carriage -->
  <circle cx="${endCx}" cy="${endRailY - 14}" r="14" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.5" />
  <rect x="${endCx - 45}" y="${endRailY - 46}" width="90" height="22" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.2" />
  <!-- Girder cross section -->
  <rect x="${endCx - 22}" y="${endRailY - 90}" width="44" height="44" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.5" />
  <!-- Trolley & hook -->
  <rect x="${endCx - 16}" y="${endRailY - 46}" width="32" height="18" fill="#94a3b8" stroke="#0f172a" stroke-width="1.2" />
  <line x1="${endCx}" y1="${endRailY - 28}" x2="${endCx}" y2="${endRailY + 38}" stroke="#0f172a" stroke-width="1.5" />
  <path d="M ${endCx - 6} ${endRailY + 38} A 6 6 0 1 0 ${endCx + 6} ${endRailY + 44}" fill="none" stroke="#0f172a" stroke-width="2" />
  <text x="${endCx + 24}" y="${endRailY - 10}" font-family="monospace" font-size="11" fill="#0f172a">WHEEL DIA: ø${computed.wheel_diameter_mm} mm</text>

  <!-- TECHNICAL DATA TABLE -->
  <rect x="916" y="316" width="462" height="${34 + techRows.length * rowH}" fill="#f8fafc" stroke="#0f172a" stroke-width="1.2" />
  <text x="928" y="336" font-family="monospace" font-size="13" font-weight="bold" fill="#0f172a">TECHNICAL DATA (SI / METRIC)</text>
  <line x1="916" y1="344" x2="1378" y2="344" stroke="#0f172a" stroke-width="1" />
  ${techRowsSvg}

  <!-- TITLE BLOCK -->
  <rect x="916" y="810" width="462" height="142" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
  <line x1="916" y1="854" x2="1378" y2="854" stroke="#0f172a" stroke-width="1" />
  <line x1="916" y1="902" x2="1378" y2="902" stroke="#0f172a" stroke-width="1" />
  <text x="928" y="838" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">${escapeXml(input.name)}</text>
  <text x="928" y="882" font-family="monospace" font-size="11" fill="#334155">SINGLE GIRDER EOT CRANE — ${input.capacity_t}t / ${input.span_m}m (${input.duty_class})</text>
  <text x="928" y="924" font-family="monospace" font-size="11" font-weight="bold" fill="#b91c1c">NOT TO SCALE / PRELIMINARY</text>
  <text x="928" y="942" font-family="monospace" font-size="10" fill="#475569">ALL DIMENSIONS IN mm | DATE: ${today}</text>
</svg>`;
}
