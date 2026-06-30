import { useState, useEffect } from 'react'
import { Grid, Card, CardContent, Typography, Chip, Box } from '@mui/material'
import axios from 'axios'

const topics = [
  'ARPANET Origins', 'TCP/IP Revolution', 'Domain Name System',
  'World Wide Web', 'Commercial Internet', 'Dot-Com Boom & Bust',
  'Web 2.0 Era', 'Mobile Revolution', 'Modern Internet'
]

export default function HomePage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get('/health').then(() => setStats('connected')).catch(() => setStats('offline'))
  }, [])

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>History of the Internet</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        AI-powered documentary video generation platform
        {stats && <Chip label={stats} color={stats === 'connected' ? 'success' : 'error'} size="small" sx={{ ml: 1 }} />}
      </Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>Available Topics</Typography>
      <Grid container spacing={2}>
        {topics.map(topic => (
          <Grid item xs={12} sm={6} md={4} key={topic}>
            <Card sx={{ background: '#111', border: '1px solid #333', cursor: 'pointer',
              '&:hover': { borderColor: '#2196f3', transform: 'translateY(-2px)', transition: 'all 0.2s' } }}>
              <CardContent>
                <Typography variant="subtitle1">{topic}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Generate a documentary video about {topic.toLowerCase()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
