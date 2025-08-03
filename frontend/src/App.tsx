import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Typography, Box } from '@mui/material';
import Navigation from './components/Navigation';
import LoginDialog from './components/LoginDialog';
import Dashboard from './components/Dashboard';
import EnglishTutor from './components/EnglishTutor';

const theme = createTheme({
  palette: {
    primary: {
      main: '#d63031',
      light: '#ff6659',
      dark: '#9a0007',
    },
    secondary: {
      main: '#fab1a0',
      light: '#ffcab9',
      dark: '#c68069',
    },
    background: {
      default: '#fff9f5',
    },
    error: {
      main: '#d63031',
    },
    success: {
      main: '#00b894',
    },
    info: {
      main: '#fab1a0',
    },
    warning: {
      main: '#fdcb6e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    if (username === 'demo' && password === 'demo123') {
      setIsLoggedIn(true);
      setUserName(username);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
  };

  const handleOpenLogin = () => {
    setLoginDialogOpen(true);
  };

  const handleCloseLogin = () => {
    setLoginDialogOpen(false);
  };

  const HomePage = () => (
    <Box>
      <Container maxWidth="md">
        <Box textAlign="center" color="white" mb={4}>
          <Box mb={2}>
            <img 
              src="/MayICorrectLogo.png" 
              alt="May I Correct? Logo" 
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '50%',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                border: '3px solid rgba(255,255,255,0.3)'
              }}
            />
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                mt: 2, 
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '1px'
              }}
            >
              May I Correct?
            </Typography>
          </Box>
          <Typography variant="h6">
            영어 회화 교정 도우미 - Korean to English Conversation Helper
          </Typography>
        </Box>
        <EnglishTutor />
      </Container>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh' }}>
          <Navigation 
            isLoggedIn={isLoggedIn}
            userName={userName}
            onLogin={handleOpenLogin}
            onLogout={handleLogout}
          />
          
          <Box
            sx={{
              minHeight: 'calc(100vh - 64px)',
              background: 'linear-gradient(315deg, #fdcb6e 0%, #ffeaa7 25%, #fab1a0 60%, #e17055 85%, #d63031 100%)',
              py: 4,
            }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route 
                path="/dashboard" 
                element={
                  isLoggedIn ? (
                    <Dashboard userName={userName} />
                  ) : (
                    <Container maxWidth="md">
                      <Box textAlign="center" color="white" py={8}>
                        <Typography variant="h4" gutterBottom>
                          🔒 로그인이 필요합니다
                        </Typography>
                        <Typography variant="body1">
                          대시보드를 이용하려면 먼저 로그인해주세요.
                        </Typography>
                      </Box>
                    </Container>
                  )
                } 
              />
            </Routes>
          </Box>

          <LoginDialog 
            open={loginDialogOpen}
            onClose={handleCloseLogin}
            onLogin={handleLogin}
          />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
