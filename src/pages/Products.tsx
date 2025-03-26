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
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    code: '',
    category: '',
    price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

      if (error) throw error;

      setProducts([data[0], ...products]);
      handleClose();
      setNewProduct({
        name: '',
        code: '',
        category: '',
        price: 0,
        stock_quantity: 0,
        min_stock_level: 0,
      });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Ürünler</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Yeni Ürün Ekle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ürün Kodu</TableCell>
              <TableCell>Ürün Adı</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell align="right">Fiyat</TableCell>
              <TableCell align="right">Stok Miktarı</TableCell>
              <TableCell align="right">Min. Stok Seviyesi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.code}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell align="right">{product.price} TL</TableCell>
                <TableCell align="right">{product.stock_quantity}</TableCell>
                <TableCell align="right">{product.min_stock_level}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Yeni Ürün Ekle</DialogTitle>
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
          />
          <TextField
            margin="dense"
            label="Ürün Kodu"
            fullWidth
            value={newProduct.code}
            onChange={(e) =>
              setNewProduct({ ...newProduct, code: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Kategori"
            fullWidth
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Fiyat"
            type="number"
            fullWidth
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: Number(e.target.value) })
            }
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
          />
          <TextField
            margin="dense"
            label="Min. Stok Seviyesi"
            type="number"
            fullWidth
            value={newProduct.min_stock_level}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                min_stock_level: Number(e.target.value),
              })
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

export default Products; 