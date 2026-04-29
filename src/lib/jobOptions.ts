/**
 * Shared catalog of "checkbox" job options that mirror the right-side
 * checklist on a typical paper flooring estimate form.
 *
 * Stored on `quotes.job_options` as a JSON object:
 *   {
 *     install_only: true,
 *     red_oak: true,
 *     stain: true,
 *     width: '5"',
 *     lockbox_key_value: '1234',
 *     ...
 *   }
 *
 * Boolean flags use the option key directly. The two text inputs (`width`
 * and `lockbox_key_value`) store strings.
 */

export interface JobOption {
  key: string
  label: string
}

export interface JobOptionGroup {
  /** Stable identifier for the group */
  id: string
  /** UI-facing title */
  label: string
  /** UI-facing helper sentence shown beneath the title */
  description?: string
  /** When true, only one option in the group can be selected at a time. */
  exclusive?: boolean
  options: JobOption[]
}

export const JOB_OPTION_GROUPS: JobOptionGroup[] = [
  {
    id: 'scope',
    label: 'Job scope',
    description: 'What is being done?',
    options: [
      { key: 'install_only', label: 'Installation only' },
      { key: 'sanding_only', label: 'Sanding only' },
      { key: 'install_and_sand', label: 'Installation & sanding' },
      { key: 'screen_coat', label: 'Screen coat (refinish)' },
      { key: 'repair', label: 'Repair' },
    ],
  },
  {
    id: 'finish',
    label: 'Finish & coatings',
    options: [
      { key: 'sealer', label: 'Sealer' },
      { key: 'stain', label: 'Stain' },
      { key: 'waterbase', label: 'Waterbase' },
      { key: 'oil_poly', label: 'Oil-based Poly' },
    ],
  },
  {
    id: 'sheen',
    label: 'Sheen',
    description: 'Pick one — exclusive choice',
    exclusive: true,
    options: [
      { key: 'high_gloss', label: 'High gloss' },
      { key: 'semi_gloss', label: 'Semi gloss' },
      { key: 'satin', label: 'Satin' },
      { key: 'matte', label: 'Matte' },
    ],
  },
  {
    id: 'sanding_system',
    label: 'Sanding system',
    options: [
      { key: 'dustless', label: 'Dustless / Trio' },
      { key: 'custom_borders', label: 'Custom / Borders' },
    ],
  },
  {
    id: 'install_method',
    label: 'Installation method',
    options: [
      { key: 'nail_down', label: 'Nail down' },
      { key: 'glue_down', label: 'Glue down' },
      { key: 'glue_liquid_nail', label: 'Glue / Liquid Nail' },
      { key: 'floating', label: 'Floating' },
      { key: 'staple', label: 'Staple' },
    ],
  },
  {
    id: 'trim',
    label: 'Trim & edge',
    options: [
      { key: 'quarter_round', label: 'Quarter round / molding' },
      { key: 'reducers_saddles', label: 'Reducers / saddles' },
      { key: 'bull_nose', label: 'Bull nose' },
      { key: 'railings_spindles', label: 'Railings / spindles' },
      { key: 'grills_vents', label: 'Grills / vents' },
    ],
  },
  {
    id: 'removals',
    label: 'Removals',
    options: [
      { key: 'carpet_removal', label: 'Carpet removal' },
      { key: 'existing_floor_removal', label: 'Existing floor removal' },
      { key: 'tile_removal', label: 'Tile removal' },
      { key: 'debris_removal', label: 'Debris haul-away' },
    ],
  },
]

export type JobOptionsRecord = Record<string, boolean | string>

/**
 * Look up the human-friendly label for a key. Returns null if the key isn't
 * one of the known options.
 */
export function jobOptionLabel(key: string): string | null {
  for (const g of JOB_OPTION_GROUPS) {
    const opt = g.options.find(o => o.key === key)
    if (opt) return opt.label
  }
  return null
}

/**
 * Filter a job_options record down to the boolean flags that are TRUE,
 * grouped by their parent group, returning labels rather than raw keys.
 * Useful for compact summary display on quote/PDF.
 */
export function selectedLabelsByGroup(
  options: JobOptionsRecord | null | undefined
): { groupLabel: string; labels: string[] }[] {
  if (!options) return []
  const result: { groupLabel: string; labels: string[] }[] = []
  for (const g of JOB_OPTION_GROUPS) {
    const labels: string[] = []
    for (const opt of g.options) {
      if (options[opt.key] === true) labels.push(opt.label)
    }
    if (labels.length > 0) result.push({ groupLabel: g.label, labels })
  }
  return result
}
