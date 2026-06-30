import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Generate Video', path: '/generate' },
  { label: 'Admin', path: '/admin' },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ background: '#1a1a2e' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            History of the Internet
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navItems.map(item => (
              <Button key={item.path} color="inherit" onClick={() => navigate(item.path)}
                sx={{ borderBottom: location.pathname === item.path ? '2px solid #2196f3' : '2px solid transparent', borderRadius: 0 }}>
                {item.label}
              </Button>
            ))}
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Outlet />
      </Container>
      <Box component="footer" sx={{ py: 3, textAlign: 'center', color: '#666', borderTop: '1px solid #222' }}>
        <Typography variant="body2">History of the Internet — AI-Powered Documentary Generator</Typography>
      </Box>
    </Box>
  )
}
