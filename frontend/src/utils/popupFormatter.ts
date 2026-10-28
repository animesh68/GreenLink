import type {
  GreenSpaceProperties,
  CandidateCorridorProperties,
  GreenSpaceReferenceMetadata,
  CorridorReferenceMetadata
} from '../types'

/**
 * Transforms green-space properties and optional detail API response into
 * a structured view model for source-aware presentation.
 */
export function getGreenSpacePopupViewModel(
  props: GreenSpaceProperties,
  detail?: any
) {
  const ref: GreenSpaceReferenceMetadata | undefined =
    detail?.reference_metadata || props.reference_metadata
  const gis = detail?.gis_measurements || props.gis_measurements
  const refId =
    detail?.reference_id ||
    props.reference_id ||
    (props.id ? props.id.toUpperCase() : '')

  const hasReference = Boolean(ref && (ref.area_ha != null || ref.name))

  const displayName = ref?.name || props.name || 'Green Space'
  const osmType = props.osm_type || 'park'

  const refAreaHa = ref?.area_ha
  const refAreaAcres = ref?.area_acres
  const refAreaKm2 = ref?.area_km2

  let refPerimeterRange: string | null = null
  if (ref?.perimeter_km) {
    if (typeof ref.perimeter_km === 'object' && 'min' in ref.perimeter_km) {
      refPerimeterRange = `${ref.perimeter_km.min}–${ref.perimeter_km.max} km`
    } else {
      refPerimeterRange = `${ref.perimeter_km} km`
    }
  }

  const sourceLabel =
    ref?.source_label === 'user_supplied_reference'
      ? 'User-supplied reference'
      : ref?.source_label || 'User-supplied reference'
  const verificationStatus =
    ref?.verification_status === 'approximate_unverified'
      ? 'Approximate — not independently verified'
      : ref?.verification_status || 'Approximate — unverified'

  const gisAreaHa =
    gis?.stored_area_hectares ??
    gis?.derived_area_hectares ??
    props.area_hectares
  const gisPerimeterM =
    gis?.stored_perimeter_meters ??
    gis?.derived_perimeter_meters ??
    props.perimeter_meters
  const gisPerimeterKm =
    gisPerimeterM != null ? (gisPerimeterM / 1000).toFixed(3) + ' km' : '—'

  return {
    displayName,
    refId,
    osmType,
    hasReference,
    refAreaHa,
    refAreaAcres,
    refAreaKm2,
    refPerimeterRange,
    sourceLabel,
    verificationStatus,
    gisAreaHa,
    gisPerimeterKm
  }
}

/**
 * Builds HTML string for the green space map popup according to
 * source-aware presentation requirements.
 */
