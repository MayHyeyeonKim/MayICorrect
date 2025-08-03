import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import { AccountCircle, Dashboard, Logout, Login } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogin: () => void;
  onLogout: () => void;
}

const Navigation = ({ isLoggedIn, userName, onLogin, onLogout }: NavigationProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    handleClose();
  };

  const handleHome = () => {
    navigate('/');
    handleClose();
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
    handleClose();
  };

  return (
    <AppBar position="static" sx={{ background: 'rgba(214, 48, 49, 0.9)', backdropFilter: 'blur(10px)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleHome}>
          <img 
            src="/MayICorrectLogo.png" 
            alt="Logo" 
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'cover',
              borderRadius: '50%',
              marginRight: '12px'
            }}
          />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            May I Correct?
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {isLoggedIn ? (
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleDashboard}>
                <Dashboard sx={{ mr: 1 }} />
                대시보드
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                로그아웃
              </MenuItem>
            </Menu>
            <Typography variant="body2" sx={{ ml: 1, display: { xs: 'none', sm: 'inline' } }}>
              안녕하세요, {userName}님!
            </Typography>
          </div>
        ) : (
          <Button
            color="inherit"
            onClick={onLogin}
            startIcon={<Login />}
            sx={{
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              px: 3
            }}
          >
            로그인
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
