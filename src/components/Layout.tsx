import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  Divider,
  Menu,
  MenuItem,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  CompareArrows as CompareArrowsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  FolderOpen as FolderOpenIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Event as EventIcon,
  Restaurant as RestaurantIcon,
  MenuBook as MenuBookIcon,
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Project } from '../types/database';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tüm state'leri başta tanımlayalım - Mobile'da kapalı, desktop'ta açık başlasın
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [stockMenuOpen, setStockMenuOpen] = useState(false);
  const [expenseMenuOpen, setExpenseMenuOpen] = useState(false);
  const [personnelMenuOpen, setPersonnelMenuOpen] = useState(false);
  const [menuPlanningOpen, setMenuPlanningOpen] = useState(false);
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const projectMenuOpen = Boolean(projectMenuAnchor);
  const userMenuOpen = Boolean(userMenuAnchor);

  // useEffect sadece mount'ta çalışsın
  useEffect(() => {
    loadUserInfo();
    loadCurrentProject();
    
    // Desktop'ta başlangıçta drawer'ı aç
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setDrawerOpen(true);
      } else {
        setDrawerOpen(false);
      }
    };
    
    // İlk yüklemede kontrol et
    handleResize();
    
    // Resize event listener ekle
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Boş dependency array

  const loadUserInfo = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUserEmail(data.user.email || null);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi alma hatası:', error);
    }
  };

  const loadCurrentProject = async () => {
    try {
      const projectId = localStorage.getItem('currentProjectId');
      
      if (!projectId) {
        setCurrentProject(null);
        navigate('/projects');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        navigate('/');
        return;
      }

      // Proje bilgisini getir
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        // Paylaşılan projeleri kontrol et
        const { data: sharedData, error: sharedError } = await supabase
          .from('project_users_view')
          .select('*')
          .eq('project_id', projectId)
          .single();
          
        if (!sharedError && sharedData) {
          const tempProject: Project = {
            id: parseInt(projectId),
            name: sharedData.project_name || `Proje #${projectId}`,
            user_id: userData.user.id,
            description: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setCurrentProject(tempProject);
        } else {
          // Geçici proje oluştur
          const tempProject: Project = {
            id: parseInt(projectId),
            name: `Proje #${projectId}`,
            user_id: userData.user.id,
            description: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setCurrentProject(tempProject);
        }
      } else {
        setCurrentProject(data);
      }
    } catch (error: any) {
      console.error('Proje yükleme hatası:', error);
      
      const projectId = localStorage.getItem('currentProjectId');
      if (projectId) {
        const tempProject: Project = {
          id: parseInt(projectId),
          name: `Proje #${projectId}`,
          user_id: 'unknown',
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCurrentProject(tempProject);
      }
      
      setAlert({
        show: true,
        message: 'Proje bilgileri yüklenirken hata oluştu.',
        type: 'error'
      });
    }
  };

  // Event handler'lar
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      localStorage.removeItem('currentProjectId');
      
      setAlert({
        show: true,
        message: 'Başarıyla çıkış yapıldı',
        type: 'success'
      });
      
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      setAlert({
        show: true,
        message: 'Çıkış yaparken hata oluştu: ' + error.message,
        type: 'error'
      });
    }
  };

  const handleProjectMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProjectMenuAnchor(event.currentTarget);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchor(null);
  };

  const handleChangeProject = () => {
    handleProjectMenuClose();
    setCurrentProject(null);
    localStorage.removeItem('currentProjectId');
    navigate('/projects');
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Toggle fonksiyonları
  const toggleStockMenu = () => {
    setStockMenuOpen(!stockMenuOpen);
  };

  const toggleExpenseMenu = () => {
    setExpenseMenuOpen(!expenseMenuOpen);
  };

  const togglePersonnelMenu = () => {
    setPersonnelMenuOpen(!personnelMenuOpen);
  };

  const toggleMenuPlanning = () => {
    setMenuPlanningOpen(!menuPlanningOpen);
  };

  // Menü öğeleri
  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  ];

  const stockSubMenuItems = [
    { text: 'Ürünler', icon: <InventoryIcon />, path: '/products' },
    { text: 'Kategoriler', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Ürün Şablonları', icon: <CategoryIcon />, path: '/product-templates' },
    { text: 'Stok Hareketleri', icon: <CompareArrowsIcon />, path: '/stock-movements' },
    { text: 'Toplu Stok Çıkış', icon: <ShoppingCartIcon />, path: '/bulk-stock-out' },
  ];

  const expenseSubMenuItems = [
    { text: 'Gider Ekle', icon: <AttachMoneyIcon />, path: '/expense-add' },
    { text: 'Gider Listesi', icon: <ReceiptIcon />, path: '/expense-list' },
  ];

  const personnelSubMenuItems = [
    { text: 'Personel Ekle', icon: <PersonAddIcon />, path: '/personnel-add' },
    { text: 'Personel Listesi', icon: <PeopleIcon />, path: '/personnel-list' },
    { text: 'Personel Puantaj', icon: <EventIcon />, path: '/personnel-timesheet' },
  ];

  const menuPlanningSubMenuItems = [
    { text: 'Tarifler', icon: <RestaurantIcon />, path: '/recipes' },
    { text: 'Menüler', icon: <MenuBookIcon />, path: '/menus' },
    { text: 'Menü Tüketimi', icon: <ShoppingCartIcon />, path: '/menu-consumption' },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1 }}>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Stok Takip Menü
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      
      {/* Proje Bilgisi */}
      {currentProject && (
        <Box sx={{ p: 2, mb: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<FolderOpenIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleProjectMenuOpen}
            sx={{ 
              textAlign: 'left', 
              justifyContent: 'flex-start',
              textTransform: 'none',
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {currentProject.name}
          </Button>
          <Menu
            anchorEl={projectMenuAnchor}
            open={projectMenuOpen}
            onClose={handleProjectMenuClose}
          >
            <MenuItem onClick={handleChangeProject}>
              <ListItemIcon>
                <FolderIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Proje Değiştir</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      )}
      <Divider />
      
      <List>
        {/* Dashboard menü öğesi */}
        {mainMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (window.innerWidth < 600) {
                setDrawerOpen(false);
              }
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}

        {/* Stok Takip menü başlığı */}
        <ListItem 
          button 
          onClick={toggleStockMenu}
          sx={{ 
            bgcolor: stockMenuOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' }
          }}
        >
          <ListItemIcon>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText primary="Stok Takip" />
          {stockMenuOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        </ListItem>

        {/* Stok Takip alt menüsü */}
        {stockMenuOpen && (
          <Box sx={{ pl: 2 }}>
            {stockSubMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 600) {
                    setDrawerOpen(false);
                  }
                }}
                selected={location.pathname === item.path}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </Box>
        )}

        {/* Diğer Giderler menü başlığı */}
        <ListItem 
          button 
          onClick={toggleExpenseMenu}
          sx={{ 
            bgcolor: expenseMenuOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' }
          }}
        >
          <ListItemIcon>
            <AttachMoneyIcon />
          </ListItemIcon>
          <ListItemText primary="Diğer Giderler" />
          {expenseMenuOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        </ListItem>

        {/* Diğer Giderler alt menüsü */}
        {expenseMenuOpen && (
          <Box sx={{ pl: 2 }}>
            {expenseSubMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 600) {
                    setDrawerOpen(false);
                  }
                }}
                selected={location.pathname === item.path}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </Box>
        )}

        {/* Personel menü başlığı */}
        <ListItem 
          button 
          onClick={togglePersonnelMenu}
          sx={{ 
            bgcolor: personnelMenuOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' }
          }}
        >
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Personel" />
          {personnelMenuOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        </ListItem>

        {/* Personel alt menüsü */}
        {personnelMenuOpen && (
          <Box sx={{ pl: 2 }}>
            {personnelSubMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 600) {
                    setDrawerOpen(false);
                  }
                }}
                selected={location.pathname === item.path}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </Box>
        )}

        {/* Menü Planlama menü başlığı */}
        <ListItem 
          button 
          onClick={toggleMenuPlanning}
          sx={{ 
            bgcolor: menuPlanningOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' }
          }}
        >
          <ListItemIcon>
            <MenuBookIcon />
          </ListItemIcon>
          <ListItemText primary="Menü Planlama" />
          {menuPlanningOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        </ListItem>

        {/* Menü Planlama alt menüsü */}
        {menuPlanningOpen && (
          <Box sx={{ pl: 2 }}>
            {menuPlanningSubMenuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 600) {
                    setDrawerOpen(false);
                  }
                }}
                selected={location.pathname === item.path}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </Box>
        )}

        {/* Etkinlik Kayıtları */}
        <ListItem 
          button 
          component={RouterLink} 
          to="/activities"
          sx={{
            bgcolor: location.pathname === '/activities' ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
          }}
        >
          <ListItemIcon>
            <TimelineIcon />
          </ListItemIcon>
          <ListItemText primary="Etkinlik Kayıtları" />
        </ListItem>

        <Divider sx={{ my: 1 }} />
        <ListItem button onClick={() => {
          handleLogout();
          if (window.innerWidth < 600) {
            setDrawerOpen(false);
          }
        }}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Çıkış Yap" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { 
            xs: '100%',
            sm: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' 
          },
          ml: { 
            xs: 0,
            sm: drawerOpen ? `${drawerWidth}px` : 0 
          },
          transition: 'width 0.3s ease, margin-left 0.3s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Stok Takip {currentProject ? ` - ${currentProject.name}` : ''}
          </Typography>
          
          {userEmail && (
            <Box display="flex" alignItems="center">
              <Chip
                avatar={<Avatar><PersonIcon /></Avatar>}
                label={userEmail}
                variant="outlined"
                color="primary"
                onClick={handleUserMenuOpen}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)', 
                  '& .MuiChip-avatar': {
                    bgcolor: 'primary.dark',
                    color: 'white'
                  }
                }}
              />
              <Menu
                anchorEl={userMenuAnchor}
                open={userMenuOpen}
                onClose={handleUserMenuClose}
              >
                <MenuItem onClick={handleChangeProject}>
                  <ListItemIcon>
                    <FolderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Proje Değiştir</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Çıkış Yap</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            transition: 'transform 0.3s ease',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            transition: 'transform 0.3s ease',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: '100%',
          marginTop: '64px',
          marginLeft: { 
            xs: 0, 
            sm: drawerOpen ? `${drawerWidth}px` : 0 
          },
          transition: 'margin-left 0.3s ease',
        }}
      >
        {children}
      </Box>
      
      <Snackbar 
        open={alert.show} 
        autoHideDuration={6000} 
        onClose={() => setAlert({...alert, show: false})}
      >
        <Alert onClose={() => setAlert({...alert, show: false})} severity={alert.type}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Layout; 