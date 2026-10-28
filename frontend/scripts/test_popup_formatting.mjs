import assert from 'node:assert';
import {
  getGreenSpacePopupViewModel,
  buildGreenSpacePopupHtml,
  getCorridorPopupViewModel,
  buildCorridorPopupHtml
} from '../src/utils/popupFormatter.ts';

console.log('--- Testing Green Space Popup Formatter ---');

// 1. Central Ridge with precomputed reference metadata
const centralRidgeProps = {
  id: 'patch_001',
  name: 'Central Ridge Reserve Forest',
  osm_type: 'forest',
  area_hectares: 580.67,
  perimeter_meters: 10714.8,
  reference_id: 'PATCH_001',
  reference_metadata: {
    name: 'Central Ridge Reserve Forest',
    area_ha: 673.32,
    area_acres: 1664,
    area_km2: 6.73,
    perimeter_km: { min: 14.5, max: 16.0 },
    source_label: 'user_supplied_reference',
    verification_status: 'approximate_unverified'
  },
  gis_measurements: {
    stored_area_hectares: 580.67,
    stored_perimeter_meters: 10714.8,
    derived_area_hectares: 580.6673,
    derived_perimeter_meters: 10714.78
  }
};

const vm1 = getGreenSpacePopupViewModel(centralRidgeProps);
assert.strictEqual(vm1.displayName, 'Central Ridge Reserve Forest');
assert.strictEqual(vm1.refId, 'PATCH_001');
assert.strictEqual(vm1.refAreaHa, 673.32);
assert.strictEqual(vm1.refAreaAcres, 1664);
assert.strictEqual(vm1.refAreaKm2, 6.73);
assert.strictEqual(vm1.refPerimeterRange, '14.5–16 km');
assert.strictEqual(vm1.gisAreaHa, 580.67);
assert.strictEqual(vm1.gisPerimeterKm, '10.715 km');
assert.strictEqual(vm1.hasReference, true);

const html1 = buildGreenSpacePopupHtml(centralRidgeProps);
assert(html1.includes('673.32 ha'), 'HTML must contain reference area 673.32 ha');
assert(html1.includes('1,664 acres'), 'HTML must contain 1,664 acres');
assert(html1.includes('6.73 km²'), 'HTML must contain 6.73 km²');
assert(html1.includes('14.5–16 km'), 'HTML must contain perimeter range 14.5-16 km');
assert(html1.includes('580.67 ha'), 'HTML must contain GIS-measured area 580.67 ha');
assert(html1.includes('10.715 km'), 'HTML must contain GIS-measured perimeter 10.715 km');
assert(html1.includes('User-supplied reference'), 'HTML must contain source label');
assert(html1.includes('Approximate — not independently verified'), 'HTML must contain status');

console.log('✓ Central Ridge patch_001 correctly formats 673.32 ha and 14.5–16.0 km');

// 2. Missing Reference Metadata Handling
const unreferencedProps = {
  id: 'patch_unknown',
  name: 'Unknown Park',
  osm_type: 'park',
  area_hectares: 12.34,
  perimeter_meters: 1234.5
};

const vm2 = getGreenSpacePopupViewModel(unreferencedProps);
assert.strictEqual(vm2.hasReference, false);
const html2 = buildGreenSpacePopupHtml(unreferencedProps);
assert(html2.includes('Reference data: Not available for this feature'), 'Must explicitly indicate unavailable reference data');
assert(!html2.includes('Reference area: 12.34 ha'), 'Must NOT label GIS value as reference area');
assert(html2.includes('GIS-measured area:'), 'Must show GIS measurements separately');

console.log('✓ Missing reference data handled explicitly without silent fallback');

// 3. Corridor CAND_001
const cand001Props = {
  candidate_id: 'cand_001',
  name: 'Sanjay Van — Hauz Khas Forest Corridor',
  source_name: 'Central Ridge',
  target_name: 'Nehru Park',
  length_km: 3.66,
  reference_id: 'CAND_001',
  reference_metadata: {
    name: 'Sanjay Van — Hauz Khas Forest Corridor',
    primary_connecting_roads: ['Sri Aurobindo Marg', 'Press Enclave Marg'],
    route_length_km: { driving: 8.6, direct: 4.5 },
    road_width_m: { 'Sri Aurobindo Marg': '30-45' },
    source_label: 'user_supplied_reference',
    verification_status: 'approximate_unverified'
  },
  gis_measurements: {
    stored_length_km: 3.66,
    derived_length_km: 3.663
  }
};

const cVm = getCorridorPopupViewModel(cand001Props);
assert.strictEqual(cVm.refRouteLengthDriving, 8.6);
assert.strictEqual(cVm.refRouteLengthDirect, 4.5);
assert.strictEqual(cVm.gisLengthKm, 3.66);

const cHtml = buildCorridorPopupHtml(cand001Props);
assert(cHtml.includes('8.6 km'), 'Corridor HTML must contain driving route 8.6 km');
assert(cHtml.includes('4.5 km'), 'Corridor HTML must contain direct distance 4.5 km');
assert(cHtml.includes('3.66 km'), 'Corridor HTML must contain GIS shortest-path 3.66 km');
assert(cHtml.includes('Sri Aurobindo Marg'), 'Corridor HTML must contain primary connecting roads');

console.log('✓ Corridor cand_001 correctly preserves reference driving length vs GIS distance');
console.log('ALL POPUP FORMATTING TESTS PASSED!');
