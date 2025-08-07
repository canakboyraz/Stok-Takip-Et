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

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category_id: 0,
    price: undefined,
    stock_quantity: undefined,
    expiry_date: null,
    brand: '',
    reception_date: null
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
  const [showExpiryPanel, setShowExpiryPanel] = useState(true);
  const [expandExpiryPanel, setExpandExpiryPanel] = useState(false);
  const [showStockoutPanel, setShowStockoutPanel] = useState(true);
  const [expandStockoutPanel, setExpandStockoutPanel] = useState(false);

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
        brand: product.brand || '',
        reception_date: product.reception_date || null
      });
      setOpen(true);
    } else {
      setEditingProduct(null);
      if (categories.length > 0) {
        setNewProduct({
          name: '',
          category_id: categories[0].id,
          price: undefined,
          stock_quantity: undefined,
          expiry_date: null,
          brand: '',
          reception_date: null
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
      price: undefined,
      stock_quantity: undefined,
      expiry_date: null,
      brand: '',
      reception_date: null
    });
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name?.trim() || !newProduct.category_id) return;

    try {
      console.log("Kaydedilecek ürün verisi:", newProduct);
      
      if (editingProduct) {
        console.log("Ürün güncelleniyor, ID:", editingProduct.id);
        const { data, error } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            category_id: newProduct.category_id,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            expiry_date: newProduct.expiry_date,
            brand: newProduct.brand,
            reception_date: newProduct.reception_date
          })
          .eq('id', editingProduct.id)
          .select();

        console.log("Güncelleme yanıtı:", data);
        
        if (error) {
          console.error("Supabase güncelleme hatası:", error);
          throw error;
        }
      } else {
        console.log("Yeni ürün ekleniyor");
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: newProduct.name,
            category_id: newProduct.category_id,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            expiry_date: newProduct.expiry_date,
            brand: newProduct.brand,
            reception_date: newProduct.reception_date
          }])
          .select();
          
        console.log("Ekleme yanıtı:", data);
        
        if (error) {
          console.error("Supabase ekleme hatası:", error);
          throw error;
        }
      }

      setSnackbar({
        open: true,
        message: editingProduct ? 'Ürün başarıyla güncellendi.' : 'Yeni ürün başarıyla eklendi.',
        severity: 'success'
      });

      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Ürün kaydetme hatası:', error);
      setSnackbar({
        open: true,
        message: `İşlem sırasında bir hata oluştu: ${(error as any).message || 'Bilinmeyen hata'}`,
        severity: 'error'
      });
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
    
    if (diffDays <= 0) return 'error.dark'; // Süresi geçmiş
    if (diffDays <= 7) return 'error.main'; // Kritik - 1 hafta
    if (diffDays <= 14) return 'warning.main'; // Uyarı - 2 hafta
    if (diffDays <= 30) return 'info.main'; // Bilgi - 1 ay
    return 'inherit';
  };

  const getExpiryDateStyle = (expiryDate: string | null) => {
    if (!expiryDate) return {};
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return {
        color: 'error.dark',
        fontWeight: 'bold',
        padding: '4px 8px',
        backgroundColor: 'error.light',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'error.dark'
      };
    }
    
    if (diffDays <= 7) {
      return {
        color: 'error.main',
        fontWeight: 'bold',
        padding: '4px 8px',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: 'error.main'
      };
    }
    
    if (diffDays <= 14) {
      return {
        color: 'warning.dark',
        fontWeight: 'bold',
        padding: '4px 8px',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: '4px'
      };
    }
    
    if (diffDays <= 30) {
      return {
        color: 'info.main',
        padding: '4px 8px'
      };
    }
    
    return {};
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let prefix = '';
    if (diffDays <= 0) {
      prefix = '⚠️ Süresi Geçmiş! ';
    } else if (diffDays <= 7) {
      prefix = '⚠️ Kritik! ';
    } else if (diffDays <= 14) {
      prefix = '⚠ Dikkat: ';
    }
    
    return prefix + expiry.toLocaleDateString('tr-TR');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Son kullanım tarihi yaklaşan ürünleri bul
  const expiringProducts = products.filter(product => {
    if (!product.expiry_date) return false;
    
    const today = new Date();
    const expiry = new Date(product.expiry_date);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 14; // 14 gün veya daha az
  });

  // Stok miktarı sıfır olan ürünler
  const stockoutProducts = products.filter(product => product.stock_quantity === 0);

  // Görüntülenecek ürünler (stok 0 olanları ve arama sonuçlarını filtrele)
  const displayProducts = products
    .filter(product => showStockZero ? true : product.stock_quantity > 0)
    .filter(product => 
      searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Kategoriye göre gruplandırılmış ürünler
  const productsByCategory = categories.map(category => {
    return {
      category,
      products: displayProducts.filter(product => product.category_id === category.id)
    };
  }).filter(group => group.products.length > 0);

  // Süresi geçmiş ürünler
  const expiredProducts = expiringProducts.filter(p => {
    const today = new Date();
    const expiry = new Date(p.expiry_date!);
    return expiry < today;
  });

  // Kritik ürünler (7 gün veya daha az)
  const criticalProducts = expiringProducts.filter(p => {
    const today = new Date();
    const expiry = new Date(p.expiry_date!);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  // Uyarı ürünleri (14 gün veya daha az)
  const warningProducts = expiringProducts.filter(p => {
    const today = new Date();
    const expiry = new Date(p.expiry_date!);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7 && diffDays <= 14;
  });

  const handleToggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleExpandAll = () => {
    if (expandedCategories.length === productsByCategory.length) {
      setExpandedCategories([]);
    } else {
      setExpandedCategories(productsByCategory.map(group => group.category.id));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
        <Typography variant="h4">Ürünler</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            size="small"
            sx={{ flex: { xs: '1 0 auto', sm: 'none' } }}
            onClick={() => setExpandedCategories(productsByCategory.map(group => group.category.id))}
          >
            Tümünü Aç
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            sx={{ flex: { xs: '1 0 auto', sm: 'none' } }}
            onClick={() => setExpandedCategories([])}
          >
            Tümünü Kapat
          </Button>
          <Button 
            variant="contained" 
            size="small"
            sx={{ flex: { xs: '1 0 auto', sm: 'none' } }}
            onClick={() => handleOpenDialog()}
          >
            Yeni Ürün Ekle
          </Button>
        </Box>
      </Box>

      {/* Arama Filtresi */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ürün adı veya kategori ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
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
            )
          }}
        />
      </Paper>

      {/* Stok bildirimleri bölümü */}
      {showStockoutPanel && stockoutProducts.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1, sm: 2 },
            mb: 3,
            borderLeft: '4px solid',
            borderColor: 'error.main',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setExpandStockoutPanel(!expandStockoutPanel)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" color="error.main" gutterBottom sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                display: 'flex',
                alignItems: 'center'
              }}>
                ⚠️ Stok Uyarısı - Tükenen Ürünler
                <Box component="span" sx={{ ml: 'auto', fontSize: '1.2rem' }}>
                  {expandStockoutPanel ? '▼' : '▶'}
                </Box>
              </Typography>
              
              {expandStockoutPanel && (
                <>
                  <Box mb={1}>
                    <Typography variant="body1" color="error.main" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Stok Tükendi ({stockoutProducts.length}): 
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      maxHeight: { xs: '80px', sm: 'none' },
                      overflow: 'auto'
                    }}>
                      {stockoutProducts.map(p => p.name).join(', ')}
                    </Typography>
                  </Box>
                  
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation(); // Balonun kapanmasını engelle
                        setShowStockoutPanel(false);
                      }}
                    >
                      Kapat
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation(); // Balonun kapanmasını engelle
                        // Tükenen ürünleri göster
                        setShowStockZero(true);
                        // Panel'i kapat
                        setShowStockoutPanel(false);
                      }}
                    >
                      Tükenen Ürünleri Göster
                    </Button>
                  </Box>
                </>
              )}
            </Box>
            
            <IconButton 
              onClick={(e) => {
                e.stopPropagation(); // Balonun toggle olmasını engelle
                setShowStockoutPanel(false);
              }} 
              size="small"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Son kullanım tarihi uyarı paneli */}
      {showExpiryPanel && expiringProducts.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            p: { xs: 1, sm: 2 },
            mb: 3,
            borderLeft: '4px solid',
            borderColor: expiredProducts.length > 0 ? 'error.main' : 
                        criticalProducts.length > 0 ? 'warning.main' : 'info.main',
            backgroundColor: expiredProducts.length > 0 ? 'rgba(244, 67, 54, 0.1)' : 
                            criticalProducts.length > 0 ? 'rgba(255, 152, 0, 0.1)' : 
                            'rgba(3, 169, 244, 0.1)',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setExpandExpiryPanel(!expandExpiryPanel)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" 
                color={expiredProducts.length > 0 ? 'error.main' : 
                      criticalProducts.length > 0 ? 'warning.main' : 'info.main'} 
                gutterBottom
                sx={{ 
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {expiredProducts.length > 0 ? '⚠️ Süresi Geçmiş Ürünler' : 
                 criticalProducts.length > 0 ? '⚠ Son Kullanım Tarihi Yaklaşan Ürünler' : 
                 'ℹ️ Son Kullanma Tarihi Yakında Dolacak Ürünler'}
                <Box component="span" sx={{ ml: 'auto', fontSize: '1.2rem' }}>
                  {expandExpiryPanel ? '▼' : '▶'}
                </Box>
              </Typography>
              
              {expandExpiryPanel && (
                <>
                  {expiredProducts.length > 0 && (
                    <Box mb={1}>
                      <Typography variant="body1" color="error.main" fontWeight="bold">
                        Süresi Geçmiş ({expiredProducts.length}): 
                      </Typography>
                      <Typography variant="body2">
                        {expiredProducts.map(p => p.name).join(', ')}
                      </Typography>
                    </Box>
                  )}
                  
                  {criticalProducts.length > 0 && (
                    <Box mb={1}>
                      <Typography variant="body1" color="warning.dark" fontWeight="bold">
                        Kritik (7 gün) ({criticalProducts.length}): 
                      </Typography>
                      <Typography variant="body2">
                        {criticalProducts.map(p => p.name).join(', ')}
                      </Typography>
                    </Box>
                  )}
                  
                  {warningProducts.length > 0 && (
                    <Box mb={1}>
                      <Typography variant="body1" color="info.main" fontWeight="bold">
                        Yaklaşan (14 gün) ({warningProducts.length}): 
                      </Typography>
                      <Typography variant="body2">
                        {warningProducts.map(p => p.name).join(', ')}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
            
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                setShowExpiryPanel(false);
              }}
              size="small"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Kategorilere göre akordiyon listesi */}
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
                <Table size="small" sx={{ overflowX: 'auto' }}>
                  <TableHead>
                    <TableRow sx={{ 
                      backgroundColor: 'primary.light', 
                      '& th': { 
                        color: 'primary.contrastText', 
                        fontWeight: 'bold' 
                      } 
                    }}>
                      <TableCell>Ürün Adı</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Kategori</TableCell>
                      <TableCell align="right">Fiyat</TableCell>
                      <TableCell align="right">Stok</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Son Kul. Tar.</TableCell>
                      <TableCell align="right">İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => {
                      const isExpiringSoon = product.expiry_date && (() => {
                        const today = new Date();
                        const expiry = new Date(product.expiry_date);
                        const diffTime = expiry.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 14;
                      })();

                      return (
                        <TableRow 
                          key={product.id} 
                          sx={{
                            display: isDeleting === product.id ? 'none' : 'table-row',
                            backgroundColor: isDeleting === product.id ? 'error.light' : 
                              product.expiry_date ? (() => {
                                const today = new Date();
                                const expiry = new Date(product.expiry_date);
                                const diffTime = expiry.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 0) return 'rgba(244, 67, 54, 0.15)'; // Süresi geçmiş - hafif kırmızı
                                if (diffDays <= 7) return 'rgba(255, 152, 0, 0.15)'; // Kritik - hafif turuncu
                                if (diffDays <= 14) return 'rgba(255, 235, 59, 0.15)'; // Uyarı - hafif sarı
                                return 'inherit';
                              })() : 'inherit',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: isExpiringSoon ? 
                                'rgba(255, 152, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: { xs: '130px', sm: '200px', md: 'none' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {product.expiry_date && (() => {
                                const today = new Date();
                                const expiry = new Date(product.expiry_date);
                                const diffTime = expiry.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 0) return <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>⚠️</span>;
                                if (diffDays <= 7) return <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>🔴</span>;
                                if (diffDays <= 14) return <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>🟠</span>;
                                return null;
                              })()}
                              {product.name}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{product.category_name}</TableCell>
                          <TableCell align="right">{product.price.toLocaleString('tr-TR')} TL</TableCell>
                          <TableCell align="right">{product.stock_quantity}</TableCell>
                          <TableCell sx={{ ...getExpiryDateStyle(product.expiry_date), display: { xs: 'none', md: 'table-cell' } }}>
                            {formatDate(product.expiry_date)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(product)}
                              disabled={isDeleting !== null}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={isDeleting !== null}
                              size="small"
                            >
                              {isDeleting === product.id ? '...' : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
            
      {/* Stok tükenen ürünler için ayrı bir bölüm */}
      {!showStockZero && stockoutProducts.length > 0 && (
        <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {stockoutProducts.length} adet stok miktarı sıfır olan ürün gizlendi.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setShowStockZero(true)}
              startIcon={<span style={{ fontSize: '1.2rem' }}>⚠️</span>}
            >
              Stok Sıfır Ürünleri Göster
            </Button>
          </Box>
        </Paper>
      )}

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
          <TextField
            margin="dense"
            label="Marka"
            fullWidth
            value={newProduct.brand || ''}
            onChange={(e) =>
              setNewProduct({ ...newProduct, brand: e.target.value })
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
            value={newProduct.price || ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              setNewProduct({ 
                ...newProduct, 
                price: inputValue === '' ? undefined : Number(inputValue) 
              });
            }}
            sx={{ mb: 2 }}
            inputProps={{ step: "0.01" }}
          />
          <TextField
            margin="dense"
            label="Stok Miktarı"
            type="number"
            fullWidth
            value={newProduct.stock_quantity || ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              setNewProduct({
                ...newProduct,
                stock_quantity: inputValue === '' ? undefined : Number(inputValue),
              });
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
            <TextField
              margin="dense"
              label="Ürün Kabul Tarihi"
              type="date"
              fullWidth
              value={newProduct.reception_date || ''}
              onChange={(e) =>
                setNewProduct({ ...newProduct, reception_date: e.target.value })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
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