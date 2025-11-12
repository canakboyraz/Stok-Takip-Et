import React, { useState, useEffect, useCallback } from 'react';
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
  Typography,
  Box,
  IconButton,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StockMovement, Product } from '../types/database';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { logActivity } from '../lib/activityLogger';

// Extended Product interface for UI needs
interface ExtendedProduct extends Product {
  stock_quantity: number;
}

interface BulkMovementDetail {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface BulkMovement {
  id: number;
  date: string;
  note?: string;
  type?: 'in' | 'out';
  total_cost: number;
  details: BulkMovementDetail[];
}

interface BulkStockOutProduct {
  product_id: string;
  quantity: number;
}

// Extended type for UI display
interface DisplayStockMovement extends StockMovement {
  total_cost?: number;
  note?: string;
  products?: ExtendedProduct;
  bulk_details?: BulkMovementDetail[];
}

const StockMovements = () => {
  const [movements, setMovements] = useState<DisplayStockMovement[]>([]);
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  // Create a special state for dialog products only
  const [dialogProducts, setDialogProducts] = useState<ExtendedProduct[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<BulkMovement | null>(null);
  const navigate = useNavigate();

  // Tarih filtresi için state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [filteredMovementsCount, setFilteredMovementsCount] = useState<number>(0);

  // Bulk stock out state
  const [bulkOutOpen, setBulkOutOpen] = useState(false);
  const [bulkOutProducts, setBulkOutProducts] = useState<BulkStockOutProduct[]>([
    { product_id: '', quantity: 1 }
  ]);
  const [bulkOutNote, setBulkOutNote] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      // Always get a fresh copy of the current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');

      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        alert('Proje seçilmemiş. Lütfen önce bir proje seçin.');
        navigate('/'); // Navigate to project selection page
        return [];
      }

      // Parse project ID once
      const projectId = parseInt(currentProjectId);

      console.log(`fetchProducts: Getting products for project ID: ${projectId}`);

      // RESET PRODUCTS FIRST - This is essential for project isolation
      setProducts([]);

      // Fetch only products from the current project
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      if (error) throw error;

      // Ensure we only include products from the current project
      const projectProducts = data || [];
      console.log(`fetchProducts: Loaded ${projectProducts.length} products for project ID: ${projectId}`);

      // Log all the products we're about to set in state
      projectProducts.forEach(p => {
        console.log(`Setting product in state: ${p.id} (${p.name}), Project: ${p.project_id}`);
      });

      // Set products after completely emptying the previous state
      setProducts(projectProducts);

      return projectProducts; // Return for potential chaining
    } catch (error) {
      console.error('Error fetching products:', error);
      alert(`Ürünler yüklenirken bir hata oluştu: ${(error as Error).message}`);
      return []; // Return empty array for safety
    }
  }, [navigate]);

  useEffect(() => {
    // Always refresh products for current project first
    fetchProducts().then(() => {
      fetchMovements();
      checkDatabaseStructure();
    });
  }, [fetchProducts]);

  const checkDatabaseStructure = async () => {
    try {
      // Always get a fresh copy of the current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        return;
      }
      
      // Fetch all stock movements to check structure
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('project_id', parseInt(currentProjectId))
        .limit(10);

      if (error) throw error;
      
      console.log('Database structure check - Sample stock movements:', data);
      
      // Check if is_bulk and bulk_id exist
      if (data && data.length > 0) {
        const firstRecord = data[0];
        console.log('First record structure:', Object.keys(firstRecord));
        console.log('is_bulk exists:', 'is_bulk' in firstRecord);
        console.log('bulk_id exists:', 'bulk_id' in firstRecord);
      }
      
      // Try fetching with explicit is_bulk filter
      const { data: bulkData, error: bulkError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('project_id', parseInt(currentProjectId))
        .eq('is_bulk', true);
        
      if (bulkError) throw bulkError;
      
      console.log('Movements with is_bulk=true count:', bulkData?.length);
      console.log('Sample bulk movements:', bulkData?.slice(0, 3));
      
    } catch (error) {
      console.error('Error checking database structure:', error);
    }
  };

  const fetchMovements = async (start?: string | null, end?: string | null) => {
    try {
      setLoading(true);
      
      // Always get a fresh copy of the current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        return;
      }
      
      console.log("--- Fetching Movements for project ID:", currentProjectId);
      
      // Önce tüm ürünlerin güncel listesini alalım
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('project_id', parseInt(currentProjectId))
        .order('name');

      if (productError) throw productError;
      
      const allProducts = productData || [];
      console.log(`Loaded ${allProducts.length} products for project ID: ${currentProjectId}`);
      setProducts(allProducts);
      
      // Tarih filtreleri için sorguyu hazırla
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            *
          )
        `)
        .eq('project_id', parseInt(currentProjectId));

      // Tarih filtrelerini ekle
      if (start && start.trim() !== '') {
        const startStr = new Date(start).toISOString().split('T')[0];
        query = query.gte('date', startStr);
      }
      
      if (end && end.trim() !== '') {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        const endStr = endDate.toISOString();
        query = query.lte('date', endStr);
      }

      // Tarihe göre sırala
      query = query.order('date', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} stock movements for project ID: ${currentProjectId}`);
      
      if (!data || data.length === 0) {
        console.log('No movements found');
        setMovements([]);
        setTotalAmount(0);
        setFilteredMovementsCount(0);
        setLoading(false);
        return;
      }
      
      // Önce hareketleri bulk_id'ye göre gruplandır
      const bulkGroups: Record<string | number, BulkMovement> = {};
      const individualMovements: DisplayStockMovement[] = [];
      
      for (const movement of data) {
        // Get product information
        const product = movement.products || allProducts.find(p => p.id === movement.product_id);
        const unitPrice = product ? (product.unit_price || product.price || 0) : 0;
        const totalPrice = movement.quantity * unitPrice;
        
        // Eğer bulk hareketi ise gruplayalım
        if (movement.is_bulk && movement.bulk_id) {
          const bulkId = movement.bulk_id;
          
          if (!bulkGroups[bulkId]) {
            // İlk kez bu bulk_id görülüyorsa, yeni grup oluştur
            bulkGroups[bulkId] = {
              id: bulkId,
              date: movement.date,
              note: movement.notes,
              type: movement.type,
              total_cost: totalPrice,
              details: [{
                id: movement.id,
                product_id: movement.product_id,
                product_name: product?.name || 'Bilinmeyen Ürün',
                quantity: movement.quantity,
                unit_price: unitPrice,
                total_price: totalPrice
              }]
            };
          } else {
            // Bu bulk_id zaten varsa, detay ekle ve toplamı güncelle
            bulkGroups[bulkId].total_cost += totalPrice;
            bulkGroups[bulkId].details.push({
              id: movement.id,
              product_id: movement.product_id,
              product_name: product?.name || 'Bilinmeyen Ürün',
              quantity: movement.quantity,
              unit_price: unitPrice,
              total_price: totalPrice
            });
          }
        } else {
          // Bulk olmayan hareketi bireysel listeye ekle
          individualMovements.push({
            ...movement,
            total_cost: totalPrice,
            note: movement.notes
          });
        }
      }
      
      // Bulk hareketlerini dizi haline getir
      const groupedBulkMovements = Object.values(bulkGroups);
      console.log(`Created ${groupedBulkMovements.length} grouped bulk movements`);
      
      // Bulk hareketlerini ve bireysel hareketleri DisplayStockMovement formatına dönüştür
      const displayMovements: DisplayStockMovement[] = [
        // Önce bulk hareketlerini ekle - her bulk bir satır olacak
        ...groupedBulkMovements.map(bulk => {
          // StockMovement ile uyumlu hale getir
          const bulkMovement: DisplayStockMovement = {
            id: bulk.id,
            product_id: 0, // Bulk hareket grup için ürün ID'si kullanmıyoruz
            quantity: bulk.details.reduce((sum, detail) => sum + detail.quantity, 0), // Toplam miktar
            date: bulk.date,
            type: bulk.type || 'out',
            project_id: parseInt(currentProjectId),
            notes: bulk.note || 'Toplu Stok Çıkışı',
            is_bulk: true,
            bulk_id: bulk.id,
            total_cost: bulk.total_cost,
            bulk_details: bulk.details, // Detayları saklayalım
            user_id: '' // Varsayılan değer
          };
          return bulkMovement;
        }),
        // Sonra bireysel hareketleri ekle
        ...individualMovements
      ];
      
      // Tarihe göre sırala
      displayMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Toplam tutarı hesapla
      let total = 0;
      displayMovements.forEach(movement => {
        // Stok girişlerini ve çıkışlarını farklı değerlendir
        const totalCost = movement.total_cost || 0;
        if (movement.type === 'in') {
          total += totalCost;
        } else {
          total -= totalCost;
        }
      });

      setTotalAmount(Math.abs(total)); // Mutlak değeri göster
      setFilteredMovementsCount(displayMovements.length);
      setMovements(displayMovements);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsOpen = (movement: DisplayStockMovement) => {
    // Eğer bulk hareket ise direkt olarak detayları göster
    if (movement.is_bulk && movement.bulk_details) {
      const bulkMovement: BulkMovement = {
        id: movement.id,
        date: movement.date,
        note: movement.notes,
        type: movement.type,
        total_cost: movement.total_cost || 0,
        details: movement.bulk_details
      };
      setSelectedMovement(bulkMovement);
    } 
    // Eğer normal hareket ise veya bulk_details yoksa, tek bir ürünü gösterecek şekilde hazırla
    else {
      // Get product information
      const product = movement.products || null;
      
      const bulkMovement: BulkMovement = {
        id: movement.id,
        date: movement.date,
        note: movement.notes,
        type: movement.type,
        total_cost: movement.total_cost || 0,
        details: [{
          id: movement.id,
          product_id: movement.product_id,
          product_name: product ? product.name : 'Bilinmeyen Ürün',
          quantity: movement.quantity,
          unit_price: product ? (product.unit_price || product.price || 0) : 0,
          total_price: movement.total_cost || 0
        }]
      };
      setSelectedMovement(bulkMovement);
    }
    
    setDetailsOpen(true);
  };
  
  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedMovement(null);
  };

  // Add handlers for bulk stock out
  const handleBulkOutOpen = async () => {
    try {
      // Set loading state
      setLoading(true);
      
      // Reset states first
      setBulkOutProducts([{ product_id: '', quantity: 1 }]);
      setBulkOutNote('');
      setDialogProducts([]); // Clear dialog products first
      
      // Projenin güncel ürünlerini doğrudan yükle
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        alert('Proje seçilmemiş. Lütfen önce bir proje seçin.');
        navigate('/');
        return;
      }
      
      // Parse project ID once
      const projectId = parseInt(currentProjectId);
      console.log(`[NEW METHOD] Bulk Stock Out: Fetching products for project ID: ${projectId}`);
      
      // COMPLETELY NEW METHOD: Directly fetch products into a separate state
      const { data: projectProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('project_id', projectId)
        .gt('stock_quantity', 0); // Only products with stock
        
      if (error) throw error;
      
      const productsWithStock = projectProducts || [];
      console.log(`[NEW METHOD] Loaded ${productsWithStock.length} products with stock directly from database for project ID: ${projectId}`);
      
      if (productsWithStock.length === 0) {
        alert('Bu projede stokta ürün bulunmamaktadır. Önce ürün ekleyin veya mevcut ürünlere stok ekleyin.');
        setLoading(false);
        return;
      }
      
      // Open dialog first
      setBulkOutOpen(true);
      
      // Set dialog products SEPARATELY from main products state
      setDialogProducts(productsWithStock);
      setLoading(false);
      
    } catch (error) {
      console.error('[NEW METHOD] Error preparing bulk stock out:', error);
      alert(`Bir hata oluştu: ${(error as Error).message}`);
      setLoading(false);
    }
  };

  const handleBulkOutClose = () => {
    // Clear dialog products on close
    setDialogProducts([]);
    setBulkOutOpen(false);
    setBulkOutProducts([{ product_id: '', quantity: 1 }]);
    setBulkOutNote('');
    // No need to refresh products here
  };

  const handleAddProduct = () => {
    setBulkOutProducts([...bulkOutProducts, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...bulkOutProducts];
    updatedProducts.splice(index, 1);
    setBulkOutProducts(updatedProducts);
  };

  const handleProductChange = (index: number, event: SelectChangeEvent) => {
    const updatedProducts = [...bulkOutProducts];
    updatedProducts[index].product_id = event.target.value;
    setBulkOutProducts(updatedProducts);
  };

  const handleQuantityChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (isNaN(value) || value < 1) return;
    
    const updatedProducts = [...bulkOutProducts];
    updatedProducts[index].quantity = value;
    setBulkOutProducts(updatedProducts);
  };

  const handleBulkOutSubmit = async () => {
    try {
      // Always get a fresh copy of the current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!currentProjectId) {
        console.error('No project ID found in localStorage');
        alert('Proje bilgisi bulunamadı. Lütfen tekrar proje seçin.');
        return;
      }
      
      // Parse project ID once and use the value consistently
      const projectId = parseInt(currentProjectId);
      
      // Validate form
      const hasEmptyProduct = bulkOutProducts.some(p => !p.product_id);
      if (hasEmptyProduct) {
        alert('Lütfen tüm ürünleri seçin');
        return;
      }

      setLoading(true);

      // Create bulk movement
      const date = new Date().toISOString();
      const { data: bulkMovement, error: bulkError } = await supabase
        .from('bulk_movements')
        .insert({
          date,
          note: bulkOutNote,
          type: 'out',
          project_id: projectId
        })
        .select()
        .single();

      if (bulkError) throw bulkError;

      // First validate that all products belong to current project
      const productIds = bulkOutProducts.map(item => parseInt(item.product_id, 10));
      const { data: projectProducts, error: validateError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, price')
        .eq('project_id', projectId)
        .in('id', productIds);
      
      if (validateError) throw validateError;
      
      // Check if all selected products are from current project
      if (!projectProducts || projectProducts.length !== bulkOutProducts.length) {
        throw new Error('Seçilen ürünlerden bazıları bu projeye ait değil. Lütfen sayfayı yenileyip tekrar deneyin.');
      }

      // Process each product - use verified products from database
      for (const item of bulkOutProducts) {
        // Find product details from verified products
        const productId = parseInt(item.product_id, 10);
        const product = projectProducts.find(p => p.id === productId);
        
        if (!product) continue; // Skip if product not found (additional safety)
        
        // Check stock
        if (product.stock_quantity < item.quantity) {
          throw new Error(`${product.name} için yeterli stok yok. Mevcut: ${product.stock_quantity}, İstenen: ${item.quantity}`);
        }

        // Create movement detail
        const { error: detailError } = await supabase
          .from('bulk_movement_details')
          .insert({
            bulk_movement_id: bulkMovement.id,
            product_id: productId,
            quantity: item.quantity,
            unit_price: product.price,
            total_price: product.price * item.quantity,
            project_id: projectId
          });

        if (detailError) throw detailError;

        // Create stock movement record
        const { error: stockMovementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: productId,
            quantity: item.quantity,
            type: 'out',
            date,
            notes: bulkOutNote,
            is_bulk: true,
            bulk_id: bulkMovement.id,
            project_id: projectId
          });
          
        if (stockMovementError) throw stockMovementError;

        // Update inventory - use stock_quantity from the verified products
        const { error: inventoryError } = await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq('id', productId)
          .eq('project_id', projectId); // Additional safety check

        if (inventoryError) throw inventoryError;
      }

      // Stok çıkışı başarılı oldu, etkinlik kaydı ekle
      const productNames = bulkOutProducts
        .map(item => {
          const product = products.find(p => p.id === parseInt(item.product_id, 10));
          // Eğer unit özelliği bulunamazsa varsayılan 'adet' kullan
          const unit = product && 'unit' in product ? product.unit : 'adet';
          return `${item.quantity} ${unit} ${product?.name}`;
        })
        .join(', ');
      
      const description = `Toplu stok çıkışı yapıldı: ${productNames}. Sebep: ${bulkOutNote}`;
      
      await logActivity(
        'stock_bulk_update',
        description,
        'stock_movement',
        null
      );

      alert('Toplu stok çıkışı başarıyla kaydedildi');
      handleBulkOutClose();
      fetchMovements();
      fetchProducts();
    } catch (error) {
      console.error('Error submitting bulk stock out:', error);
      alert(`Bir hata oluştu: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Completely rewritten to use dialogProducts instead of products
  const renderProductOptions = () => {
    // Use dialog products instead of main products state
    console.log('Rendering product options, dialog products count:', dialogProducts.length);
    
    if (dialogProducts.length === 0) {
      return <MenuItem disabled>Yükleniyor...</MenuItem>;
    }
    
    const currentProjectId = localStorage.getItem('currentProjectId');
    if (!currentProjectId) {
      return <MenuItem disabled>Proje seçilmedi</MenuItem>;
    }
    
    const projectId = parseInt(currentProjectId);
    console.log(`Rendering product options for project ID: ${projectId}`);
    
    // Log all products from dialog state
    dialogProducts.forEach(p => {
      console.log(`Dialog product: ${p.id} ${p.name}, Project: ${p.project_id}, Stock: ${p.stock_quantity}`);
    });
    
    return dialogProducts.map(product => (
      <MenuItem key={product.id} value={product.id.toString()}>
        {product.name} - Stok: {product.stock_quantity}
      </MenuItem>
    ));
  };

  // Tarih filtreleme işleyicileri
  const handleFilter = () => {
    fetchMovements(startDate, endDate);
  };
  
  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchMovements();
  };

  return (
    <Container maxWidth="xl">
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center" 
        spacing={2} 
        sx={{ mb: 4 }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Stok Hareketleri
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RemoveIcon />}
          onClick={handleBulkOutOpen}
        >
          Toplu Stok Çıkışı
        </Button>
      </Stack>

      {/* Tarih Filtreleme Bölümü */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Başlangıç Tarihi"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Bitiş Tarihi"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleFilter}
                sx={{ mt: 1 }}
              >
                Filtrele
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilter}
                sx={{ mt: 1 }}
              >
                Temizle
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Toplam tutar kısmı */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
        <Typography variant="h6">
          Toplam İşlem: {filteredMovementsCount} hareket, {totalAmount.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          })}
        </Typography>
        <Typography variant="caption">
          {startDate && endDate
            ? `${startDate} - ${endDate} arası`
            : startDate
            ? `${startDate} tarihinden itibaren`
            : endDate
            ? `${endDate} tarihine kadar`
            : 'Tüm zamanlar'}
        </Typography>
      </Box>
      
      {/* Hareket Tablosu */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Yükleniyor...</Typography>
        </Box>
      ) : movements.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          Seçilen tarih aralığında stok hareketi bulunamadı.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>İşlem Türü</TableCell>
                <TableCell>Not</TableCell>
                <TableCell align="right">Toplam Tutar</TableCell>
                <TableCell align="center">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{new Date(movement.date).toLocaleString('tr-TR')}</TableCell>
                  <TableCell>{movement.type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı'}</TableCell>
                  <TableCell>{movement.notes || movement.note || ''}</TableCell>
                  <TableCell align="right">
                    {(movement.total_cost || 0).toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      onClick={() => handleDetailsOpen(movement)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Bulk Movement Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleDetailsClose} fullWidth maxWidth="md">
        <DialogTitle>
          {selectedMovement?.type === 'in' ? 'Toplu Stok Girişi' : 'Toplu Stok Çıkışı'} - {selectedMovement && new Date(selectedMovement.date).toLocaleString('tr-TR')}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ürün Adı</TableCell>
                  <TableCell align="right">Miktar</TableCell>
                  <TableCell align="right">Birim Fiyat</TableCell>
                  <TableCell align="right">Toplam</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedMovement?.details.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>{detail.product_name}</TableCell>
                    <TableCell align="right">{detail.quantity}</TableCell>
                    <TableCell align="right">
                      {detail.unit_price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </TableCell>
                    <TableCell align="right">
                      {detail.total_price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <strong>Genel Toplam:</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>
                      {selectedMovement?.total_cost.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Stock Out Dialog */}
      <Dialog 
        open={bulkOutOpen} 
        onClose={handleBulkOutClose} 
        fullWidth 
        maxWidth="md"
        TransitionProps={{
          onEntering: () => {
            // Dialog açılırken yeni veri getir - bunu tamamen değiştirdim
            const currentProjectId = localStorage.getItem('currentProjectId');
            if (currentProjectId) {
              console.log('[DEDICATED METHOD] Dialog opened, refreshing products');
              
              // Parse project ID
              const projectId = parseInt(currentProjectId);
              
              // Veritabanından tekrar sorgula, AMA dialogProducts state'ine kaydet
              setDialogProducts([]); // Clear first
              
              supabase
                .from('products')
                .select('*')
                .eq('project_id', projectId)
                .gt('stock_quantity', 0)
                .order('name')
                .then(({ data, error }) => {
                  if (error) {
                    console.error('[DEDICATED METHOD] Error loading dialog products:', error);
                    return;
                  }
                  
                  console.log(`[DEDICATED METHOD] Loaded ${data?.length || 0} products for dialog, project ${projectId}`);
                  
                  // Log to verify they're the right project
                  if (data && data.length > 0) {
                    console.log(`[DEDICATED METHOD] Products sample project_id: ${data[0].project_id}`);
                  }
                  
                  setDialogProducts(data || []);
                });
            }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <RemoveIcon color="primary" />
            <Typography variant="h6">Toplu Stok Çıkışı</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Not"
                  fullWidth
                  value={bulkOutNote}
                  onChange={(e) => setBulkOutNote(e.target.value)}
                />
              </Grid>
              
              {dialogProducts.length === 0 && (
                <Grid item xs={12} sx={{ mt: 2, mb: 2 }}>
                  <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <Typography>
                      {loading ? 
                        'Ürünler yükleniyor...' : 
                        'Hiç ürün bulunamadı. Lütfen önce ürün ekleyin veya sayfayı yenileyin.'}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {bulkOutProducts.map((item, index) => (
                <Grid item xs={12} key={index} container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <FormControl fullWidth required>
                      <InputLabel>Ürün</InputLabel>
                      <Select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e)}
                        label="Ürün"
                        disabled={loading || dialogProducts.length === 0}
                        MenuProps={{
                          PaperProps: { 
                            style: { maxHeight: 300 }
                          }
                        }}
                      >
                        {renderProductOptions()}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      label="Miktar"
                      type="number"
                      fullWidth
                      required
                      disabled={loading}
                      value={item.quantity}
                      onChange={(e) => {
                        // Cast the event type explicitly
                        const event = e as React.ChangeEvent<HTMLInputElement>;
                        handleQuantityChange(index, event);
                      }}
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveProduct(index)}
                      disabled={bulkOutProducts.length <= 1 || loading}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  disabled={loading}
                >
                  Ürün Ekle
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkOutClose} disabled={loading}>İptal</Button>
          <Button 
            onClick={handleBulkOutSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading || bulkOutProducts.some(p => !p.product_id) || dialogProducts.length === 0}
          >
            {loading ? 'İşleniyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockMovements; 