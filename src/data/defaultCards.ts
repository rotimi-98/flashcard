import type { Flashcard } from '../types/index.ts'

/** Stable ISO timestamp for all preloaded cards (bundle date). */
const PRELOADED_CREATED = '2026-04-06T12:00:00.000Z'

/** Deterministic UUID v4-style ids so preloaded cards keep the same id across sessions. */
function makeId(index: number): string {
  const n = index + 1
  return `10000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

/** [yoruba, english, notes?] — topics: greetings, numbers 1–20, days, nouns, verbs, adjectives (§6.1). */
const ROWS: ReadonlyArray<readonly [string, string] | readonly [string, string, string]> = [
  // Greetings & farewells
  ['Káàárọ̀', 'Good morning'],
  ['Ọ̀sán àárẹ', 'Good afternoon'],
  ['Ọ̀lẹ́', 'Evening greeting'],
  ["Od'abo", 'Goodbye'],
  ['Ẹ kú àárọ̀', 'Good morning (response, plural)'],
  ['Ẹ kú ìrọ̀lẹ́', 'Good evening'],
  ['Ẹ kú alẹ́', 'Good night'],
  ['Bí ó ṣe ṣe?', 'How are you?'],
  ['Dáadáa', 'Fine; well'],
  ['Ẹ ṣé', 'Thank you'],
  ['Káàbọ̀', 'Welcome'],
  ['Ó dàbọ̀', 'Goodbye (reply)'],
  ['Ṣé àláfíà ni?', 'Is everything peaceful?'],
  ['Àláfíà ni', 'It is peaceful'],
  ['Ka sọ̀rọ̀', "Let's talk"],

  // Numbers 1–20
  ['ọ̀kan', 'one'],
  ['méjì', 'two'],
  ['mẹ́ta', 'three'],
  ['mẹ́rin', 'four'],
  ['márùn-ún', 'five'],
  ['mẹ́fà', 'six'],
  ['mẹ́je', 'seven'],
  ['mẹ́jọ', 'eight'],
  ['mẹ́sàn-án', 'nine'],
  ['mẹ́wàá', 'ten'],
  ['mókànlá', 'eleven'],
  ['méjìlá', 'twelve'],
  ['mẹ́tàlá', 'thirteen'],
  ['mẹ́rinlá', 'fourteen'],
  ['mẹ́dógún', 'fifteen'],
  ['mẹ́rìndínlógún', 'sixteen'],
  ['mẹ́tàdínlógún', 'seventeen'],
  ['méjìdínlógún', 'eighteen'],
  ['mókàndínlógún', 'nineteen'],
  ['ogún', 'twenty'],

  // Days of the week
  ['Ọjọ́ Àìkú', 'Sunday'],
  ['Ọjọ́ Ajé', 'Monday'],
  ['Ọjọ́ Ìṣẹ́gun', 'Tuesday'],
  ['Ọjọ́ Ọjọ́rú', 'Wednesday'],
  ['Ọjọ́ Bọ̀', 'Thursday'],
  ['Ọjọ́ Ẹtì', 'Friday'],
  ['Ọjọ́ Àbámẹ́ta', 'Saturday'],

  // Common nouns — people, food, animals, body
  ['ọmọ', 'child'],
  ['obìnrin', 'woman'],
  ['ọkùnrin', 'man'],
  ['ilé', 'house'],
  ['ojú', 'eye'],
  ['etí', 'ear'],
  ['ahọ́n', 'tongue'],
  ['ọwọ́', 'hand'],
  ['ẹsẹ̀', 'leg; foot'],
  ['orí', 'head'],
  ['omi', 'water'],
  ['oúnjẹ', 'food'],
  ['yìnyín', 'milk'],
  ['ẹ̀pà', 'bean; groundnut'],
  ['àgbàdo', 'maize; corn'],
  ['àkàrà', 'bean cake'],
  ['ẹja', 'fish'],
  ['ẹdẹ', 'chicken'],
  ['ẹlẹ́dẹ̀', 'pig'],
  ['ẹṣin', 'horse'],
  ['ajá', 'dog'],
  ['ọ̀bọ', 'monkey'],
  ['ẹyẹ', 'bird'],
  ['igi', 'tree'],
  ['òpó', 'stick'],

  // Common verbs
  ['lọ', 'to go'],
  ['wá', 'to come'],
  ['jẹun', 'to eat'],
  ['mu', 'to drink'],
  ['sọ̀rọ̀', 'to speak'],
  ['kọ́', 'to learn; to teach'],
  ['kọ̀wé', 'to read; to write'],
  ['rí', 'to see'],
  ['gbọ́', 'to hear'],
  ['fẹ́', 'to want; to love'],
  ['ṣe', 'to do; to make'],
  ['sùn', 'to sleep'],
  ['jí', 'to wake up'],
  ['dúró', 'to stand; to wait'],
  ['jókòó', 'to sit'],
  ['fi ọwọ́ sí', 'to touch'],
  ['rin', 'to walk'],
  ['yọ', 'to take out'],
  ['fi sí', 'to put in'],

  // Common adjectives
  ['ńlá', 'big'],
  ['kéré', 'small'],
  ['dára', 'good'],
  ['burú', 'bad'],
  ['tuntun', 'new'],
  ['atijọ', 'old (thing)'],
  ['fún', 'complete; full'],
  ['tó', 'enough'],
  ['gíga', 'tall; high'],
  ['kúrú', 'short'],
  ['fúnfun', 'white'],
  ['dúdú', 'black'],
  ['pọ̀', 'many'],
  ['díẹ̀', 'few'],
  ['dára dára', 'very good'],
  ['láìsí àláfíà', 'unwell'],
  ['tútù', 'cold'],
  ['gbóná', 'hot'],
  ['láìle', 'difficult'],
  ['rọrọ', 'easy'],
]

export const defaultCards: Flashcard[] = ROWS.map(
  ([yoruba, english, notes], i) => ({
    id: makeId(i),
    yoruba,
    english,
    ...(notes !== undefined ? { notes } : {}),
    isPreloaded: true,
    createdAt: PRELOADED_CREATED,
  }),
)
