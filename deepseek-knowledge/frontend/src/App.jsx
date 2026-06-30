import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import { ToastContainer } from 'react-hot-toast'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import VideoGenerationPage from './pages/VideoGenerationPage'
import VideoStatusPage from './pages/VideoStatusPage'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#0a0a0a',
      paper: '#111111',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/generate" element={<VideoGenerationPage />} />
                <Route path="/videos/:id" element={<VideoStatusPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </Router>
        <ToastContainer
          position="top-right"
          toastOptions={{
            style: {
              background: '#111',
              color: '#fff',
              border: '1px solid #333',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App