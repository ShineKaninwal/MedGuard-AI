// General safe-disposal information. It is guidance, not a legal or medical instruction.
// It follows common public guidance (take-back first, no flushing or pouring away, secure storage until disposal) and always defers to
// the local pharmacy and the local or national authority, because rules and collection options differ by place and by medicine.
// Review this content with a pharmacist or the relevant authority before real use.

export const DISPOSAL_TYPES = [
  { id: 'solid', label: 'Tablets and capsules', forms: ['Tablet', 'Capsule'],
    points: ['Take them to a pharmacy or collection point that accepts unused medicines. Keep them in the original strip or bottle, so the label shows what they are.',
      'Do not flush them or wash them down a sink.'] },
  { id: 'liquid', label: 'Syrups and liquids', forms: ['Syrup'],
    points: ['Keep the cap on tightly and hand the bottle to a pharmacy or collection point that accepts liquid medicines.',
      'Do not pour liquid medicine down a sink, drain or toilet, or onto the ground.'] },
  { id: 'topical', label: 'Creams, gels and ointments', forms: ['Gel'],
    points: ['Leave the product in its tube or tub and ask the pharmacy or local authority how to dispose of it.', 'Do not wash it down a drain.'] },
  { id: 'inhaler', label: 'Inhalers and aerosols', forms: ['Inhaler'],
    points: ['Pressurised canisters must not be punctured or burned, even when they seem empty. Ask your pharmacy or local waste authority about inhaler collection or recycling.',
      'Keep the canister in its case away from heat until you can hand it over.'] },
  { id: 'drops', label: 'Eye, ear and nose drops', forms: ['Drops'],
    points: ['Keep the cap on, and hand the bottle to a pharmacy or collection point.', 'Do not pour the drops away.'] },
  { id: 'sharps', label: 'Injections, needles and pens', forms: ['Injection'],
    points: ['Never throw loose needles or syringes into household waste, where they can injure others.',
      'Ask your pharmacy, clinic or local health authority how to dispose of sharps. They can usually tell you about a puncture-resistant sharps container and where to return it.'] },
  { id: 'other', label: 'Other or unsure', forms: ['Other'],
    points: ['Read the leaflet or label for disposal instructions, and ask your pharmacist. Some products have their own instructions.'] },
];
export const typeFor = (form) => DISPOSAL_TYPES.find((t) => t.forms.includes(form)) || DISPOSAL_TYPES[DISPOSAL_TYPES.length - 1];

export const NEVER = [
  'Flush medicines down the toilet or drain, unless the label, the leaflet or your local authority specifically says that medicine should be flushed.',
  'Pour liquid medicines down a sink or drain, or into soil or water.',
  'Burn medicines, their packaging or aerosol canisters at home, or bury them.',
  'Puncture or crush inhalers and other pressurised canisters.',
  'Throw loose needles, syringes or blades into household waste.',
  'Give, sell or donate expired or opened medicines to other people.',
  'Take a medicine after its expiry date "just in case". Ask a pharmacist if you are unsure.',
  'Leave medicines waiting for disposal where children, pets or visitors can reach them.',
];

// Only for when no take-back option exists AND the pharmacist or local authority says household waste is acceptable.
export const TRASH_STEPS = [
  'Keep tablets and capsules whole. Do not crush them.',
  'Mix the medicine with something unappealing and non-toxic, such as used tea or coffee grounds, dirt or cat litter.',
  'Seal the mixture in a bag or container so nothing can leak.',
  'Place it in your household waste, as your local rules describe.',
  'Scratch out or remove your name and other personal details on empty containers and labels before you throw them away.',
];

export const SOURCES = [
  { label: 'US FDA: Disposal of unused medicines', url: 'https://www.fda.gov/drugs/safe-disposal-medicines/disposal-unused-medicines-what-you-should-know', note: 'General principles' },
  { label: 'US EPA: What to do with unwanted household medicines', url: 'https://www.epa.gov/household-medication-disposal/what-do-unwanted-household-medicines', note: 'General principles' },
  { label: 'CDSCO (India): official drug regulator site', url: 'https://cdsco.gov.in', note: 'Search for its guidance on disposal of expired and unused drugs' },
];
