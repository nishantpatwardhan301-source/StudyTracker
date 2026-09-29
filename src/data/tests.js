// Test formats offered for every real MHT-CET paper in the database.
// MHT-CET PCM: Physics + Chemistry = 100 Qs in 90 min, Mathematics = 50 Qs in 90 min.
export const scopes = {
  full: { label: 'Full paper (PCM)', minutes: 180 },
  physics: { label: 'Physics only', minutes: 45 },
  chemistry: { label: 'Chemistry only', minutes: 45 },
  maths: { label: 'Mathematics only', minutes: 90 },
}

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