export function buildGreenSpacePopupHtml(
  props: GreenSpaceProperties,
  detail?: any
): string {
  const vm = getGreenSpacePopupViewModel(props, detail)

  if (vm.hasReference) {
    const equivArea =
      vm.refAreaAcres && vm.refAreaKm2
        ? `<div style="font-size: 11px; color: #4A5850; margin-top: 2px;">
             Equivalent: <strong>${vm.refAreaAcres.toLocaleString()} acres</strong> · <strong>${vm.refAreaKm2} km²</strong>
           </div>`
        : ''

    return `
      <div style="font-family: inherit; color: #1D2A22; width: 280px; max-width: 300px; line-height: 1.35; box-sizing: border-box;">
        <div style="padding-right: 24px; margin-bottom: 3px;">
          <div style="font-weight: 700; font-size: 13.5px; color: #1E3D2F; line-height: 1.25; word-wrap: break-word;">
            ${vm.displayName}
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
          <div style="font-size: 10px; color: #607065; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
            Green Space Reference
          </div>
          ${vm.refId ? `<span style="font-size: 10px; font-family: monospace; color: #285943; background: #EBF2ED; padding: 2px 6px; border-radius: 4px; font-weight: 700; border: 1px solid #D1DFD6; flex-shrink: 0;">${vm.refId}</span>` : ''}
        </div>

        <div style="background: #F4F7F5; padding: 7px 9px; border-radius: 5px; border: 1px solid #D9E4DD; margin-bottom: 8px;">
          <div style="font-size: 11px; margin-bottom: 3px;">
            <span style="color: #4A5850;">Reference area:</span> <strong style="color: #1E3D2F; font-size: 12px;">${vm.refAreaHa} ha</strong>
          </div>
          ${equivArea}
          ${vm.refPerimeterRange ? `
            <div style="font-size: 11px; margin-top: 3px;">
              <span style="color: #4A5850;">Reference perimeter:</span> <strong style="color: #1E3D2F;">${vm.refPerimeterRange}</strong>
            </div>
          ` : ''}
          <div style="font-size: 9.5px; color: #607065; border-top: 1px solid #E2EBE5; margin-top: 6px; padding-top: 4px;">
            <div>Source: <em>${vm.sourceLabel}</em></div>
            <div>Status: <em>${vm.verificationStatus}</em></div>
          </div>
        </div>

        <div style="background: #FAFAF7; padding: 6px 9px; border-radius: 5px; border: 1px solid #E8E6DC; font-size: 10.5px;">
          <div style="font-size: 9.5px; font-weight: 600; color: #7A8A7F; text-transform: uppercase; margin-bottom: 3px;">
            GIS Measurements (${vm.osmType})
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #607065;">GIS-measured area:</span>
            <strong>${vm.gisAreaHa} ha</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #607065;">GIS-measured perimeter:</span>
            <strong>${vm.gisPerimeterKm}</strong>
          </div>
        </div>

        <div style="font-size: 9px; color: #8A968F; margin-top: 6px; font-style: italic; line-height: 1.25;">
          Note: GIS measurements are based on the current OpenStreetMap polygon and may differ from reference values.
        </div>
      </div>
    `
  }

  // Fallback presentation when user reference data is not available
  return `
    <div style="font-family: inherit; color: #1D2A22; width: 280px; max-width: 300px; line-height: 1.35; box-sizing: border-box;">
      <div style="padding-right: 24px; margin-bottom: 3px;">
        <div style="font-weight: 700; font-size: 13.5px; color: #1E3D2F; line-height: 1.25; word-wrap: break-word;">
          ${vm.displayName}
        </div>
      </div>
      <div style="font-size: 10px; color: #9A7B38; font-weight: 600; margin-bottom: 8px; background: #FDF9EE; border: 1px solid #EFE4BF; border-radius: 4px; padding: 3px 6px;">
        Reference data: Not available for this feature
      </div>

      <div style="background: #FAFAF7; padding: 7px 9px; border-radius: 5px; border: 1px solid #E8E6DC; font-size: 11px;">
        <div style="font-size: 9.5px; font-weight: 600; color: #7A8A7F; text-transform: uppercase; margin-bottom: 3px;">
          GIS Measurements (${vm.osmType})
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #607065;">GIS-measured area:</span>
          <strong>${vm.gisAreaHa} ha</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #607065;">GIS-measured perimeter:</span>
          <strong>${vm.gisPerimeterKm}</strong>
        </div>
      </div>
    </div>
  `
}

/**
 * Transforms candidate corridor properties and optional detail API response
 * into a structured view model for source-aware presentation.
 */
export function getCorridorPopupViewModel(
  props: CandidateCorridorProperties,
  detail?: any
) {
  const ref: CorridorReferenceMetadata | undefined =
    detail?.reference_metadata || props.reference_metadata
  const gis = detail?.gis_measurements || props.gis_measurements
  const refId =
    detail?.reference_id ||
    props.reference_id ||
    (props.candidate_id ? props.candidate_id.toUpperCase() : '')

  const hasReference = Boolean(
    ref && (ref.route_length_km != null || ref.name || ref.primary_connecting_roads)
  )

  const displayName = ref?.name || props.name
  const endpoints = `${props.source_name || 'Anchor A'} ↔ ${props.target_name || 'Anchor B'}`

  let refRouteLengthDriving: number | null = null
  let refRouteLengthDirect: number | null = null
  let refRouteLengthSingle: number | null = null

  if (ref?.route_length_km) {
    if (typeof ref.route_length_km === 'object') {
      refRouteLengthDriving = ref.route_length_km.driving ?? null
      refRouteLengthDirect = ref.route_length_km.direct ?? null
    } else {
      refRouteLengthSingle = ref.route_length_km
    }
  }

  const primaryRoads = ref?.primary_connecting_roads || []
  const roadDescriptions = ref?.road_descriptions || {}
  const roadWidths = ref?.road_width_m || {}

  const sourceLabel =
    ref?.source_label === 'user_supplied_reference'
      ? 'User-supplied reference'
      : ref?.source_label || 'User-supplied reference'
  const verificationStatus =
    ref?.verification_status === 'approximate_unverified'
      ? 'Approximate — not independently verified'
      : ref?.verification_status || 'Approximate — unverified'

  const gisLengthKm =
    gis?.stored_length_km ?? gis?.derived_length_km ?? props.length_km
  const costStr = props.estimated_cost_inr
    ? `₹${(props.estimated_cost_inr / 100000).toFixed(1)} Lakhs`
    : 'Provisional'

  return {
    displayName,
    refId,
    endpoints,
    hasReference,
    refRouteLengthDriving,
    refRouteLengthDirect,
    refRouteLengthSingle,
    primaryRoads,
    roadDescriptions,
    roadWidths,
    sourceLabel,
    verificationStatus,
    gisLengthKm,
    costStr
  }
}

