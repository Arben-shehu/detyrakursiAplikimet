// Seed-i: krijon admin default + kategori + 100 pyetje shembull.
// Eshte idempotent: nese ri-ekzekutohet, fshin tentativat & pyetjet e vjetra
// dhe rivendos nga e para. Admin-i dhe kategorite mbahen nese ekzistojne.

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, withTransaction } = require('./pool');

const ADMIN = {
  username: 'admin',
  email: 'admin@iqtester.local',
  password: 'admin123',
};

const CATEGORIES = [
  { name: 'Logjike',         description: 'Pyetje logjike, sekuenca dhe arsyetim' },
  { name: 'Matematike',      description: 'Pyetje me numra dhe veprime' },
  { name: 'Verbale',         description: 'Fjale, analogji dhe kuptim' },
  { name: 'Logjike Vizuale', description: 'Pyetje me forma dhe modele vizuale' },
];

// Helper i shkurter: q(cat, text, opcioneVare, indeksiKorrekt, difficulty)
function q(category, text, opts, correctIdx, difficulty = 1) {
  return {
    category,
    text,
    difficulty,
    options: opts.map((t, i) => ({ t, correct: i === correctIdx })),
  };
}

// Helper per pyetjet vizuale: opsionet mund te jene strings ose objekte { text, svg }
function qSvg(category, text, questionSvg, opts, correctIdx, difficulty = 2) {
  return {
    category,
    text,
    difficulty,
    image_svg: questionSvg,
    options: opts.map((o, i) => {
      const obj = typeof o === 'string' ? { t: o } : { t: o.t || '', image_svg: o.svg };
      obj.correct = i === correctIdx;
      return obj;
    }),
  };
}

// Helper-a SVG: forma te shpejta per pyetjet vizuale
const svg = {
  circle: (r = 24, color = 'currentColor') =>
    `<svg viewBox="0 0 80 80" width="80" height="80"><circle cx="40" cy="40" r="${r}" fill="${color}" /></svg>`,
  square: (s = 50, color = 'currentColor') =>
    `<svg viewBox="0 0 80 80" width="80" height="80"><rect x="${40 - s / 2}" y="${40 - s / 2}" width="${s}" height="${s}" fill="${color}" /></svg>`,
  triangle: (rotation = 0, color = 'currentColor') =>
    `<svg viewBox="0 0 80 80" width="80" height="80"><polygon points="40,15 65,65 15,65" fill="${color}" transform="rotate(${rotation} 40 40)" /></svg>`,
  arrow: (rotation = 0, color = 'currentColor') =>
    `<svg viewBox="0 0 80 80" width="80" height="80"><g transform="rotate(${rotation} 40 40)" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="40" y1="60" x2="40" y2="20"/><polyline points="25,35 40,20 55,35"/></g></svg>`,
  dots: (n = 1, color = 'currentColor') => {
    const positions = [
      [], [[40,40]], [[25,40],[55,40]], [[25,25],[55,40],[25,55]],
      [[25,25],[55,25],[25,55],[55,55]], [[25,25],[55,25],[40,40],[25,55],[55,55]],
      [[25,25],[55,25],[25,40],[55,40],[25,55],[55,55]],
    ];
    const ps = positions[n] || [];
    const circles = ps.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${color}" />`).join('');
    return `<svg viewBox="0 0 80 80" width="80" height="80">${circles}</svg>`;
  },
};

