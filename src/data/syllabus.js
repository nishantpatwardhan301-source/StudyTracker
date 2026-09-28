// MHT-CET (PCM) chapter list, used by the Study Tracker and PYQ Portal.
export const syllabus = {
  Physics: {
    '12th': [
      'Rotational Dynamics', 'Mechanical Properties of Fluids', 'Kinetic Theory of Gases and Radiation',
      'Thermodynamics', 'Oscillations', 'Superposition of Waves', 'Wave Optics', 'Electrostatics',
      'Current Electricity', 'Magnetic Fields due to Electric Current', 'Magnetic Materials',
      'Electromagnetic Induction', 'AC Circuits', 'Dual Nature of Radiation and Matter',
      'Structure of Atoms and Nuclei', 'Semiconductor Devices',
    ],
    '11th': [
      'Motion in a Plane', 'Laws of Motion', 'Gravitation', 'Thermal Properties of Matter', 'Sound',
      'Optics', 'Electric Current Through Conductors', 'Magnetism',
      'Electromagnetic Waves and Communication System', 'Semiconductors',
    ],
  },
  Chemistry: {
    '12th': [
      'Solid State', 'Solutions', 'Ionic Equilibria', 'Chemical Thermodynamics', 'Electrochemistry',
      'Chemical Kinetics', 'Elements of Groups 16, 17 and 18', 'Transition and Inner Transition Elements',
      'Coordination Compounds', 'Halogen Derivatives', 'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules',
      'Introduction to Polymer Chemistry', 'Green Chemistry and Nanochemistry',
    ],
    '11th': [
      'Some Basic Concepts of Chemistry', 'Structure of Atom', 'Chemical Bonding', 'Redox Reactions',
      'Elements of Group 1 and 2', 'States of Matter', 'Adsorption and Colloids', 'Hydrocarbons',
      'Basic Principles of Organic Chemistry',
    ],
  },
  Mathematics: {
    '12th': [
      'Mathematical Logic', 'Matrices', 'Trigonometric Functions', 'Pair of Straight Lines', 'Vectors',
      'Line and Plane', 'Linear Programming', 'Differentiation', 'Applications of Derivatives',
      'Indefinite Integration', 'Definite Integration', 'Application of Definite Integration',
      'Differential Equations', 'Probability Distributions', 'Binomial Distribution',
    ],
    '11th': [
      'Trigonometry II', 'Straight Line', 'Circle', 'Conic Sections', 'Measures of Dispersion',
      'Probability', 'Complex Numbers', 'Permutations and Combinations', 'Functions', 'Limits', 'Continuity',
    ],
  },
}

export const subjects = Object.keys(syllabus)

export const subjectColor = {
  Physics: 'var(--physics)',
  Chemistry: 'var(--chemistry)',
  Mathematics: 'var(--maths)',
}
