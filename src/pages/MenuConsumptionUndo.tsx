import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Undo as UndoIcon,
  AccessTime as AccessTimeIcon,
  Restaurant as RestaurantIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/activityLogger';

interface ReversibleOperation {
  bulk_id: number;
  date: string;
  notes: string;
  type: 'in' | 'out';
  project_id: number;
  user_id: string;
  operation_type: string;
  is_reversed: boolean;
  reversed_at: string | null;
  reversed_by: string | null;
  reversal_reason: string | null;
  can_be_reversed: boolean;
  operation_rank: number;
  can_undo_now: boolean;
  undo_status: string;
  total_items: number;
  estimated_cost: number;
}

interface StockMovementDetail {
  id: number;
  product_id: number;
  quantity: number;
  product_name: string;
  current_stock: number;
}

const MenuConsumptionUndo = () => {
  const navigate = useNavigate();
  const [operations, setOperations] = useState<ReversibleOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<ReversibleOperation | null>(null);
  const [operationDetails, setOperationDetails] = useState<StockMovementDetail[]>([]);
  const [undoDialog, setUndoDialog] = useState(false);
  const [undoReason, setUndoReason] = useState('');
  const [undoLoading, setUndoLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchReversibleOperations();
  }, []);

  const fetchReversibleOperations = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentProjectId = localStorage.getItem('currentProjectId');
      if (!currentProjectId) {
        setError('Proje seçilmemiş');
        return;
      }

      // Geri alınabilir işlemleri getir
      const { data, error } = await supabase
        .from('reversible_operations')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('date', { ascending: false });

      if (error) throw error;
      setOperations(data || []);

    } catch (err: any) {
      setError(`İşlemler yüklenirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationDetails = async (bulkId: number) => {
    try {
      setDetailsLoading(true);

      // Bulk işleminin detaylarını getir
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          id,
          product_id,
          quantity,
          products:products (
            id,
            name,
            stock_quantity
          )
        `)
        .eq('bulk_id', bulkId.toString())
        .eq('is_reversed', false);

      if (error) throw error;

      const details: StockMovementDetail[] = data?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product_name: item.products?.name || 'Bilinmeyen Ürün',
        current_stock: item.products?.stock_quantity || 0,
      })) || [];

      setOperationDetails(details);

    } catch (err: any) {
      setError(`Detaylar yüklenirken hata: ${err.message}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleShowDetails = async (operation: ReversibleOperation) => {
    setSelectedOperation(operation);
    await fetchOperationDetails(operation.bulk_id);
  };

  const handleUndoClick = (operation: ReversibleOperation) => {
    setSelectedOperation(operation);
    setUndoDialog(true);
    setUndoReason('');
  };

  const executeUndo = async () => {
    if (!selectedOperation || !undoReason.trim()) {
      setError('Lütfen geri alma nedenini belirtin');
      return;
    }

    try {
      setUndoLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Kullanıcı bilgisi alınamadı');

      // Eğer operationDetails boşsa, önce detayları yükle
      let detailsToProcess = operationDetails;
      if (detailsToProcess.length === 0) {
        console.log('Operation details boş, yükleniyor...');
        
        const { data, error } = await supabase
          .from('stock_movements')
          .select(`
            id,
            product_id,
            quantity,
            products:products (
              id,
              name,
              stock_quantity
            )
          `)
          .eq('bulk_id', selectedOperation.bulk_id.toString())
          .eq('is_reversed', false);

        if (error) throw error;

        detailsToProcess = data?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          product_name: item.products?.name || 'Bilinmeyen Ürün',
          current_stock: item.products?.stock_quantity || 0,
        })) || [];

        console.log('Yüklenen detaylar:', detailsToProcess);
      }

      if (detailsToProcess.length === 0) {
        throw new Error('Bu işlem için stok hareketi detayları bulunamadı');
      }

      // 1. Bulk movement'ı geri alındı olarak işaretle
      const { error: bulkError } = await supabase
        .from('bulk_movements')
        .update({
          is_reversed: true,
          reversed_at: new Date().toISOString(),
          reversed_by: userData.user.id,
          reversal_reason: undoReason.trim(),
        })
        .eq('id', selectedOperation.bulk_id);

      if (bulkError) throw bulkError;

      // 2. İlgili stock movements'ları geri alındı olarak işaretle
      const { error: stockError } = await supabase
        .from('stock_movements')
        .update({
          is_reversed: true,
          reversed_at: new Date().toISOString(),
          reversed_by: userData.user.id,
        })
        .eq('bulk_id', selectedOperation.bulk_id.toString())
        .eq('is_reversed', false);

      if (stockError) throw stockError;

      // 3. Stok miktarlarını geri yükle
      console.log(`${detailsToProcess.length} ürün için stok geri yüklenecek`);
      for (const detail of detailsToProcess) {
        const newStockQuantity = detail.current_stock + detail.quantity;
        console.log(`${detail.product_name}: ${detail.current_stock} + ${detail.quantity} = ${newStockQuantity}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock_quantity: newStockQuantity, // Çıkış işlemi geri alınıyor, stok geri ekleniyor
          })
          .eq('id', detail.product_id)
          .eq('project_id', selectedOperation.project_id); // Proje kontrolü ekle

        if (updateError) {
          console.error(`Ürün ${detail.product_name} için stok güncellenirken hata:`, updateError);
          throw updateError;
        }
        
        console.log(`✅ ${detail.product_name} stoğu güncellendi: ${newStockQuantity}`);
      }

      // Etkinlik kaydı ekle - Hata olsa bile geri alma işlemi tamamlanmış olsun
      try {
        console.log('🔍 MenuConsumptionUndo: Etkinlik kaydı ekleniyor...', {
          type: 'menu_consumption_undo',
          description: `${selectedOperation.notes} - ${detailsToProcess.length} ürün geri yüklendi. Neden: ${undoReason.trim()}`,
          entity_type: 'bulk_movement',
          entity_id: selectedOperation.bulk_id
        });
        
        const activityResult = await logActivity(
          'menu_consumption_undo',
          `${selectedOperation.notes} - ${detailsToProcess.length} ürün geri yüklendi. Neden: ${undoReason.trim()}`,
          'bulk_movement',
          selectedOperation.bulk_id
        );
        
        console.log('🔍 MenuConsumptionUndo: Etkinlik kaydı sonucu:', activityResult);
        
        if (!activityResult) {
          console.warn('⚠️ Etkinlik kaydı başarısız oldu ama geri alma işlemi tamamlandı');
        }
      } catch (activityError) {
        console.error('❌ Etkinlik kaydı hatası (geri alma başarılı):', activityError);
        // Etkinlik kaydı hatası geri alma işlemini etkilememeli
      }

      setSuccess(`${selectedOperation.notes} işlemi başarıyla geri alındı! Stoklar geri yüklendi.`);
      setUndoDialog(false);
      setSelectedOperation(null);
      setOperationDetails([]);
      
      // Listeyi yenile
      await fetchReversibleOperations();

    } catch (err: any) {
      setError(`Geri alma hatası: ${err.message}`);
    } finally {
      setUndoLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'menu_consumption':
        return { label: 'Menü Tüketimi', icon: <RestaurantIcon />, color: 'primary' };
      case 'bulk_out':
        return { label: 'Toplu Çıkış', icon: <UndoIcon />, color: 'secondary' };
      default:
        return { label: type, icon: <UndoIcon />, color: 'default' };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <UndoIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4">
            🔄 Menü Tüketim Geri Alma
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          Menü tüketim işlemlerini sıralı olarak geri alabilirsiniz. 
          Güvenlik için sadece <strong>en son yapılan işlem</strong> geri alınabilir.
          Geri alınan işlemler stokları otomatik olarak geri yükler.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {operations.length === 0 ? (
              <Card sx={{ textAlign: 'center', p: 4 }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary">
                    Geri alınabilir işlem bulunamadı
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Menü tüketimi yapılmamış veya tüm işlemler zaten geri alınmış.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/menu-consumption')}
                    sx={{ mt: 2 }}
                  >
                    Menü Tüketimi Yap
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sıra</TableCell>
                      <TableCell>İşlem</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Açıklama</TableCell>
                      <TableCell align="center">Durum</TableCell>
                      <TableCell align="right">Ürün Sayısı</TableCell>
                      <TableCell align="right">Tahmini Maliyet</TableCell>
                      <TableCell align="center">İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {operations.map((operation) => {
                      const operationType = getOperationTypeLabel(operation.operation_type);
                      const canUndo = operation.can_undo_now && !operation.is_reversed;

                      return (
                        <TableRow
                          key={operation.bulk_id}
                          sx={{
                            backgroundColor: operation.is_reversed 
                              ? 'action.disabled' 
                              : canUndo 
                                ? 'success.light' 
                                : 'warning.light',
                            opacity: operation.is_reversed ? 0.6 : 1,
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={`#${operation.operation_rank}`}
                              color={canUndo ? 'success' : 'warning'}
                              size="small"
                              variant={canUndo ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {operationType.icon}
                              <Chip
                                label={operationType.label}
                                color={operationType.color as any}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(operation.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {operation.notes}
                            </Typography>
                            {operation.is_reversed && (
                              <Typography variant="caption" color="text.secondary">
                                Geri alındı: {formatDate(operation.reversed_at!)}
                                <br />
                                Neden: {operation.reversal_reason}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {operation.is_reversed ? (
                              <Chip
                                icon={<CancelIcon />}
                                label="Geri Alındı"
                                color="default"
                                size="small"
                              />
                            ) : (
                              <Chip
                                icon={canUndo ? <CheckCircleIcon /> : <WarningIcon />}
                                label={operation.undo_status}
                                color={canUndo ? 'success' : 'warning'}
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {operation.total_items}
                          </TableCell>
                          <TableCell align="right">
                            {operation.estimated_cost.toFixed(2)} ₺
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Detayları Görüntüle">
                              <IconButton
                                onClick={() => handleShowDetails(operation)}
                                size="small"
                              >
                                <AccessTimeIcon />
                              </IconButton>
                            </Tooltip>
                            {canUndo && (
                              <Tooltip title="Geri Al">
                                <IconButton
                                  onClick={() => handleUndoClick(operation)}
                                  color="error"
                                  size="small"
                                >
                                  <UndoIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Detay Dialogu */}
        <Dialog 
          open={Boolean(selectedOperation && operationDetails.length > 0)} 
          onClose={() => {
            setSelectedOperation(null);
            setOperationDetails([]);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            İşlem Detayları: {selectedOperation?.notes}
          </DialogTitle>
          <DialogContent>
            {detailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ürün</TableCell>
                      <TableCell align="right">Tüketilen Miktar</TableCell>
                      <TableCell align="right">Mevcut Stok</TableCell>
                      <TableCell align="right">Geri Yüklenecek</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {operationDetails.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>{detail.product_name}</TableCell>
                        <TableCell align="right">{detail.quantity}</TableCell>
                        <TableCell align="right">{detail.current_stock}</TableCell>
                        <TableCell align="right">
                          <strong>{detail.current_stock + detail.quantity}</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setSelectedOperation(null);
                setOperationDetails([]);
              }}
            >
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        {/* Geri Alma Onay Dialogu */}
        <Dialog open={undoDialog} onClose={() => setUndoDialog(false)}>
          <DialogTitle>İşlemi Geri Al</DialogTitle>
          <DialogContent>
            <Typography paragraph>
              <strong>{selectedOperation?.notes}</strong> işlemini geri almak istediğinizden emin misiniz?
            </Typography>
            <Typography variant="body2" color="warning.main" paragraph>
              Bu işlem geri alınamaz! Tüm stoklar geri yüklenecek.
            </Typography>
            <TextField
              fullWidth
              label="Geri alma nedeni"
              multiline
              rows={3}
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              placeholder="Örn: Yanlış menü seçildi, kişi sayısı hatalıydı..."
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUndoDialog(false)}>İptal</Button>
            <Button
              onClick={executeUndo}
              color="error"
              variant="contained"
              disabled={!undoReason.trim() || undoLoading}
            >
              {undoLoading ? <CircularProgress size={20} /> : 'Geri Al'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default MenuConsumptionUndo;
