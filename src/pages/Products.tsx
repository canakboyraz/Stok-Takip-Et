import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, Search as SearchIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types/database';
import { logActivity } from '../lib/activityLogger';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    code: '',
    category_id: 0,
    price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'warning' | 'info' | 'success'
  });
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showStockZero, setShowStockZero] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        console.error('Proje ID bulunamadı');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('project_id', currentProjectId)
        .order('name');

      if (error) throw error;
      
      const productsWithCategory = data.map((product) => ({
        ...product,
        category_name: product.categories?.name,
      }));
      
      // Kategori adına göre sırala
      const sortedProducts = productsWithCategory.sort((a, b) => {
        const catA = a.category_name || '';
        const catB = b.category_name || '';
        return catA.localeCompare(catB);
      });
      
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        console.error('Proje ID bulunamadı');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setNewProduct({
        name: product.name,
        code: product.code,
        category_id: product.category_id,
        price: product.price,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
      });
      setOpen(true);
    } else {
      setEditingProduct(null);
      if (categories.length > 0) {
        setNewProduct({
          name: '',
          code: '',
          category_id: categories[0].id,
          price: 0,
          stock_quantity: 0,
          min_stock_level: 0,
        });
        setOpen(true);
      } else {
        alert('Lütfen önce bir kategori oluşturun!');
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      code: '',
      category_id: categories[0]?.id || 0,
      price: 0,
      stock_quantity: 0,
      min_stock_level: 0,
    });
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name?.trim() || !newProduct.category_id) return;

    try {
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        console.error('Proje ID bulunamadı');
        return;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            code: newProduct.code,
            category_id: newProduct.category_id,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            min_stock_level: newProduct.min_stock_level,
          })
          .eq('id', editingProduct.id)
          .eq('project_id', currentProjectId);

        if (error) throw error;
        
        // Etkinlik kaydı ekle
        try {
          await logActivity(
            'product_update',
            `Ürün güncellendi: ${newProduct.name} (Kategori: ${categories.find(c => c.id === newProduct.category_id)?.name})`,
            'product',
            editingProduct.id
          );
        } catch (activityError) {
          console.error('❌ Etkinlik kaydı hatası (ürün güncellendi):', activityError);
        }
        
        setSnackbar({
          open: true,
          message: 'Ürün başarıyla güncellendi!',
          severity: 'success'
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            name: newProduct.name,
            code: newProduct.code,
            category_id: newProduct.category_id,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            min_stock_level: newProduct.min_stock_level,
            project_id: parseInt(currentProjectId),
          }]);

        if (error) throw error;
        
        // Etkinlik kaydı ekle
        try {
          await logActivity(
            'product_create',
            `Yeni ürün eklendi: ${newProduct.name} (Kategori: ${categories.find(c => c.id === newProduct.category_id)?.name})`,
            'product',
            null
          );
        } catch (activityError) {
          console.error('❌ Etkinlik kaydı hatası (ürün eklendi):', activityError);
        }
        
        setSnackbar({
          open: true,
          message: 'Ürün başarıyla eklendi!',
          severity: 'success'
        });
      }

      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({
        open: true,
        message: 'Ürün kaydedilirken hata oluştu!',
        severity: 'error'
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        setIsDeleting(id);
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Etkinlik kaydı ekle (ürün adını önceden al)
        try {
          const productToDelete = products.find(p => p.id === id);
          if (productToDelete) {
            await logActivity(
              'product_delete',
              `Ürün silindi: ${productToDelete.name} (Kategori: ${productToDelete.category_name})`,
              'product',
              id
            );
          }
        } catch (activityError) {
          console.error('❌ Etkinlik kaydı hatası (ürün silindi):', activityError);
        }
        
        setSnackbar({
          open: true,
          message: 'Ürün başarıyla silindi!',
          severity: 'success'
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setSnackbar({
          open: true,
          message: 'Ürün silinirken hata oluştu!',
          severity: 'error'
        });
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleToggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filtrelenmiş ürünler
  const displayProducts = products
    .filter(product => showStockZero ? true : product.stock_quantity > 0)
    .filter(product => 
      searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Kategoriye göre gruplandırılmış ürünler
  const productsByCategory = categories
    .map(category => ({
      category,
      products: displayProducts.filter(product => product.category_id === category.id)
    }))
    .filter(group => group.products.length > 0);

  // Stok tükenen ürünler
  const stockoutProducts = products.filter(product => product.stock_quantity === 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ürünler
        </Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Yeni Ürün Ekle
        </Button>
      </Box>

      {/* Arama kutusu */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ürün adı veya kategori ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Stok tükenen ürünler uyarısı */}
      {stockoutProducts.length > 0 && !showStockZero && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            borderLeft: '4px solid',
            borderColor: 'warning.main',
            backgroundColor: 'rgba(255, 152, 0, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" color="warning.main" gutterBottom>
                ⚠️ Stok Tükenen Ürünler ({stockoutProducts.length})
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {stockoutProducts.map(p => p.name).slice(0, 5).join(', ')}
                {stockoutProducts.length > 5 && ` ve ${stockoutProducts.length - 5} ürün daha...`}
              </Typography>
              <Button
                variant="contained" 
                size="small" 
                color="warning"
                onClick={() => setShowStockZero(true)}
              >
                Tükenen Ürünleri Göster
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Kategorilere göre accordion listesi */}
      {productsByCategory.length > 0 ? (
        productsByCategory.map(({ category, products }) => (
          <Accordion 
            key={category.id} 
            expanded={expandedCategories.includes(category.id)}
            onChange={() => handleToggleCategory(category.id)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {category.name}
                </Typography>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {products.length} ürün
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ürün Adı</TableCell>
                      <TableCell>Kod</TableCell>
                      <TableCell align="right">Fiyat</TableCell>
                      <TableCell align="right">Stok</TableCell>
                      <TableCell align="right">Min. Stok</TableCell>
                      <TableCell align="center">İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow 
                        key={product.id}
                        sx={{
                          backgroundColor: product.stock_quantity === 0 ? 'rgba(244, 67, 54, 0.1)' :
                                          product.stock_quantity <= (product.min_stock_level || 0) ? 'rgba(255, 152, 0, 0.1)' :
                                          'inherit'
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                            {product.stock_quantity === 0 && (
                              <Typography variant="caption" color="error">
                                Stok tükendi
                              </Typography>
                            )}
                            {product.stock_quantity > 0 && product.stock_quantity <= (product.min_stock_level || 0) && (
                              <Typography variant="caption" color="warning.main">
                                Düşük stok
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell align="right">{product.price?.toFixed(2)} ₺</TableCell>
                        <TableCell align="right">
                          <Typography
                            color={product.stock_quantity === 0 ? 'error' : 
                                   product.stock_quantity <= (product.min_stock_level || 0) ? 'warning.main' : 
                                   'inherit'}
                            fontWeight={product.stock_quantity <= (product.min_stock_level || 0) ? 'bold' : 'normal'}
                          >
                            {product.stock_quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{product.min_stock_level}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(product)}
                            disabled={isDeleting === product.id}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={isDeleting === product.id}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'Arama kriterlerine uygun ürün bulunamadı.' : 'Henüz ürün bulunmamaktadır.'}
          </Typography>
          {searchTerm && (
            <Button 
              variant="text" 
              color="primary" 
              onClick={() => setSearchTerm('')}
              sx={{ mt: 2 }}
            >
              Aramayı Temizle
            </Button>
          )}
        </Paper>
      )}

      {/* Stok durumu toggle */}
      {stockoutProducts.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant={showStockZero ? "contained" : "outlined"}
            onClick={() => setShowStockZero(!showStockZero)}
            color="warning"
          >
            {showStockZero ? 'Stokta Olanları Göster' : 'Tükenen Ürünleri Göster'}
          </Button>
        </Box>
      )}

      {/* Ürün Ekleme/Düzenleme Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ürün Adı"
            fullWidth
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Ürün Kodu"
            fullWidth
            value={newProduct.code}
            onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={newProduct.category_id}
              label="Kategori"
              onChange={(e) => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Fiyat"
            type="number"
            fullWidth
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Stok Miktarı"
            type="number"
            fullWidth
            value={newProduct.stock_quantity}
            onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Minimum Stok Seviyesi"
            type="number"
            fullWidth
            value={newProduct.min_stock_level}
            onChange={(e) => setNewProduct({ ...newProduct, min_stock_level: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSaveProduct} variant="contained">
            {editingProduct ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Products;