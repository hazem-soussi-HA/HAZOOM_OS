import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Chip } from '@mui/material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'
const API = axios.create({ baseURL: API_URL })

export default function AdminDashboard() {
  const { token } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    API.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProfile(res.data))
      .catch(() => {})
  }, [token])

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
      <Card sx={{ background: '#111', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Profile</Typography>
          {profile ? (
            <Box>
              <Typography><strong>Email:</strong> {profile.email}</Typography>
              <Typography><strong>Name:</strong> {profile.full_name || '-'}</Typography>
              <Typography><strong>Role:</strong> <Chip label={profile.role} size="small" /></Typography>
              <Typography><strong>Active:</strong> {profile.is_active ? 'Yes' : 'No'}</Typography>
            </Box>
          ) : (
            <Typography color="text.secondary">Loading...</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
