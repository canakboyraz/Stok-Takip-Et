import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// Components
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockMovements from './pages/StockMovements';
import Categories from './pages/Categories';
import BulkStockOut from './pages/BulkStockOut';
import ProjectSelection from './pages/ProjectSelection';
import ExpenseAdd from './pages/ExpenseAdd';
import ExpenseList from './pages/ExpenseList';
import PersonnelAdd from './pages/PersonnelAdd';
import PersonnelList from './pages/PersonnelList';
import PersonnelTimesheet from './pages/PersonnelTimesheet';
import Recipes from './pages/Recipes';
import RecipeAdd from './pages/RecipeAdd';
import Menus from './pages/Menus';
import MenuAdd from './pages/MenuAdd';
import MenuConsumption from './pages/MenuConsumption';
import MenuConsumptionUndo from './pages/MenuConsumptionUndo';

import ProductTemplates from './pages/ProductTemplates';
import Activities from './pages/Activities';
import ActivityLog from './pages/ActivityLog';

// Supabase
import { supabase } from './lib/supabase';

// Context
import { ProjectProvider } from './utils/projectContext';

// Auth callback fonksiyonu
const AuthCallback = () => {
  const [message, setMessage] = useState<string>('Doğrulama işlemi yapılıyor...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setMessage('Doğrulama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
          return;
        }
        
        if (data && data.session) {
          setMessage('Doğrulama başarılı! Yönlendiriliyorsunuz...');
          setTimeout(() => navigate('/projects'), 2000);
        } else {
          setMessage('Oturum bilgisi bulunamadı. Lütfen giriş yapın.');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        setMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    };
    
    handleAuthCallback();
  }, [navigate]);
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6">{message}</Typography>
    </Box>
  );
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

type PrivateRouteProps = {
  children: React.ReactNode;
  requireProject?: boolean;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireProject = true }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasProject, setHasProject] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          setError(authError.message);
          setIsAuthenticated(false);
          return;
        }
        
        const isAuth = !!data.session;
        setIsAuthenticated(isAuth);

        if (requireProject) {
          const currentProjectId = localStorage.getItem('currentProjectId');
          
          if (currentProjectId) {
            try {
              const projectIdNum = parseInt(currentProjectId, 10);
              if (isNaN(projectIdNum)) {
                localStorage.removeItem('currentProjectId');
                setHasProject(false);
              } else {
                setHasProject(true);
              }
            } catch (e) {
              localStorage.removeItem('currentProjectId');
              setHasProject(false);
            }
          } else {
            setHasProject(false);
          }
        } else {
          setHasProject(true);
        }
      } catch (error) {
        setError(String(error));
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []); // Boş dependency array

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh'
      }}>
        <Typography variant="h6" color="error" gutterBottom>
          Hata Oluştu
        </Typography>
        <Typography variant="body1">{error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => window.location.href = '/'}
        >
          Giriş Sayfasına Dön
        </Button>
      </Box>
    );
  }

  if (isAuthenticated === null) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (requireProject && !hasProject) {
    return <Navigate to="/projects" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ProjectProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/projects" element={<PrivateRoute requireProject={false}><ProjectSelection /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="/stock-movements" element={<PrivateRoute><StockMovements /></PrivateRoute>} />
            <Route path="/bulk-stock-out" element={<PrivateRoute><BulkStockOut /></PrivateRoute>} />
            <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
            <Route path="/personnel-add" element={<PrivateRoute><PersonnelAdd /></PrivateRoute>} />
            <Route path="/personnel-edit/:id" element={<PrivateRoute><PersonnelAdd /></PrivateRoute>} />
            <Route path="/personnel-timesheet/:id" element={<PrivateRoute><PersonnelTimesheet /></PrivateRoute>} />
            <Route path="/product-templates" element={<PrivateRoute><ProductTemplates /></PrivateRoute>} />
            <Route path="/recipes" element={<PrivateRoute><Recipes /></PrivateRoute>} />
            <Route path="/recipe-add" element={<PrivateRoute><RecipeAdd /></PrivateRoute>} />
            <Route path="/recipe-edit/:id" element={<PrivateRoute><RecipeAdd /></PrivateRoute>} />
            <Route path="/menus" element={<PrivateRoute><Menus /></PrivateRoute>} />
            <Route path="/menu-add" element={<PrivateRoute><MenuAdd /></PrivateRoute>} />
            <Route path="/menu-edit/:id" element={<PrivateRoute><MenuAdd /></PrivateRoute>} />
            <Route path="/menu-consumption" element={<PrivateRoute><MenuConsumption /></PrivateRoute>} />
            <Route path="/menu-consumption-undo" element={<PrivateRoute><MenuConsumptionUndo /></PrivateRoute>} />
            
            {/* Etkinlik kayıtları sayfası */}
            <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
            <Route path="/activity-log" element={<PrivateRoute><ActivityLog /></PrivateRoute>} />
            
            {/* Gider sayfaları */}
            <Route path="/expense-add" element={<PrivateRoute><ExpenseAdd /></PrivateRoute>} />
            <Route path="/expense-list" element={<PrivateRoute><ExpenseList /></PrivateRoute>} />
            
            {/* Personel sayfaları */}
            <Route path="/personnel-list" element={<PrivateRoute><PersonnelList /></PrivateRoute>} />
            <Route path="/personnel-timesheet" element={<PrivateRoute><PersonnelTimesheet /></PrivateRoute>} />
          </Routes>
        </ProjectProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 