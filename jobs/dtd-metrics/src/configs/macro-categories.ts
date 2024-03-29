export const MACRO_CATEGORIES = [
  {
    id: '1',
    name: 'Altre Pubbliche Amministrazioni locali',
    ipaCodes: [
      'C13',
      'C7',
      'C3',
      'C14',
      'L10',
      'L19',
      'L13',
      'L2',
      'L20',
      'L21',
      'L1',
      'L40',
      'L11',
      'L39',
      'L46',
      'L34',
      'L35',
      'L47',
      'L12',
      'L24',
      'L42',
      'L36',
      'L44',
      'L16',
      'L38',
      'L31',
    ],
    totalTenantsCount: 4201,
  },
  {
    id: '2',
    name: 'Aziende Ospedaliere e ASL',
    ipaCodes: ['L8', 'L22', 'L7'],
    totalTenantsCount: 245,
  },
  {
    id: '3',
    name: 'Comuni',
    ipaCodes: ['L18', 'L6'],
    totalTenantsCount: 8546,
  },
  {
    id: '4',
    name: 'Province e Città Metropolitane',
    ipaCodes: ['L5', 'L45'],
    totalTenantsCount: 102,
  },
  {
    id: '5',
    name: 'Pubbliche Amministrazioni Centrali',
    ipaCodes: ['C10', 'C5', 'C11', 'C1', 'C2'],
    totalTenantsCount: 47,
  },
  {
    id: '6',
    name: 'Enti Nazionali di Previdenza ed Assistenza Sociale',
    ipaCodes: ['C16', 'C17'],
    totalTenantsCount: 22,
  },
  {
    id: '7',
    name: 'Regioni e Province autonome',
    ipaCodes: ['L4'],
    totalTenantsCount: 21, // 19 Regioni + 2 Province autonome (TN + BZ)
  },
  {
    id: '8',
    name: 'Consorzi e associazioni regionali',
    ipaCodes: ['L4'],
    // Categoria IPA L4 meno i 21 enti in macrocategoria 7
    // meno la Regione Trentino/Sudtirol che di fatto non esiste
    totalTenantsCount: 53 - 21 - 1,
  },
  {
    id: '9',
    name: 'Scuole',
    ipaCodes: ['L33'],
    totalTenantsCount: 8367,
  },
  {
    id: '10',
    name: 'Università e AFAM',
    ipaCodes: ['L17', 'L15', 'L43'],
    totalTenantsCount: 207,
  },
  {
    id: '11',
    name: 'Istituti di Ricerca',
    ipaCodes: ['C8', 'C12', 'L28'],
    totalTenantsCount: 89,
  },
  {
    id: '12',
    name: 'Stazioni Appaltanti e Gestori di pubblici servizi',
    ipaCodes: ['SAG', 'L37', 'S01', 'SA'],
    totalTenantsCount: 1128,
  },
  {
    id: '13',
    name: 'Privati',
    ipaCodes: [], // Privates don't have an IPA code
    totalTenantsCount: 0, // Privates are potentially infinite
  },
] as const

// Attenzione: la Regione Trentino (r_trenti) non va considerata,
// si considerano le due province autonome Trento e Bolzano
export const REGIONI_E_PROVINCE_AUTONOME: Array<string> = [
  'p_bz',
  'p_TN',
  'r_abruzz',
  'r_basili',
  'r_campan',
  'r_emiro',
  'r_friuve',
  'r_lazio',
  'r_liguri',
  'r_lombar',
  'r_marche',
  'r_molise',
  'r_piemon',
  'r_puglia',
  'r_sardeg',
  'r_sicili',
  'r_toscan',
  'r_umbria',
  'r_vda',
  'r_veneto',
  'regcal',
]
