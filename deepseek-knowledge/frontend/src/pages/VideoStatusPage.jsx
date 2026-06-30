import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Chip, LinearProgress } from '@mui/material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'
const API = axios.create({ baseURL: API_URL })

const statusColors = { pending: 'warning', queued: 'info', processing: 'primary', completed: 'success', failed: 'error' }

export default function VideoStatusPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [job, setJob] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get(`/videos/jobs/${id}`,
          { headers: { Authorization: `Bearer ${token}` } })
        setJob(data)
      } catch { setJob({ status: 'failed', error_message: 'Job not found' }) }
    }
    fetch()
    const interval = setInterval(fetch, 5000)
    return () => clearInterval(interval)
  }, [id, token])

  if (!job) return <LinearProgress />

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Video Job Status</Typography>
      <Card sx={{ background: '#111', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6">{job.title}</Typography>
          <Chip label={job.status} color={statusColors[job.status] || 'default'} sx={{ mt: 1, mb: 2 }} />
          {job.status === 'processing' && <LinearProgress sx={{ mb: 2 }} />}
          <Typography variant="body2" color="text.secondary">Job ID: {job.celery_task_id || id}</Typography>
          {job.error_message && <Typography color="error" sx={{ mt: 1 }}>{job.error_message}</Typography>}
        </CardContent>
      </Card>
    </Box>
  )
}
