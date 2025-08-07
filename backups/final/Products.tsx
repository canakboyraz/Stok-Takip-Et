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
  Snackbar,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types/database';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category_id: 0,
    price: 0,
    stock_quantity: 0,
    expiry_date: null,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'error' | 'warning' | 'info' | 'success'
  });
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            id
          )
        `)
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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
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
        category_id: product.category_id,
        price: product.price,
        stock_quantity: product.stock_quantity,
        expiry_date: product.expiry_date,
      });
      setOpen(true);
    } else {
      setEditingProduct(null);
      if (categories.length > 0) {
        setNewProduct({
          name: '',
          category_id: categories[0].id,
          price: 0,
          stock_quantity: 0,
          expiry_date: null,
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
      category_id: categories[0]?.id || 0,
      price: 0,
      stock_quantity: 0,
      expiry_date: null,
    });
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name?.trim() || !newProduct.category_id) return;

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            category_id: newProduct.category_id,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            expiry_date: newProduct.expiry_date,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            name: newProduct.name,
            category_id: newProduct.category_id,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            expiry_date: newProduct.expiry_date,
          }]);

        if (error) throw error;
      }

      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve ürünle ilgili TÜM stok hareketleri de silinecektir!')) {
      try {
        // Silme başladığında UI'da göster
        setIsDeleting(id);
        console.log(`Ürün silme işlemi başlatıldı: ID=${id}`);
        
        // Silinecek ürünü kontrol et
        const { data: productCheck, error: checkError } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', id)
          .single();
          
        if (checkError) {
          console.error('Ürün kontrol hatası:', checkError);
          throw checkError;
        }
        
        if (!productCheck) {
          setSnackbar({
            open: true,
            message: 'Silinecek ürün bulunamadı.',
            severity: 'error'
          });
          setIsDeleting(null);
          return;
        }
        
        const productName = productCheck.name;
        console.log('Silinecek ürün:', productCheck);
        
        // Doğrudan ürünü silme
        try {
          console.log('Ürün siliniyor...');
          const { error: deleteError, data: deleteData } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select();

          console.log('Silme yanıtı:', deleteData);
          
          if (deleteError) {
            console.error('Ürün silme hatası:', deleteError);
            
            // Eğer hata yabancı anahtar kısıtlaması ise, stok hareketlerini silmeye çalışalım
            if (deleteError.message.includes('foreign key') || deleteError.code === '23503') {
              console.log('Yabancı anahtar kısıtlaması tespit edildi. Önce stok hareketleri siliniyor...');
              
              const { error: moveDeleteError } = await supabase
                .from('stock_movements')
                .delete()
                .eq('product_id', id);
                
              if (moveDeleteError) {
                console.error('Stok hareketleri silme hatası:', moveDeleteError);
                throw new Error(`Stok hareketleri silinemedi: ${moveDeleteError.message}`);
              }
              
              // Tekrar ürünü silme denemesi
              console.log('Tekrar ürünü silme denemesi yapılıyor...');
              const { error: retryError } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
                
              if (retryError) {
                console.error('İkinci silme denemesi başarısız:', retryError);
                throw new Error(`İkinci silme denemesi başarısız: ${retryError.message}`);
              }
            } else {
              throw deleteError;
            }
          }
          
          console.log('Ürün başarıyla silindi.');
          
          // Ürünü UI'dan kaldır
          setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
          
          setSnackbar({
            open: true,
            message: `"${productName}" ürünü başarıyla silindi.`,
            severity: 'success'
          });
        } catch (deleteError) {
          console.error('Ürün silme sırasında hata:', deleteError);
          setSnackbar({
            open: true,
            message: `Ürün silinemedi. Hata: ${(deleteError as Error).message}`,
            severity: 'error'
          });
        }
        
        // Silme işleminden sonra isDeleting'i temizle
        setIsDeleting(null);
      } catch (error) {
        // Genel hata durumunda isDeleting'i temizle
        setIsDeleting(null);
        console.error('Ürün silme işlemi sırasında hata:', error);
        setSnackbar({
          open: true,
          message: 'Ürün silinirken bir hata oluştu: ' + (error as Error).message,
          severity: 'error'
        });
      }
    }
  };

  const getExpiryDateColor = (expiryDate: string | null) => {
    if (!expiryDate) return 'inherit';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'error.main'; // Kırmızı
    if (diffDays <= 14) return 'warning.main'; // Sarı
    return 'inherit';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ürünler</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Yeni Ürün Ekle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: 'primary.light', 
              '& th': { 
                color: 'primary.contrastText', 
                fontWeight: 'bold' 
              } 
            }}>
              <TableCell>Ürün Adı</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell align="right">Fiyat</TableCell>
              <TableCell align="right">Stok Miktarı</TableCell>
              <TableCell>Son Kullanım Tarihi</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => {
              const categoryProducts = products.filter(
                (product) => product.category_id === category.id
              );

              if (categoryProducts.length === 0) return null;

              return (
                <React.Fragment key={category.id}>
                  <TableRow sx={{ 
                    backgroundColor: 'primary.main', 
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}>
                    <TableCell colSpan={6}>
                      <Typography variant="h6" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        padding: '8px 0'
                      }}>
                        {category.name}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {categoryProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      sx={{
                        display: isDeleting === product.id ? 'none' : 'table-row',
                        backgroundColor: isDeleting === product.id ? 'error.light' : 'inherit',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell align="right">{product.price.toLocaleString('tr-TR')} TL</TableCell>
                      <TableCell align="right">{product.stock_quantity}</TableCell>
                      <TableCell sx={{ color: getExpiryDateColor(product.expiry_date) }}>
                        {formatDate(product.expiry_date)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(product)}
                          disabled={isDeleting !== null}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={isDeleting !== null}
                        >
                          {isDeleting === product.id ? '...' : <DeleteIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
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
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={newProduct.category_id}
              label="Kategori"
              onChange={(e) =>
                setNewProduct({ ...newProduct, category_id: Number(e.target.value) })
              }
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
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: Number(e.target.value) })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Stok Miktarı"
            type="number"
            fullWidth
            value={newProduct.stock_quantity}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                stock_quantity: Number(e.target.value),
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Son Kullanım Tarihi"
            type="date"
            fullWidth
            value={newProduct.expiry_date || ''}
            onChange={(e) =>
              setNewProduct({ ...newProduct, expiry_date: e.target.value })
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSaveProduct} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Products; 