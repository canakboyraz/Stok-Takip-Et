/**
 * Pagination Component
 *
 * Reusable pagination component with MUI
 */

import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Stack,
} from '@mui/material';

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  disabled = false,
}) => {
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const handlePageSizeChange = (event: any) => {
    onPageSizeChange(Number(event.target.value));
  };

  // Calculate displayed range
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        py: 2,
        px: 1,
      }}
    >
      {/* Left side - Page size selector */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Sayfa başına:
        </Typography>
        <FormControl size="small" disabled={disabled}>
          <Select
            value={pageSize}
            onChange={handlePageSizeChange}
            sx={{ minWidth: 70 }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Center - Pagination controls */}
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={handlePageChange}
        color="primary"
        showFirstButton
        showLastButton
        disabled={disabled || totalPages <= 1}
      />

      {/* Right side - Count display */}
      <Typography variant="body2" color="text.secondary">
        {startItem}-{endItem} / {totalCount} kayıt
      </Typography>
    </Box>
  );
};

export default Pagination;