/**
 * Builds HTML string for candidate corridor popup according to
 * source-aware presentation requirements.
 */
export function buildCorridorPopupHtml(
  props: CandidateCorridorProperties,
  options?: {
    detail?: any
    statusBadge?: string
    rationaleSection?: string
  }
): string {
  const vm = getCorridorPopupViewModel(props, options?.detail)
  const statusBadge = options?.statusBadge || ''
  const rationaleSection = options?.rationaleSection || ''

  let refLengthSection = ''
  if (vm.refRouteLengthDriving != null || vm.refRouteLengthDirect != null) {
    refLengthSection = `
      <div style="font-size: 11px; margin-bottom: 2px;">
        <span style="color: #4A5850;">Driving route estimate:</span> <strong>${vm.refRouteLengthDriving} km</strong>
      </div>
      ${vm.refRouteLengthDirect != null ? `
        <div style="font-size: 11px; margin-bottom: 2px;">
          <span style="color: #4A5850;">Direct distance:</span> <strong>${vm.refRouteLengthDirect} km</strong>
        </div>
      ` : ''}
    `
  } else if (vm.refRouteLengthSingle != null) {
    refLengthSection = `
      <div style="font-size: 11px; margin-bottom: 2px;">
        <span style="color: #4A5850;">Reference route length:</span> <strong>${vm.refRouteLengthSingle} km</strong>
      </div>
    `
  }

  let roadsSection = ''
  if (vm.primaryRoads.length > 0) {
    const roadItems = vm.primaryRoads
      .map((r) => {
        const desc = vm.roadDescriptions[r]
        const width = vm.roadWidths[r]
        const extra = desc || (width ? `width ~${width} m` : null)
        return `<div style="font-size: 10px; color: #2F3E35; margin-top: 2px;">• <strong>${r}</strong>${extra ? ` <span style="color: #607065;">(${extra})</span>` : ''}</div>`
      })
      .join('')

    roadsSection = `
      <div style="margin-top: 4px; border-top: 1px solid #E2EBE5; padding-top: 4px;">
        <div style="font-size: 9.5px; font-weight: 600; color: #4A5850; text-transform: uppercase;">Key Corridor Roads:</div>
        ${roadItems}
      </div>
    `
  }

  return `
    <div style="font-family: inherit; color: #1D2A22; width: 280px; max-width: 300px; line-height: 1.35; box-sizing: border-box;">
      ${statusBadge}
      <div style="padding-right: 24px; margin-bottom: 3px;">
        <div style="font-weight: 700; font-size: 13.5px; color: #1E3D2F; line-height: 1.25; word-wrap: break-word;">
          ${vm.displayName}
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
        <div style="font-size: 10.5px; color: #607065; line-height: 1.2;">
          ${vm.endpoints}
        </div>
        ${vm.refId ? `<span style="font-size: 10px; font-family: monospace; color: #285943; background: #EBF2ED; padding: 2px 6px; border-radius: 4px; font-weight: 700; border: 1px solid #D1DFD6; flex-shrink: 0;">${vm.refId}</span>` : ''}
      </div>

      ${vm.hasReference ? `
        <div style="background: #F4F7F5; padding: 7px 9px; border-radius: 5px; border: 1px solid #D9E4DD; margin-bottom: 8px;">
          <div style="font-size: 9.5px; font-weight: 600; color: #285943; text-transform: uppercase; margin-bottom: 3px;">
            Route Reference Metadata
          </div>
          ${refLengthSection}
          ${roadsSection}
          <div style="font-size: 9px; color: #607065; border-top: 1px solid #E2EBE5; margin-top: 5px; padding-top: 3px;">
            <div>Source: <em>${vm.sourceLabel}</em></div>
            <div>Status: <em>${vm.verificationStatus}</em></div>
          </div>
        </div>
      ` : ''}

      <div style="background: #FAFAF7; padding: 6px 9px; border-radius: 5px; border: 1px solid #E8E6DC; font-size: 10.5px; margin-bottom: 6px;">
        <div style="font-size: 9.5px; font-weight: 600; color: #7A8A7F; text-transform: uppercase; margin-bottom: 3px;">
          GIS Network & Cost Model
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #607065;">GIS shortest-path:</span>
          <strong>${vm.gisLengthKm} km</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #607065;">Provisional budget:</span>
          <strong style="color: #C28B39;">${vm.costStr}</strong>
        </div>
      </div>

      ${rationaleSection}

      <button id="popup-inspect-street-btn" style="width: 100%; margin-top: 8px; padding: 6px 10px; background: #285943; color: white; border: none; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
        📷 Inspect Street Imagery
      </button>
    </div>
  `
}
