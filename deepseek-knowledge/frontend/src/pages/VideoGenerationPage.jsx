import { useState } from 'react'
import { Box, Card, CardContent, TextField, Button, Typography, Alert, LinearProgress, Chip, Stack } from '@mui/material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

export default function VideoGenerationPage() {
  const { token } = useAuth()
  const [title, setTitle] = useState('')
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post('/videos/generate',
        { title, script, template: 'nano', style: 'optimized' },
        { headers: { Authorization: `Bearer ${token}` } })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Nano Video Generator</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter a title and script. The engine splits your text into segments,
        generates narration via gTTS, creates styled frames, and composes
        everything into an optimized MP4 using FFmpeg.
      </Typography>

      <Card sx={{ background: '#111', border: '1px solid #333', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Title" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. The Birth of the Internet"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { background: '#1a1a1a' } }} required />
            <TextField fullWidth label="Script" multiline rows={6} value={script} onChange={e => setScript(e.target.value)}
              placeholder="Write a short script about your topic. The system will split it into narrated scenes."
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { background: '#1a1a1a' } }} required
              helperText="One or more sentences — each becomes a scene with narration" />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Generating audio, frames, and composing video...
                </Typography>
              </Box>
            )}
            <Button type="submit" variant="contained" disabled={loading || !script.trim() || !title.trim()}
              sx={{ py: 1.2 }}>
              {loading ? 'Generating...' : 'Generate Nano Documentary'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {result && (
        <Card sx={{ background: '#111', border: '1px solid #2196f3' }}>
          <CardContent>
            <Alert severity="success" sx={{ mb: 2 }}>Video generated successfully</Alert>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <Chip label={`${result.duration_seconds || "?"}s`} size="small" variant="outlined" />
              <Chip label={`${result.size_kb || "?"} KB`} size="small" variant="outlined" />
              <Chip label={`${result.segments || "?"} scenes`} size="small" variant="outlined" />
              <Chip label={result.job_id} size="small" variant="outlined" />
            </Stack>
            {result.download_url && (
              <Box>
                <video controls width="100%" style={{ maxWidth: 640, borderRadius: 8, border: '1px solid #333' }}>
                  <source src={result.download_url} type="video/mp4" />
                </video>
                <Box sx={{ mt: 2 }}>
                  <Button variant="outlined" color="primary" href={result.download_url} target="_blank">
                    Download MP4
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