// Helper: nje sekuence vizuale me shapes nga e majta ne te djathte.
// shapes: array fragmentesh SVG (PA tag-un <svg>...</svg>), pozicionohen ne x ne intervale 92.
// Indeksi `placeholder` ben qe nje qelize te shfaqet me "?".
function seqSVG(shapes, placeholder = shapes.length - 1) {
  const cell = 80;
  const gap = 12;
  const total = shapes.length;
  const w = total * (cell + gap) - gap;
  const items = shapes.map((s, i) => {
    const x = i * (cell + gap);
    if (i === placeholder) {
      return `<g transform="translate(${x},0)"><rect x="0" y="0" width="${cell}" height="${cell}" rx="8" fill="none" stroke="currentColor" stroke-dasharray="4,4" stroke-width="2"/><text x="${cell/2}" y="52" font-size="40" text-anchor="middle" fill="currentColor" font-weight="700">?</text></g>`;
    }
    return `<g transform="translate(${x},0)">${s}</g>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${cell}" width="${w}" height="${cell}">${items}</svg>`;
}

// Inner-only versions (pa wrapper <svg>) per perdorim brenda seqSVG
const inner = {
  circle: (r, color = 'currentColor') => `<circle cx="40" cy="40" r="${r}" fill="${color}"/>`,
  square: (s, color = 'currentColor') => `<rect x="${40 - s/2}" y="${40 - s/2}" width="${s}" height="${s}" fill="${color}"/>`,
  triangle: (rot = 0, color = 'currentColor') => `<polygon points="40,15 65,65 15,65" fill="${color}" transform="rotate(${rot} 40 40)"/>`,
  arrow: (rot = 0, color = 'currentColor') => `<g transform="rotate(${rot} 40 40)" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="40" y1="60" x2="40" y2="20"/><polyline points="25,35 40,20 55,35"/></g>`,
  dots: (n, color = 'currentColor') => {
    const pos = [[], [[40,40]], [[25,40],[55,40]], [[25,25],[55,40],[25,55]], [[25,25],[55,25],[25,55],[55,55]], [[25,25],[55,25],[40,40],[25,55],[55,55]], [[25,25],[55,25],[25,40],[55,40],[25,55],[55,55]]];
    return (pos[n] || []).map(([x,y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${color}"/>`).join('');
  },
};

const QUESTIONS = [
  // ===================== LOGJIKE (34) =====================
  q('Logjike', 'Cili numer vjen ne vazhdim? 2, 4, 6, 8, ?', ['9', '10', '12', '14'], 1),
  q('Logjike', 'Cili numer vjen ne vazhdim? 1, 3, 5, 7, ?', ['8', '9', '10', '11'], 1),
  q('Logjike', 'Cili numer vjen ne vazhdim? 2, 4, 8, 16, ?', ['20', '24', '32', '64'], 2),
  q('Logjike', 'Cili numer vjen ne vazhdim? 1, 4, 9, 16, ?', ['20', '24', '25', '36'], 2),
  q('Logjike', 'Cili numer vjen ne vazhdim? 1, 8, 27, 64, ?', ['81', '100', '125', '216'], 2, 2),
  q('Logjike', 'Cili numer vjen ne vazhdim? 5, 10, 20, 40, ?', ['50', '60', '70', '80'], 3),
  q('Logjike', 'Cili numer vjen ne vazhdim ne sekuencen Fibonacci? 1, 1, 2, 3, 5, ?', ['6', '7', '8', '13'], 2),
  q('Logjike', 'Cili numer vjen ne vazhdim? 3, 6, 12, 24, ?', ['30', '36', '48', '64'], 2),
  q('Logjike', 'Cili numer vjen ne vazhdim? 100, 90, 81, 73, ?', ['64', '65', '66', '70'], 2, 3),
  q('Logjike', 'Cili numer vjen ne vazhdim? 81, 27, 9, 3, ?', ['0', '1', '2', '3'], 1),
  q('Logjike', 'Cili numer vjen ne vazhdim? 7, 14, 28, 56, ?', ['64', '84', '98', '112'], 3),
  q('Logjike', 'Cili numer vjen ne vazhdim? 2, 6, 12, 20, 30, ?', ['36', '40', '42', '48'], 2, 2),
  q('Logjike', 'Plotesoni: A, C, E, G, ?', ['H', 'I', 'J', 'K'], 1),
  q('Logjike', 'Plotesoni: Z, X, V, T, ?', ['R', 'S', 'U', 'P'], 0, 2),
  q('Logjike', 'Te gjithe njerezit jane te vdekshem. Sokrati eshte njeri. Atehere:', [
    'Sokrati eshte i pavdekshem',
    'Sokrati eshte i vdekshem',
    'Nuk mund te dihet',
    'Te gjithe sokratet jane te vdekshem',
  ], 1),
  q('Logjike', 'Nese te gjitha macet jane gjitare dhe disa gjitare jane te bardha, atehere:', [
    'Te gjitha macet jane te bardha',
    'Disa mace mund te jene te bardha',
    'Asnje mace nuk eshte e bardhe',
    'Te gjithe gjitaret jane mace',
  ], 1),
  q('Logjike', 'Nese sot eshte e marte, cila dite ishte 100 dite me pare?', [
    'e merkure', 'e enjte', 'e premte', 'e shtune',
  ], 2, 3),
  q('Logjike', '3 mace kapin 3 minj per 3 minuta. Sa mace duhen per 100 minj per 100 minuta?', [
    '3', '33', '100', '300',
  ], 0, 2),
  q('Logjike', 'Babai im eshte djali i gjyshit tend. Une jam:', [
    'kushëriri yt', 'vellai yt', 'xhaxhai yt', 'biri yt',
  ], 1),
  q('Logjike', 'Cili element nuk i perket grupit: macja, qeni, lulja, lopa?', [
    'macja', 'qeni', 'lulja', 'lopa',
  ], 2),
  q('Logjike', 'Cili element nuk i perket grupit: e hene, e marte, mars, e merkure?', [
    'e hene', 'e marte', 'mars', 'e merkure',
  ], 2),
  q('Logjike', 'Cili element nuk i perket grupit: vere, dimer, vjeshte, gjeografi?', [
    'vere', 'dimer', 'vjeshte', 'gjeografi',
  ], 3),
  q('Logjike', 'Cili element nuk i perket grupit: trendafil, manushaqe, zambak, lis?', [
    'trendafil', 'manushaqe', 'zambak', 'lis',
  ], 3),
  q('Logjike', 'Cili element nuk i perket grupit: kali, lopa, dhija, koka?', [
    'kali', 'lopa', 'dhija', 'koka',
  ], 3),
  q('Logjike', 'Nese 1=A, 2=B, 3=C... atehere germa K eshte numri:', [
    '10', '11', '12', '13',
  ], 1),
  q('Logjike', 'Nese MUAJ shkruhet JAUM, si shkruhet VITI duke ndjekur te njejten rregull?', [
    'IVIT', 'ITIV', 'ITVI', 'VTII',
  ], 1),
  q('Logjike', 'Nese sot eshte e shtune, cila dite do jete pas 10 ditesh?', [
    'e enjte', 'e premte', 'e marte', 'e merkure',
  ], 0, 2),
  q('Logjike', 'A eshte babai i B. B eshte babai i C. Cili eshte raporti i A me C?', [
    'vella', 'kusheri', 'gjysh', 'xhaxha',
  ], 2),
  q('Logjike', 'Cili numer vjen ne vazhdim? 5, 11, 23, 47, ?', [
    '71', '83', '95', '107',
  ], 2, 4),
  q('Logjike', 'Sa katrore te ndryshem mund te numerohen ne nje rrjet 2x2?', [
    '4', '5', '6', '9',
  ], 1, 3),
  q('Logjike', 'Plotesoni: 2, 5, 11, 23, ?', [
    '35', '41', '47', '53',
  ], 2, 3),
  q('Logjike', 'Cila eshte e perbashketa e numrave 6, 12, 18?', [
    'shumefisha te 6', 'numra te thjeshte', 'numra ciftore', 'numra fibonacci',
  ], 0),
  q('Logjike', 'Nese disa A jane B, dhe te gjithe B jane C, atehere:', [
    'Te gjithe A jane C',
    'Disa A jane C',
    'Asnje A nuk eshte C',
    'Nuk mund te dihet',
  ], 1, 3),
  q('Logjike', 'Plotesoni: ZARI, BRESHKE, MOLLE, ... (sipas numrit te germave 4,7,5,?)', [
    'PEMA', 'KALI', 'DIELLI', 'TRENDAFIL',
  ], 2, 3),

  // ===================== MATEMATIKE (33) =====================
  q('Matematike', '15 + 27 = ?', ['38', '41', '42', '43'], 2),
  q('Matematike', '84 / 6 = ?', ['12', '13', '14', '16'], 2),
  q('Matematike', '13 * 12 = ?', ['144', '146', '156', '166'], 2),
  q('Matematike', '100 - 47 = ?', ['43', '47', '53', '57'], 2),
  q('Matematike', '256 + 144 = ?', ['380', '390', '400', '410'], 2),
  q('Matematike', '7 * 8 - 6 / 2 = ?', ['25', '50', '53', '56'], 2, 2),
  q('Matematike', '15% e 200 eshte:', ['15', '20', '30', '40'], 2),
  q('Matematike', '25% e 200 eshte:', ['25', '50', '75', '100'], 1),
  q('Matematike', '10% e 90 eshte:', ['8', '9', '10', '12'], 1),
  q('Matematike', '50% e 84 eshte:', ['40', '42', '44', '46'], 1),
  q('Matematike', '5% e 400 eshte:', ['10', '15', '20', '25'], 2),
  q('Matematike', 'Nese 5x = 35, atehere x =', ['5', '6', '7', '8'], 2),
  q('Matematike', 'Nese 3x + 2 = 11, atehere x =', ['2', '3', '4', '5'], 1),
  q('Matematike', 'Nese 2(x + 3) = 14, atehere x =', ['3', '4', '5', '6'], 1, 2),
  q('Matematike', 'Nese x/4 = 5, atehere x =', ['15', '20', '24', '25'], 1),
  q('Matematike', 'Nese 5x - 10 = 30, atehere x =', ['6', '7', '8', '9'], 2),
  q('Matematike', 'Nese x^2 = 49, atehere x =', ['5', '6', '7', '8'], 2),
  q('Matematike', 'Siperfaqja e nje katrori me brinje 6 eshte:', ['12', '24', '36', '48'], 2),
  q('Matematike', 'Perimetri i nje katrori me brinje 4 eshte:', ['8', '12', '16', '20'], 2),
  q('Matematike', 'Siperfaqja e nje drejtkendeshi 3 x 5 eshte:', ['8', '15', '18', '25'], 1),
  q('Matematike', 'Sa shkalle ka nje trekendesh (shuma e kendeve)?', ['90', '120', '180', '360'], 2),
  q('Matematike', 'Sa eshte 2^5?', ['10', '16', '32', '64'], 2),
  q('Matematike', 'Sa eshte 3^3?', ['9', '18', '27', '36'], 2),
  q('Matematike', 'Rrenja katrore e 81 eshte:', ['7', '8', '9', '10'], 2),
  q('Matematike', 'Rrenja katrore e 144 eshte:', ['10', '11', '12', '13'], 2),
  q('Matematike', 'Mesatarja e numrave 4, 8, 12, 16 eshte:', ['8', '10', '12', '14'], 1),
  q('Matematike', 'Mesatarja e numrave 2, 4, 6, 8, 10 eshte:', ['5', '6', '7', '8'], 1),
  q('Matematike', 'Sa minuta ka nje ore e gjysme?', ['60', '75', '90', '120'], 2),
  q('Matematike', 'Sa sekonda ka nje ore?', ['360', '3600', '6000', '36000'], 1),
  q('Matematike', 'Nese nje rrobe kushton 80 leke me 20% ulje, cmimi origjinal ishte:', ['90', '96', '100', '120'], 2, 2),
  q('Matematike', 'Anna ka 3 here me shume libra se Beni. Beni ka 12. Sa libra ka Anna?', ['24', '30', '36', '48'], 2),
  q('Matematike', 'Nje makine ben 100 km/h. Sa km ben per 2.5 ore?', ['200', '225', '250', '275'], 2),
  q('Matematike', 'Nese 3 punetore mbarojne nje pune per 6 dite, sa dite duhen 6 punetore (e njejta pune)?', ['2', '3', '4', '6'], 1, 2),

  // ===================== VERBALE (33) =====================
  q('Verbale', 'Sinonimi i fjales "i lumtur" eshte:', ['i trishtuar', 'i merzitur', 'i gezuar', 'i lodhur'], 2),
  q('Verbale', 'Sinonimi i fjales "i forte" eshte:', ['i dobet', 'i fuqishem', 'i shkurter', 'i sheshte'], 1),
  q('Verbale', 'Sinonimi i fjales "i shpejte" eshte:', ['i ngadalte', 'i rrufeshem', 'i qete', 'i thelle'], 1),
  q('Verbale', 'Sinonimi i fjales "i bukur" eshte:', ['i shemtuar', 'i ftohte', 'i hijshem', 'i larte'], 2),
  q('Verbale', 'Sinonimi i fjales "armik" eshte:', ['mik', 'kunderpartit', 'shoke', 'bashkepunetor'], 1),
  q('Verbale', 'Sinonimi i fjales "i pasur" eshte:', ['i varfer', 'i kamur', 'i lire', 'i mire'], 1),
  q('Verbale', 'Sinonimi i fjales "i lehte" eshte:', ['i rende', 'i thjeshte', 'i veshtire', 'i larte'], 1),
  q('Verbale', 'Sinonimi i fjales "i guximshem" eshte:', ['i frikesuar', 'trim', 'i ngathet', 'i qete'], 1),

  q('Verbale', 'Antonimi i fjales "shpejt" eshte:', ['kalueshem', 'ngadalshem', 'i thjeshte', 'fort'], 1),
  q('Verbale', 'Antonimi i fjales "i ngrohte" eshte:', ['i lagesht', 'i thate', 'i ftohte', 'i nxehte'], 2),
  q('Verbale', 'Antonimi i fjales "i hapur" eshte:', ['i lire', 'i mbyllur', 'i gjere', 'i drejte'], 1),
  q('Verbale', 'Antonimi i fjales "drite" eshte:', ['hije', 'erresire', 'mjegull', 'qielli'], 1),
  q('Verbale', 'Antonimi i fjales "i vjeter" eshte:', ['i mire', 'i ri', 'i ngrohte', 'i bukur'], 1),
  q('Verbale', 'Antonimi i fjales "i mire" eshte:', ['i keq', 'i shkurter', 'i gjate', 'i lire'], 0),
  q('Verbale', 'Antonimi i fjales "i larte" eshte:', ['i thelle', 'i shkurter', 'i gjate', 'i ulet'], 3),
  q('Verbale', 'Antonimi i fjales "i forte" eshte:', ['i dobet', 'i larte', 'i ngadalte', 'i bukur'], 0),

  q('Verbale', 'I madh eshte per i vogel sic eshte i ngrohte per:', ['i lagesht', 'i thate', 'i ftohte', 'i nxehte'], 2),
  q('Verbale', 'Mjek eshte per spital sic eshte mesues per:', ['shtepi', 'shkolle', 'park', 'biblioteke'], 1),
  q('Verbale', 'Zog eshte per qiell sic eshte peshku per:', ['toke', 'uje', 'rere', 'pyll'], 1),
  q('Verbale', 'Diell eshte per dite sic eshte hena per:', ['dimer', 'nate', 'pranvere', 'vere'], 1),
  q('Verbale', 'Laps eshte per shkruajte sic eshte gerez per:', ['pres', 'presim', 'lyej', 'shko'], 1),
  q('Verbale', 'Bareshe eshte per kope sic eshte mesues per:', ['libra', 'tabela', 'nxenes', 'rrugë'], 2),
  q('Verbale', 'Kuzhinier eshte per restorant sic eshte gjyqtar per:', ['shtepi', 'sallon', 'gjykate', 'zyre'], 2),

  q('Verbale', 'Kuptimi i fjales "trim" eshte:', ['i frikesuar', 'i guximshem', 'i ngadalte', 'i qete'], 1),
  q('Verbale', 'Kuptimi i fjales "biografi" eshte:', [
    'tregim per kafshet',
    'historia e jetes se nje personi',
    'libra mesimi',
    'liste pjatash',
  ], 1),
  q('Verbale', 'Cfare eshte nje "monolog"?', [
    'flas me dy persona',
    'flas i vetem para tjeretve',
    'kenge me grup',
    'shfaqje me shume aktore',
  ], 1),
  q('Verbale', 'Cfare eshte nje "fjalor"?', [
    'liber me fjale dhe kuptimet e tyre',
    'liber me poezi',
    'liber me harta',
    'liber me histori',
  ], 0),

  q('Verbale', 'Cila fjale nuk i perket: trendafil, manushaqe, zambak, kompjuter?', [
    'trendafil', 'manushaqe', 'zambak', 'kompjuter',
  ], 3),
  q('Verbale', 'Cila fjale nuk i perket: e hene, e marte, mars, e premte?', [
    'e hene', 'e marte', 'mars', 'e premte',
  ], 2),
  q('Verbale', 'Cila fjale nuk i perket: i kuq, i gjelber, i zi, i larte?', [
    'i kuq', 'i gjelber', 'i zi', 'i larte',
  ], 3),

  q('Verbale', 'Cila eshte stina e dyte e vitit kalendar shqip (pranvera, vera, vjeshta, dimri)?', [
    'pranvera', 'vera', 'vjeshta', 'dimri',
  ], 1),
  q('Verbale', 'Cili eshte muaji i 7-te i vitit?', [
    'qershor', 'korrik', 'gusht', 'shtator',
  ], 1),
  q('Verbale', 'Kryeqyteti i Shqiperise eshte:', [
    'Tirana', 'Vlora', 'Shkodra', 'Durresi',
  ], 0),

  // ===================== LOGJIKE VIZUALE (12) =====================
  // 1) Rrathe qe rriten: 10, 20, 30, ?
  qSvg('Logjike Vizuale', 'Cila figure vjen ne vazhdim te sekuences?',
    seqSVG([inner.circle(10), inner.circle(20), inner.circle(30), null], 3),
    [
      { svg: svg.circle(15) },
      { svg: svg.circle(25) },
      { svg: svg.circle(40) },
      { svg: svg.circle(10) },
    ], 2),

  // 2) Trekendesh qe rrotullohet 90 grade
  qSvg('Logjike Vizuale', 'Cili eshte hapi tjeter ne rrotullim?',
    seqSVG([inner.triangle(0), inner.triangle(90), inner.triangle(180), null], 3),
    [
      { svg: svg.triangle(45) },
      { svg: svg.triangle(270) },
      { svg: svg.triangle(0) },
      { svg: svg.triangle(180) },
    ], 1),

  // 3) Numri i pikave: 1, 2, 3, ?
  qSvg('Logjike Vizuale', 'Sa pika duhet te jene ne kuti?',
    seqSVG([inner.dots(1), inner.dots(2), inner.dots(3), null], 3),
    [
      { svg: svg.dots(2) },
      { svg: svg.dots(4) },
      { svg: svg.dots(5) },
      { svg: svg.dots(6) },
    ], 1),

  // 4) Shigjeta rrotullohen orës (lart, djathtas, posht, ?)
  qSvg('Logjike Vizuale', 'Cila shigjete vjen ne vazhdim?',
    seqSVG([inner.arrow(0), inner.arrow(90), inner.arrow(180), null], 3),
    [
      { svg: svg.arrow(0) },
      { svg: svg.arrow(45) },
      { svg: svg.arrow(270) },
      { svg: svg.arrow(180) },
    ], 2),

  // 5) Pikat dyfishohen: 1, 2, 4, ?
  qSvg('Logjike Vizuale', 'Numri i pikave dyfishohet ne cdo hap. Cila kuti pason?',
    seqSVG([inner.dots(1), inner.dots(2), inner.dots(4), null], 3),
    [
      { svg: svg.dots(5) },
      { svg: svg.dots(6) },
      { svg: svg.dots(3) },
      { svg: svg.dots(4) },
    ], 1, 3),

  // 6) Sekuence alternuese rrethi-katrori-rrethi-?
  qSvg('Logjike Vizuale', 'Cila forme pason ne sekuencen alternuese?',
    seqSVG([inner.circle(28), inner.square(50), inner.circle(28), null], 3),
    [
      { svg: svg.triangle(0) },
      { svg: svg.square(50) },
      { svg: svg.circle(28) },
      { svg: svg.circle(40) },
    ], 1),

  // 7) Trekendesh me ngjyra alternuese (forma fikse, ngjyra alternohen)
  qSvg('Logjike Vizuale', 'Forma rrotullohet 45 grade ne cdo hap. Cila vjen tjetra?',
    seqSVG([inner.triangle(0), inner.triangle(45), inner.triangle(90), null], 3),
    [
      { svg: svg.triangle(135) },
      { svg: svg.triangle(180) },
      { svg: svg.triangle(225) },
      { svg: svg.triangle(0) },
    ], 0, 3),

  // 8) Renia e madhesise se katrorit: 60, 50, 40, ?
  qSvg('Logjike Vizuale', 'Madhesia e katrorit zvogelohet me 10 ne cdo hap. Cili vjen tjetri?',
    seqSVG([inner.square(60), inner.square(50), inner.square(40), null], 3),
    [
      { svg: svg.square(35) },
      { svg: svg.square(30) },
      { svg: svg.square(25) },
      { svg: svg.square(20) },
    ], 1),

  // 9) Pattern shap-sekuence: rreth → trekendesh → katror → rreth → trekendesh → ?
  qSvg('Logjike Vizuale', 'Cila forme pason ne kete model ciklik?',
    seqSVG([inner.circle(25), inner.triangle(0), inner.square(45), inner.circle(25), inner.triangle(0), null], 5),
    [
      { svg: svg.circle(25) },
      { svg: svg.triangle(0) },
      { svg: svg.square(45) },
      { svg: svg.triangle(180) },
    ], 2),

  // 10) Pikat ne rritje: 1, 3, 5, ?
  qSvg('Logjike Vizuale', 'Numri i pikave rritet me 2 ne cdo hap. Cila kuti pason?',
    seqSVG([inner.dots(1), inner.dots(3), inner.dots(5), null], 3),
    [
      { svg: svg.dots(6) },
      { svg: svg.dots(2) },
      { svg: svg.dots(4) },
      { svg: svg.dots(7) },
    ], 3, 2),

  // 11) Shigjeta nga e djathta drejt te majtes (270, 180, 90, ?)
  qSvg('Logjike Vizuale', 'Shigjeta rrotullohet me 90 grade kunder ores. Cila vjen tjetra?',
    seqSVG([inner.arrow(270), inner.arrow(180), inner.arrow(90), null], 3),
    [
      { svg: svg.arrow(180) },
      { svg: svg.arrow(0) },
      { svg: svg.arrow(45) },
      { svg: svg.arrow(225) },
    ], 1, 3),

  // 12) Forma rriten dhe ndryshojne: rreth -> rreth me i madh -> katror i vogel -> katror i madh -> ?
  qSvg('Logjike Vizuale', 'Ndiq modelin: forma rritet, pastaj ndryshon ne trekendesh. Cili vjen tjetri?',
    seqSVG([inner.circle(20), inner.circle(35), inner.triangle(0), null], 3),
    [
      { svg: svg.triangle(0) },
      { svg: svg.square(40) },
      { svg: svg.circle(20) },
      { svg: svg.square(60) },
    ], 3, 4),
];

async function main() {
  console.log('[seed] Po nis seed-imin...');

  // 1) Admin user
  const hash = await bcrypt.hash(ADMIN.password, 10);
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [ADMIN.username]);
  if (existing.rowCount === 0) {
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [ADMIN.username, ADMIN.email, hash]
    );
    console.log(`[seed] Admin u krijua: username=${ADMIN.username} password=${ADMIN.password}`);
  } else {
    console.log('[seed] Admin ekziston, po e kaperceje.');
  }

  // 2) Kategori (idempotente: krijohen vetem nese mungojne)
  for (const c of CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [c.name, c.description]
    );
  }
  const catRes = await pool.query('SELECT id, name FROM categories');
  const catIdByName = new Map(catRes.rows.map((r) => [r.name, r.id]));
  console.log(`[seed] Kategorite ne sistem: ${catRes.rowCount}`);

  // 3) Fshi pyetjet (dhe tentativat) ekzistuese pastaj rivendos te freskuara
  await withTransaction(async (client) => {
    await client.query('TRUNCATE answers, attempts, options, questions RESTART IDENTITY CASCADE');

    for (const q of QUESTIONS) {
      const categoryId = catIdByName.get(q.category);
      if (!categoryId) {
        console.warn(`[seed] Kategoria "${q.category}" nuk u gjet, po kapercehet pyetja.`);
        continue;
      }
      const qr = await client.query(
        'INSERT INTO questions (category_id, text, difficulty, image_svg) VALUES ($1, $2, $3, $4) RETURNING id',
        [categoryId, q.text, q.difficulty || 1, q.image_svg || null]
      );
      const qid = qr.rows[0].id;
      for (const o of q.options) {
        await client.query(
          'INSERT INTO options (question_id, text, is_correct, image_svg) VALUES ($1, $2, $3, $4)',
          [qid, o.t, !!o.correct, o.image_svg || null]
        );
      }
    }
    console.log(`[seed] U shtuan ${QUESTIONS.length} pyetje me opsionet perkatese.`);
  });

  console.log('[seed] Mbaroi me sukses.');
  await pool.end();
}

main().catch((err) => {
  console.error('[seed] DESHTOI:', err);
  pool.end();
  process.exit(1);
});
