import React from 'react';
import { Container, Typography, Paper, Box, Alert } from '@mui/material';

const Events = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" p={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Etkinlikler
          </Typography>
          <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
            Etkinlikler sayfası yakında aktif olacaktır.
          </Alert>
        </Box>
      </Paper>
    </Container>
  );
};

export default Events; 