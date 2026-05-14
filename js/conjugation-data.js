const CONJUGATION_DATA = [
  // ── Irregular in yo only ──────────────────────────────────────────────
  {
    infinitive: 'conocer', english: 'to know (a person or place)',
    forms: { 'yo': 'conozco', 'tú': 'conoces', 'él/ella/Ud.': 'conoce', 'nosotros(as)': 'conocemos', 'ellos(as)/Uds.': 'conocen' }
  },
  {
    infinitive: 'dar', english: 'to give',
    forms: { 'yo': 'doy', 'tú': 'das', 'él/ella/Ud.': 'da', 'nosotros(as)': 'damos', 'ellos(as)/Uds.': 'dan' }
  },
  {
    infinitive: 'hacer', english: 'to do / to make',
    forms: { 'yo': 'hago', 'tú': 'haces', 'él/ella/Ud.': 'hace', 'nosotros(as)': 'hacemos', 'ellos(as)/Uds.': 'hacen' }
  },
  {
    infinitive: 'poner', english: 'to put / to place',
    forms: { 'yo': 'pongo', 'tú': 'pones', 'él/ella/Ud.': 'pone', 'nosotros(as)': 'ponemos', 'ellos(as)/Uds.': 'ponen' }
  },
  {
    infinitive: 'saber', english: 'to know (information)',
    forms: { 'yo': 'sé', 'tú': 'sabes', 'él/ella/Ud.': 'sabe', 'nosotros(as)': 'sabemos', 'ellos(as)/Uds.': 'saben' }
  },
  {
    infinitive: 'salir', english: 'to leave / to go out',
    forms: { 'yo': 'salgo', 'tú': 'sales', 'él/ella/Ud.': 'sale', 'nosotros(as)': 'salimos', 'ellos(as)/Uds.': 'salen' }
  },
  {
    infinitive: 'traer', english: 'to bring',
    forms: { 'yo': 'traigo', 'tú': 'traes', 'él/ella/Ud.': 'trae', 'nosotros(as)': 'traemos', 'ellos(as)/Uds.': 'traen' }
  },
  {
    infinitive: 'ver', english: 'to see / to watch',
    forms: { 'yo': 'veo', 'tú': 'ves', 'él/ella/Ud.': 've', 'nosotros(as)': 'vemos', 'ellos(as)/Uds.': 'ven' }
  },
  // ── Highly irregular ─────────────────────────────────────────────────
  {
    infinitive: 'ir', english: 'to go',
    forms: { 'yo': 'voy', 'tú': 'vas', 'él/ella/Ud.': 'va', 'nosotros(as)': 'vamos', 'ellos(as)/Uds.': 'van' }
  },
  {
    infinitive: 'tener', english: 'to have',
    forms: { 'yo': 'tengo', 'tú': 'tienes', 'él/ella/Ud.': 'tiene', 'nosotros(as)': 'tenemos', 'ellos(as)/Uds.': 'tienen' }
  },
  {
    infinitive: 'decir', english: 'to say / to tell',
    forms: { 'yo': 'digo', 'tú': 'dices', 'él/ella/Ud.': 'dice', 'nosotros(as)': 'decimos', 'ellos(as)/Uds.': 'dicen' }
  },
  {
    infinitive: 'venir', english: 'to come',
    forms: { 'yo': 'vengo', 'tú': 'vienes', 'él/ella/Ud.': 'viene', 'nosotros(as)': 'venimos', 'ellos(as)/Uds.': 'vienen' }
  },
  // ── e → ie stem change ───────────────────────────────────────────────
  {
    infinitive: 'preferir', english: 'to prefer',
    forms: { 'yo': 'prefiero', 'tú': 'prefieres', 'él/ella/Ud.': 'prefiere', 'nosotros(as)': 'preferimos', 'ellos(as)/Uds.': 'prefieren' }
  },
  {
    infinitive: 'querer', english: 'to want / to love',
    forms: { 'yo': 'quiero', 'tú': 'quieres', 'él/ella/Ud.': 'quiere', 'nosotros(as)': 'queremos', 'ellos(as)/Uds.': 'quieren' }
  },
  {
    infinitive: 'cerrar', english: 'to close',
    forms: { 'yo': 'cierro', 'tú': 'cierras', 'él/ella/Ud.': 'cierra', 'nosotros(as)': 'cerramos', 'ellos(as)/Uds.': 'cierran' }
  },
  {
    infinitive: 'pensar', english: 'to think',
    forms: { 'yo': 'pienso', 'tú': 'piensas', 'él/ella/Ud.': 'piensa', 'nosotros(as)': 'pensamos', 'ellos(as)/Uds.': 'piensan' }
  },
  {
    infinitive: 'comenzar', english: 'to begin',
    forms: { 'yo': 'comienzo', 'tú': 'comienzas', 'él/ella/Ud.': 'comienza', 'nosotros(as)': 'comenzamos', 'ellos(as)/Uds.': 'comienzan' }
  },
  {
    infinitive: 'empezar', english: 'to begin',
    forms: { 'yo': 'empiezo', 'tú': 'empiezas', 'él/ella/Ud.': 'empieza', 'nosotros(as)': 'empezamos', 'ellos(as)/Uds.': 'empiezan' }
  },
  {
    infinitive: 'entender', english: 'to understand',
    forms: { 'yo': 'entiendo', 'tú': 'entiendes', 'él/ella/Ud.': 'entiende', 'nosotros(as)': 'entendemos', 'ellos(as)/Uds.': 'entienden' }
  },
  {
    infinitive: 'perder', english: 'to lose',
    forms: { 'yo': 'pierdo', 'tú': 'pierdes', 'él/ella/Ud.': 'pierde', 'nosotros(as)': 'perdemos', 'ellos(as)/Uds.': 'pierden' }
  },
  // ── o / u → ue stem change ───────────────────────────────────────────
  {
    infinitive: 'recordar', english: 'to remember',
    forms: { 'yo': 'recuerdo', 'tú': 'recuerdas', 'él/ella/Ud.': 'recuerda', 'nosotros(as)': 'recordamos', 'ellos(as)/Uds.': 'recuerdan' }
  },
  {
    infinitive: 'jugar', english: 'to play',
    forms: { 'yo': 'juego', 'tú': 'juegas', 'él/ella/Ud.': 'juega', 'nosotros(as)': 'jugamos', 'ellos(as)/Uds.': 'juegan' }
  },
  {
    infinitive: 'devolver', english: 'to return (something)',
    forms: { 'yo': 'devuelvo', 'tú': 'devuelves', 'él/ella/Ud.': 'devuelve', 'nosotros(as)': 'devolvemos', 'ellos(as)/Uds.': 'devuelven' }
  },
  {
    infinitive: 'dormir', english: 'to sleep',
    forms: { 'yo': 'duermo', 'tú': 'duermes', 'él/ella/Ud.': 'duerme', 'nosotros(as)': 'dormimos', 'ellos(as)/Uds.': 'duermen' }
  },
  {
    infinitive: 'volver', english: 'to return',
    forms: { 'yo': 'vuelvo', 'tú': 'vuelves', 'él/ella/Ud.': 'vuelve', 'nosotros(as)': 'volvemos', 'ellos(as)/Uds.': 'vuelven' }
  },
  {
    infinitive: 'poder', english: 'to be able to / can',
    forms: { 'yo': 'puedo', 'tú': 'puedes', 'él/ella/Ud.': 'puede', 'nosotros(as)': 'podemos', 'ellos(as)/Uds.': 'pueden' }
  },
  // ── e → i stem change ────────────────────────────────────────────────
  {
    infinitive: 'servir', english: 'to serve',
    forms: { 'yo': 'sirvo', 'tú': 'sirves', 'él/ella/Ud.': 'sirve', 'nosotros(as)': 'servimos', 'ellos(as)/Uds.': 'sirven' }
  },
  {
    infinitive: 'pedir', english: 'to ask for',
    forms: { 'yo': 'pido', 'tú': 'pides', 'él/ella/Ud.': 'pide', 'nosotros(as)': 'pedimos', 'ellos(as)/Uds.': 'piden' }
  },
  {
    infinitive: 'seguir', english: 'to follow / to continue',
    forms: { 'yo': 'sigo', 'tú': 'sigues', 'él/ella/Ud.': 'sigue', 'nosotros(as)': 'seguimos', 'ellos(as)/Uds.': 'siguen' }
  },
  {
    infinitive: 'conseguir', english: 'to get',
    forms: { 'yo': 'consigo', 'tú': 'consigues', 'él/ella/Ud.': 'consigue', 'nosotros(as)': 'conseguimos', 'ellos(as)/Uds.': 'consiguen' }
  },
  {
    infinitive: 'repetir', english: 'to repeat',
    forms: { 'yo': 'repito', 'tú': 'repites', 'él/ella/Ud.': 'repite', 'nosotros(as)': 'repetimos', 'ellos(as)/Uds.': 'repiten' }
  },
];

window.CONJUGATION_DATA = CONJUGATION_DATA;
