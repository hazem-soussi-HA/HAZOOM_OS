import { useState } from 'react'
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
      <Card sx={{ maxWidth: 400, width: '100%', background: '#111', border: '1px solid #333' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>Sign In</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { background: '#1a1a1a' } }} required />
            <TextField fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { background: '#1a1a1a' } }} required />
            <Button fullWidth type="submit" variant="contained" size="large">Sign In</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
