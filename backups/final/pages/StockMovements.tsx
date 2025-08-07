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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StockMovement, Product } from '../types/database';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

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
}

const StockMovements = () => {
  const [movements, setMovements] = useState<DisplayStockMovement[]>([]);
  const [bulkMovements, setBulkMovements] = useState<BulkMovement[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  // Create a special state for dialog products only
  const [dialogProducts, setDialogProducts] = useState<ExtendedProduct[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<BulkMovement | null>(null);
  const navigate = useNavigate();

  // Bulk stock out state
  const [bulkOutOpen, setBulkOutOpen] = useState(false);
  const [bulkOutProducts, setBulkOutProducts] = useState<BulkStockOutProduct[]>([
    { product_id: '', quantity: 1 }
  ]);
  const [bulkOutNote, setBulkOutNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always refresh products for current project first
    fetchProducts().then(() => {
      fetchMovements();
      checkDatabaseStructure();
    });
  }, []);

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

  const fetchMovements = async () => {
    try {
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
      
      // Fetch all stock movements with bulk id or is_bulk flag
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            *
          )
        `)
        .eq('project_id', parseInt(currentProjectId))
        .order('date', { ascending: false });

      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} stock movements for project ID: ${currentProjectId}`);
      
      if (!data || data.length === 0) {
        console.log('No movements found');
        setBulkMovements([]);
        setMovements([]);
        return;
      }
      
      // Map to the display type with calculated total cost and notes mapped to note
      const displayMovements: DisplayStockMovement[] = data.map(movement => {
        // Get product information
        const product = movement.products || allProducts.find(p => p.id === movement.product_id);
        const unitPrice = product ? (product.unit_price || product.price || 0) : 0;
        
        return {
          ...movement,
          total_cost: movement.quantity * unitPrice,
          note: movement.notes // Map notes to note for display
        };
      });
      
      // Filter to get only bulk movements - check both is_bulk and bulk_id
      const bulkMovements = data.filter(mov => {
        const isBulk = mov.is_bulk === true;
        const hasBulkId = mov.bulk_id !== null && mov.bulk_id !== undefined;
        console.log(`Movement ID ${mov.id}: is_bulk=${isBulk}, has_bulk_id=${hasBulkId}, bulk_id=${mov.bulk_id}`);
        return isBulk || hasBulkId;
      });
      
      console.log(`Filtered ${bulkMovements.length} bulk movements`);
      
      if (bulkMovements.length === 0) {
        console.log('No bulk movements found after filtering');
        setBulkMovements([]);
        setMovements(displayMovements); // Still show regular movements
        return;
      }
      
      // Group by bulk_id
      const bulkGroups: { [key: string]: BulkMovement } = {};
      
      for (const movement of bulkMovements) {
        // If bulk_id is missing, use the movement id as a fallback
        const bulkId = movement.bulk_id || movement.id;
        console.log(`Processing bulk movement ID ${movement.id} with bulk_id ${bulkId}`);
        
        // Get product information, first from joined data, then from our cached products
        let product = movement.products;
        
        if (!product) {
          console.log(`Product join missing for movement ${movement.id}, looking up product ID ${movement.product_id}`);
          product = allProducts.find(p => p.id === movement.product_id);
        }
        
        if (!product) {
          console.log(`Could not find product for movement ${movement.id}, skipping`);
          continue;
        }
        
        const unitPrice = product.unit_price || product.price || 0;
        const totalPrice = movement.quantity * unitPrice;
        
        console.log(`Movement ${movement.id}: product=${product.name}, quantity=${movement.quantity}, price=${unitPrice}, total=${totalPrice}`);
        
        if (!bulkGroups[bulkId]) {
          bulkGroups[bulkId] = {
            id: bulkId,
            date: movement.date,
            note: movement.notes, // Map notes to note
            type: movement.type,
            total_cost: totalPrice,
            details: [{
              id: movement.id,
              product_id: movement.product_id,
              product_name: product.name,
              quantity: movement.quantity,
              unit_price: unitPrice,
              total_price: totalPrice
            }]
          };
        } else {
          bulkGroups[bulkId].total_cost += totalPrice;
          bulkGroups[bulkId].details.push({
            id: movement.id,
            product_id: movement.product_id,
            product_name: product.name,
            quantity: movement.quantity,
            unit_price: unitPrice,
            total_price: totalPrice
          });
        }
      }
      
      const groupedMovements = Object.values(bulkGroups);
      console.log(`Created ${groupedMovements.length} grouped bulk movements`);
      console.log('Grouped movements:', groupedMovements);
      
      setBulkMovements(groupedMovements);
      setMovements(displayMovements);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const fetchProducts = async () => {
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
  };
  
  const handleDetailsOpen = (movement: DisplayStockMovement) => {
    // Convert DisplayStockMovement to BulkMovement format if needed
    // This is a simplified version - you might need to adjust based on your data
    const bulkMovement: BulkMovement = {
      id: movement.id,
      date: movement.date,
      note: movement.note,
      type: movement.type,
      total_cost: movement.total_cost || 0,
      details: movement.products ? [{
        id: movement.id,
        product_id: movement.product_id,
        product_name: movement.products.name,
        quantity: movement.quantity,
        unit_price: movement.products.unit_price || movement.products.price || 0,
        total_price: movement.total_cost || 0
      }] : []
    };
    
    setSelectedMovement(bulkMovement);
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