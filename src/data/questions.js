// Question bank shared by the PYQ Portal and the Test Portal.
//
// HOW TO ADD REAL MHT-CET PYQs
// Copy an entry and fill in:
//   id        unique string, e.g. 'phy-2024-s1-q12'
//   subject   'Physics' | 'Chemistry' | 'Mathematics'
//   chapter   must match a chapter name in syllabus.js
//   year      exam year, e.g. 2024 (leave null for practice questions)
//   shift     e.g. '9 May Shift 1' (optional)
//   q         question text
//   options   exactly 4 options
//   answer    index of the correct option (0 = A, 1 = B, 2 = C, 3 = D)
//   solution  short explanation
//   video     optional YouTube video id with the solution
//
// The entries below are PRACTICE questions (year: null) written in the MHT-CET
// style so the portals work out of the box. Replace or extend them with
// official PYQs.

export const questions = [
  // ---------------- PHYSICS ----------------
  {
    id: 'phy-rd-1', subject: 'Physics', chapter: 'Rotational Dynamics', year: null,
    q: 'A solid sphere rolls without slipping on a horizontal surface. What fraction of its total kinetic energy is rotational?',
    options: ['2/7', '2/5', '5/7', '1/2'], answer: 0,
    solution: 'KE_rot = ½·(2/5)MR²·ω² = (1/5)Mv², KE_total = ½Mv² + (1/5)Mv² = (7/10)Mv². Ratio = (1/5)/(7/10) = 2/7.',
  },
  {
    id: 'phy-fl-1', subject: 'Physics', chapter: 'Mechanical Properties of Fluids', year: null,
    q: 'The terminal velocity of a small steel ball falling through glycerine is v. If the radius of the ball is doubled, the terminal velocity becomes',
    options: ['v/2', '2v', '4v', '8v'], answer: 2,
    solution: 'By Stokes’ law, terminal velocity v = 2r²(ρ − σ)g / 9η, so v ∝ r². Doubling r makes it 4v.',
  },
  {
    id: 'phy-ktg-1', subject: 'Physics', chapter: 'Kinetic Theory of Gases and Radiation', year: null,
    q: 'The temperature of a gas is raised from 27 °C to 927 °C. Its r.m.s. speed becomes',
    options: ['√(927/27) times', 'twice', 'half', 'four times'], answer: 1,
    solution: 'v_rms ∝ √T. T changes from 300 K to 1200 K, i.e. 4 times, so v_rms becomes √4 = 2 times.',
  },
  {
    id: 'phy-th-1', subject: 'Physics', chapter: 'Thermodynamics', year: null,
    q: 'A Carnot engine works between a source at 527 °C and a sink at 127 °C. Its efficiency is',
    options: ['25 %', '50 %', '75 %', '76 %'], answer: 1,
    solution: 'η = 1 − T₂/T₁ = 1 − 400/800 = 0.5 = 50 %.',
  },
  {
    id: 'phy-osc-1', subject: 'Physics', chapter: 'Oscillations', year: null,
    q: 'If the length of a simple pendulum is increased by 21 %, its period increases by',
    options: ['21 %', '10.5 %', '10 %', '11 %'], answer: 2,
    solution: 'T ∝ √L. New T = √1.21·T = 1.1 T, an increase of 10 %.',
  },
  {
    id: 'phy-sw-1', subject: 'Physics', chapter: 'Superposition of Waves', year: null,
    q: 'A pipe 85 cm long is closed at one end. If the speed of sound in air is 340 m/s, the fundamental frequency is',
    options: ['100 Hz', '200 Hz', '400 Hz', '50 Hz'], answer: 0,
    solution: 'For a closed pipe, n = v / 4L = 340 / (4 × 0.85) = 100 Hz.',
  },
  {
    id: 'phy-wo-1', subject: 'Physics', chapter: 'Wave Optics', year: null,
    q: 'In Young’s double slit experiment, λ = 600 nm, slit separation = 0.3 mm and screen distance = 1 m. The fringe width is',
    options: ['0.2 mm', '1 mm', '2 mm', '3 mm'], answer: 2,
    solution: 'β = λD/d = (600 × 10⁻⁹ × 1) / (0.3 × 10⁻³) = 2 × 10⁻³ m = 2 mm.',
  },
  {
    id: 'phy-ce-1', subject: 'Physics', chapter: 'Current Electricity', year: null,
    q: 'A wire of resistance R is stretched uniformly to twice its length. Its new resistance is',
    options: ['R/2', '2R', '4R', 'R/4'], answer: 2,
    solution: 'Volume is constant, so A becomes A/2 when L becomes 2L. R = ρL/A becomes ρ(2L)/(A/2) = 4R.',
  },
  {
    id: 'phy-dn-1', subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter', year: null,
    q: 'The de Broglie wavelength of an electron accelerated through a potential difference of 100 V is approximately',
    options: ['12.27 Å', '1.227 Å', '0.1227 Å', '122.7 Å'], answer: 1,
    solution: 'λ = 12.27/√V Å = 12.27/10 = 1.227 Å.',
  },
  {
    id: 'phy-es-1', subject: 'Physics', chapter: 'Electrostatics', year: null,
    q: 'A parallel plate capacitor of capacitance C has its plate separation halved and a dielectric of constant 2 is filled completely between the plates. The new capacitance is',
    options: ['C', '2C', '4C', 'C/4'], answer: 2,
    solution: 'C = Kε₀A/d. Halving d doubles C, and K = 2 doubles it again, giving 4C.',
  },

  // ---------------- CHEMISTRY ----------------
  {
    id: 'chem-ss-1', subject: 'Chemistry', chapter: 'Solid State', year: null,
    q: 'The number of atoms per unit cell in a body-centred cubic (bcc) lattice is',
    options: ['1', '2', '4', '6'], answer: 1,
    solution: '8 corners × 1/8 + 1 body centre = 1 + 1 = 2.',
  },
  {
    id: 'chem-sol-1', subject: 'Chemistry', chapter: 'Solutions', year: null,
    q: 'Which of the following is NOT a colligative property?',
    options: ['Osmotic pressure', 'Elevation in boiling point', 'Depression in freezing point', 'Vapour pressure of solution'], answer: 3,
    solution: 'Relative lowering of vapour pressure is colligative; the vapour pressure itself is not.',
  },
  {
    id: 'chem-ck-1', subject: 'Chemistry', chapter: 'Chemical Kinetics', year: null,
    q: 'The rate constant of a first order reaction is 0.0693 min⁻¹. Its half-life is',
    options: ['1 min', '10 min', '100 min', '6.93 min'], answer: 1,
    solution: 't½ = 0.693 / k = 0.693 / 0.0693 = 10 min.',
  },
  {
    id: 'chem-ie-1', subject: 'Chemistry', chapter: 'Ionic Equilibria', year: null,
    q: 'The pH of a 0.001 M HCl solution is',
    options: ['1', '2', '3', '11'], answer: 2,
    solution: 'HCl is a strong acid, so [H⁺] = 10⁻³ M and pH = 3.',
  },
  {
    id: 'chem-ec-1', subject: 'Chemistry', chapter: 'Electrochemistry', year: null,
    q: 'The charge carried by one mole of electrons is approximately',
    options: ['96500 C', '1.6 × 10⁻¹⁹ C', '6.022 × 10²³ C', '9650 C'], answer: 0,
    solution: 'One Faraday = Nₐ × e ≈ 6.022 × 10²³ × 1.602 × 10⁻¹⁹ ≈ 96500 C.',
  },
  {
    id: 'chem-cc-1', subject: 'Chemistry', chapter: 'Coordination Compounds', year: null,
    q: 'The oxidation state of iron in K₄[Fe(CN)₆] is',
    options: ['+2', '+3', '0', '+4'], answer: 0,
    solution: '4(+1) + x + 6(−1) = 0, so x = +2.',
  },
  {
    id: 'chem-hd-1', subject: 'Chemistry', chapter: 'Halogen Derivatives', year: null,
    q: 'Which of the following undergoes SN1 reaction fastest?',
    options: ['CH₃Br', 'CH₃CH₂Br', '(CH₃)₂CHBr', '(CH₃)₃CBr'], answer: 3,
    solution: 'SN1 goes through a carbocation. The tertiary carbocation from (CH₃)₃CBr is the most stable.',
  },
  {
    id: 'chem-akc-1', subject: 'Chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids', year: null,
    q: 'Which of the following gives a positive iodoform test?',
    options: ['Methanol', 'Formaldehyde', 'Acetone', 'Benzaldehyde'], answer: 2,
    solution: 'The iodoform test needs a CH₃CO– group (or CH₃CH(OH)–). Acetone, CH₃COCH₃, has it.',
  },

  // ---------------- MATHEMATICS ----------------
  {
    id: 'math-mat-1', subject: 'Mathematics', chapter: 'Matrices', year: null,
    q: 'If A is a square matrix of order 3 with |A| = 4, then |adj A| is',
    options: ['4', '8', '16', '64'], answer: 2,
    solution: '|adj A| = |A|ⁿ⁻¹ = 4² = 16.',
  },
  {
    id: 'math-ml-1', subject: 'Mathematics', chapter: 'Mathematical Logic', year: null,
    q: 'The negation of p ∧ q is',
    options: ['~p ∧ ~q', '~p ∨ ~q', 'p ∨ ~q', '~p ∧ q'], answer: 1,
    solution: 'By De Morgan’s law, ~(p ∧ q) ≡ ~p ∨ ~q.',
  },
  {
    id: 'math-psl-1', subject: 'Mathematics', chapter: 'Pair of Straight Lines', year: null,
    q: 'The lines represented by ax² + 2hxy + by² = 0 are perpendicular if',
    options: ['h² = ab', 'a + b = 0', 'a = b', 'h = 0'], answer: 1,
    solution: 'The angle θ between the lines satisfies tan θ = 2√(h² − ab)/(a + b). The lines are perpendicular when a + b = 0.',
  },
  {
    id: 'math-vec-1', subject: 'Mathematics', chapter: 'Vectors', year: null,
    q: 'If |a| = 2, |b| = 3 and a · b = 3, then |a × b| is',
    options: ['3', '3√3', '√3', '9'], answer: 1,
    solution: '|a × b|² = |a|²|b|² − (a · b)² = 36 − 9 = 27, so |a × b| = 3√3.',
  },
  {
    id: 'math-diff-1', subject: 'Mathematics', chapter: 'Differentiation', year: null,
    q: 'If y = xˣ, then dy/dx is',
    options: ['x · xˣ⁻¹', 'xˣ log x', 'xˣ (1 + log x)', 'xˣ (1 − log x)'], answer: 2,
    solution: 'log y = x log x. Differentiating, (1/y) dy/dx = log x + 1, so dy/dx = xˣ(1 + log x).',
  },
  {
    id: 'math-di-1', subject: 'Mathematics', chapter: 'Definite Integration', year: null,
    q: 'The value of ∫₀^(π/2) sin²x dx is',
    options: ['π/2', 'π/4', '1', '0'], answer: 1,
    solution: 'By the property ∫₀^a f(x) dx = ∫₀^a f(a − x) dx, the integrals of sin²x and cos²x are equal. Their sum is ∫₀^(π/2) 1 dx = π/2, so each is π/4.',
  },
  {
    id: 'math-de-1', subject: 'Mathematics', chapter: 'Differential Equations', year: null,
    q: 'The order and degree of (d²y/dx²)³ + (dy/dx)² + y = 0 are respectively',
    options: ['2, 3', '3, 2', '2, 2', '1, 3'], answer: 0,
    solution: 'The highest derivative is d²y/dx², so the order is 2. Its power is 3, so the degree is 3.',
  },
  {
    id: 'math-bd-1', subject: 'Mathematics', chapter: 'Binomial Distribution', year: null,
    q: 'For a binomial distribution, the mean is 4 and the variance is 2. The value of n is',
    options: ['4', '6', '8', '16'], answer: 2,
    solution: 'np = 4 and npq = 2, so q = 1/2 and p = 1/2. Then n = 4 / (1/2) = 8.',
  },
]
