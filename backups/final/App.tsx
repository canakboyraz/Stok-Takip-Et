import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import InventoryIcon from '@mui/icons-material/Inventory';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';

// Components
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockMovements from './pages/StockMovements';
import Categories from './pages/Categories';
import BulkStockOut from './pages/BulkStockOut';
import ProjectSelection from './pages/ProjectSelection';

// Supabase
import { supabase } from './lib/supabase';

// Context
import { ProjectProvider } from './utils/projectContext';

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);

      // Eğer requireProject true ise ve seçili proje yoksa, proje seçim sayfasına yönlendir
      if (requireProject) {
        const currentProjectId = localStorage.getItem('currentProjectId');
        setHasProject(!!currentProjectId);
      }
    };

    checkAuth();
  }, [requireProject]);

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

  // Eğer proje gerekli ve seçili proje yoksa proje seçimine yönlendir
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
            <Route
              path="/projects"
              element={
                <PrivateRoute requireProject={false}>
                  <ProjectSelection />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/products"
              element={
                <PrivateRoute>
                  <Products />
                </PrivateRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <PrivateRoute>
                  <Categories />
                </PrivateRoute>
              }
            />
            <Route
              path="/stock-movements"
              element={
                <PrivateRoute>
                  <StockMovements />
                </PrivateRoute>
              }
            />
            <Route
              path="/bulk-stock-out"
              element={
                <PrivateRoute>
                  <BulkStockOut />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ProjectProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 