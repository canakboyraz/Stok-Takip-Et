import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const ActivityLog: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h5">
          Etkinlik günlüğü sayfası yapım aşamasındadır.
        </Typography>
      </Box>
    </Container>
  );
};

export default ActivityLog; 