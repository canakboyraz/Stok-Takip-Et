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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StockMovement, Product } from '../types/database';

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
  total_cost: number;
  details: BulkMovementDetail[];
}

const StockMovements = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [bulkMovements, setBulkMovements] = useState<BulkMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<BulkMovement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts().then(() => {
      fetchMovements();
      checkDatabaseStructure();
    });
  }, []);

  const checkDatabaseStructure = async () => {
    try {
      // Fetch all stock movements to check structure
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
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
      console.log("--- Fetching Movements ---");
      
      // Önce tüm ürünlerin güncel listesini alalım
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productError) throw productError;
      
      const allProducts = productData || [];
      console.log(`Loaded ${allProducts.length} products`);
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
        .order('date', { ascending: false });

      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} stock movements`);
      
      if (!data || data.length === 0) {
        console.log('No movements found');
        setBulkMovements([]);
        setMovements([]);
        return;
      }
      
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
        setMovements(data); // Still show regular movements
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
      setMovements(data);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  
  const handleDetailsOpen = (movement: BulkMovement) => {
    setSelectedMovement(movement);
    setDetailsOpen(true);
  };
  
  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedMovement(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Stok Hareketleri</Typography>
        <Box>
          <Button variant="contained" onClick={() => navigate('/bulk-stock-out')}>
            Toplu Stok Çıkışı
          </Button>
        </Box>
      </Box>

      {/* Toplu Stok Hareketleri */}
      <Typography variant="h5" sx={{ mb: 2 }}>Toplu Stok Çıkışları</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih ve Saat</TableCell>
              <TableCell>Toplam Maliyet</TableCell>
              <TableCell>Ürün Sayısı</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bulkMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  {new Date(movement.date).toLocaleString('tr-TR')}
                </TableCell>
                <TableCell>
                  {movement.total_cost.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </TableCell>
                <TableCell>{movement.details.length}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDetailsOpen(movement)}
                  >
                    Detaylar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {bulkMovements.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Henüz toplu stok çıkışı bulunmamaktadır.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Tüm Stok Hareketleri */}
      <Typography variant="h5" sx={{ mb: 2 }}>Tüm Stok Hareketleri</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih ve Saat</TableCell>
              <TableCell>Ürün</TableCell>
              <TableCell>İşlem Türü</TableCell>
              <TableCell>Miktar</TableCell>
              <TableCell>Not</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  {new Date(movement.date).toLocaleString('tr-TR')}
                </TableCell>
                <TableCell>
                  {movement.products ? movement.products.name : 'Bilinmeyen Ürün'}
                </TableCell>
                <TableCell>
                  {movement.type === 'in' ? 'Giriş' : 'Çıkış'}
                </TableCell>
                <TableCell>{movement.quantity}</TableCell>
                <TableCell>{movement.notes || '-'}</TableCell>
              </TableRow>
            ))}
            {movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Henüz stok hareketi bulunmamaktadır.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Movement Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Toplu Stok Çıkışı - {selectedMovement && new Date(selectedMovement.date).toLocaleString('tr-TR')}
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
    </Container>
  );
};

export default StockMovements; 