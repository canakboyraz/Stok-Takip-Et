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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { StockMovement, Product } from '../types/database';

const StockMovements = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [newMovement, setNewMovement] = useState<Partial<StockMovement>>({
    product_id: 0,
    type: 'in',
    quantity: 0,
    notes: '',
  });

  useEffect(() => {
    fetchMovements();
    fetchProducts();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, products(*)')
        .order('date', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      // Get current stock quantity
      const { data: productData } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', newMovement.product_id)
        .single();

      if (!productData) throw new Error('Product not found');

      // Calculate new stock quantity
      const newQuantity =
        newMovement.type === 'in'
          ? productData.stock_quantity + (newMovement.quantity || 0)
          : productData.stock_quantity - (newMovement.quantity || 0);

      if (newQuantity < 0) {
        throw new Error('Insufficient stock');
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', newMovement.product_id);

      if (updateError) throw updateError;

      // Create stock movement
      const { data, error } = await supabase
        .from('stock_movements')
        .insert([
          {
            ...newMovement,
            date: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      setMovements([data[0], ...movements]);
      handleClose();
      setNewMovement({
        product_id: 0,
        type: 'in',
        quantity: 0,
        notes: '',
      });
    } catch (error) {
      console.error('Error adding movement:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Stok Hareketleri</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Yeni Hareket
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Ürün</TableCell>
              <TableCell>İşlem Tipi</TableCell>
              <TableCell align="right">Miktar</TableCell>
              <TableCell>Notlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  {new Date(movement.date).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  {products.find((p) => p.id === movement.product_id)?.name}
                </TableCell>
                <TableCell>
                  {movement.type === 'in' ? 'Giriş' : 'Çıkış'}
                </TableCell>
                <TableCell align="right">{movement.quantity}</TableCell>
                <TableCell>{movement.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Yeni Stok Hareketi</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Ürün</InputLabel>
            <Select
              value={newMovement.product_id}
              label="Ürün"
              onChange={(e) =>
                setNewMovement({
                  ...newMovement,
                  product_id: Number(e.target.value),
                })
              }
            >
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>İşlem Tipi</InputLabel>
            <Select
              value={newMovement.type}
              label="İşlem Tipi"
              onChange={(e) =>
                setNewMovement({
                  ...newMovement,
                  type: e.target.value as 'in' | 'out',
                })
              }
            >
              <MenuItem value="in">Giriş</MenuItem>
              <MenuItem value="out">Çıkış</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Miktar"
            type="number"
            fullWidth
            value={newMovement.quantity}
            onChange={(e) =>
              setNewMovement({
                ...newMovement,
                quantity: Number(e.target.value),
              })
            }
          />
          <TextField
            margin="dense"
            label="Notlar"
            fullWidth
            multiline
            rows={3}
            value={newMovement.notes}
            onChange={(e) =>
              setNewMovement({ ...newMovement, notes: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockMovements; 