// Channel / academy details. Edit here to update across the whole site.
export const site = {
  name: 'Nishant Patwardhan',
  academy: 'Matrix Science Academy',
  tagline: 'Learn Physics the way toppers do',
  intro:
    'Free, exam-focused lectures, tests and PYQs for MHT-CET, JEE and NEET aspirants across Maharashtra, by an MHT-CET topper and COEP engineer.',
  youtube: 'https://www.youtube.com/@MATRIXSCIENCEACADEMY',
  subscribe: 'https://www.youtube.com/@MATRIXSCIENCEACADEMY?sub_confirmation=1',
  whatsapp: 'https://whatsapp.com/channel/0029VbDsaIN2Jl8FnvoRCC0Q',
  app: 'https://play.google.com/store/apps/details?id=co.loki.nydby',
  appOrgCode: 'ZXAERZ',
  aadharSite: 'https://aadhar-batch.vercel.app/',
  phone: '7066953666',
  stats: [
    { value: '48.9K+', label: 'YouTube subscribers' },
    { value: '584+', label: 'Free video lectures' },
    { value: '86+', label: 'Students above 99 percentile (MHT-CET)' },
    { value: '15+', label: 'Years of teaching' },
  ],
  about: [
    'Prof. Nishant Patwardhan is one of the Directors of Matrix Science Academy, Pune, and a Physics mentor with over 15 years of teaching experience.',
    'An MHT-CET topper himself, he scored 196/200 in MHT-CET 2010 and went on to complete his B.Tech in Mechanical Engineering from the College of Engineering Pune (COEP).',
    'He started this YouTube channel to share his experience and preparation plan, and uploads Physics and Mathematics lectures for students preparing for MHT-CET, JEE (Main & Advanced), NEET and Class 11th & 12th boards (NCERT and State Board).',
    'Under his guidance, 86 students scored above the 99 percentile mark in MHT-CET last year.',
  ],
}

export const latestVideos = [
  { id: 'CSK5XgKfbW4', title: 'Cracking MHT-CET 2027: The Exact Routine You Need to Follow' },
  { id: 'LEwucWXlqJw', title: 'MHT-CET 2027 | Marks vs Percentile Biggest Data Analysis' },
  { id: 'nkTrVSCjfVE', title: 'MHT-CET 2027 Most Awaited PYQ Series Coming Soon' },
  { id: '2hzgXWeH6Gg', title: 'Rotational Dynamics One Shot Revision | MHT-CET 2027 Most Important Questions' },
  { id: 'JH5UA511HS8', title: 'The Only PYQ Strategy You Need for MHT-CET 2027' },
  { id: 'Cjb1XCS1YDc', title: 'MHT-CET Physics Paper Pattern Decoded: Solve Smarter, Not Harder' },
  { id: 'uLJAxHoOPbM', title: 'MHT-CET 2027 December Attempt: 99+ Percentile Physics Strategy' },
  { id: 'MHQEqDt3_Ng', title: 'MHT-CET 2027: Everything You Need to Know About the 50:50 Rule' },
]

export const thumb = (videoId) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
export const watchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`
export const playlistUrl = (listId) => `https://www.youtube.com/playlist?list=${listId}`
