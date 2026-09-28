import { questions } from './questions'

// MHT-CET marking scheme: Physics & Chemistry 1 mark each, Mathematics 2 marks each,
// no negative marking.
export const marksFor = (subject) => (subject === 'Mathematics' ? 2 : 1)

const bySubject = (s) => questions.filter((q) => q.subject === s).map((q) => q.id)

// Available tests. questionIds refer to ids in questions.js.
export const tests = [
  {
    id: 'mini-mock-1',
    title: 'MHT-CET Mini Mock 1 (PCM)',
    description: 'A short full-syllabus mock in the real MHT-CET pattern: Physics, Chemistry and Mathematics with no negative marking.',
    durationMin: 30,
    questionIds: [...bySubject('Physics'), ...bySubject('Chemistry'), ...bySubject('Mathematics')],
    tag: 'Full syllabus',
  },
  {
    id: 'physics-chapter-1',
    title: 'Physics Chapter Test: 12th Heat, Waves & Optics',
    description: 'KTG, Thermodynamics, Oscillations, Superposition of Waves and Wave Optics.',
    durationMin: 8,
    questionIds: ['phy-ktg-1', 'phy-th-1', 'phy-osc-1', 'phy-sw-1', 'phy-wo-1'],
    tag: 'Physics',
  },
  {
    id: 'physics-full-1',
    title: 'Physics Sectional Test',
    description: 'All Physics questions from the bank. Good for a quick speed check.',
    durationMin: 15,
    questionIds: bySubject('Physics'),
    tag: 'Physics',
  },
  {
    id: 'chemistry-sectional-1',
    title: 'Chemistry Sectional Test',
    description: 'Physical, inorganic and organic chemistry mix.',
    durationMin: 12,
    questionIds: bySubject('Chemistry'),
    tag: 'Chemistry',
  },
  {
    id: 'maths-sectional-1',
    title: 'Mathematics Sectional Test',
    description: '2 marks per question, as in MHT-CET.',
    durationMin: 15,
    questionIds: bySubject('Mathematics'),
    tag: 'Mathematics',
  },
]

// Scheduled / external tests shown as "Upcoming" on the Test Portal.
export const upcomingTests = [
  {
    title: 'ACE Test Series: MHT-CET 2027',
    detail: 'Free test series with a complete schedule. Watch the video for dates and registration.',
    href: 'https://youtu.be/rZ2VX7O6ykM',
  },
  {
    title: 'AADHAR Batch Sunday Mock',
    detail: 'Full MHT-CET simulator every Sunday, with video solutions and state-wide ranking (for enrolled students).',
    href: 'https://aadhar-batch.vercel.app/',
  },
]
