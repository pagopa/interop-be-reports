export const orgsMacroCategories = [
  {
    id: '1',
    name: 'Altre Pubbliche Amministrazioni locali',
    codes: [
      'L37',
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
      'C1',
      'L31',
      'C17',
      'C16',
    ],
  },
  {
    id: '2',
    name: 'Aziende Ospedaliere',
    codes: ['L8'],
  },
  {
    id: '3',
    name: 'Aziende Sanitarie Locali',
    codes: ['L22', 'L7', 'C2'],
  },
  {
    id: '4',
    name: 'Comuni',
    codes: ['L18', 'L6'],
  },
  {
    id: '5',
    name: 'Città Metropolitane',
    codes: ['L45'],
  },
  {
    id: '6',
    name: 'Province',
    codes: ['L5'],
  },
  {
    id: '7',
    name: 'Pubbliche Amministrazioni Centrali',
    codes: ['C10', 'C13', 'C5', 'C7', 'C3', 'C14', 'C11'],
  },
  {
    id: '8',
    name: 'Regioni',
    codes: ['L4'],
  },
  {
    id: '9',
    name: 'Scuole',
    codes: ['L33'],
  },
  {
    id: '10',
    name: 'Università e AFAM',
    codes: ['L17', 'L15', 'L43'],
  },
  {
    id: '11',
    name: 'Istituti di Ricerca',
    codes: ['C8', 'C12', 'L28'],
  },
  {
    id: '12',
    name: 'Stazioni Appaltanti',
    codes: ['SAG', 'S01', 'SA'],
  },
] as const

export type MacroCategory = (typeof orgsMacroCategories)[number]
export type MacroCategoryName = MacroCategory['name']
