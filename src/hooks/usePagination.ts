/**
 * usePagination Hook
 *
 * Supabase ile pagination için custom hook
 *
 * Kullanım:
 * const {
 *   data,
 *   loading,
 *   page,
 *   pageSize,
 *   totalCount,
 *   totalPages,
 *   hasNextPage,
 *   hasPreviousPage,
 *   nextPage,
 *   previousPage,
 *   goToPage,
 *   setPageSize,
 *   refetch
 * } = usePagination({
 *   table: 'products',
 *   pageSize: 10,
 *   orderBy: { column: 'created_at', ascending: false },
 *   filters: [{ column: 'project_id', value: projectId }]
 * });
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface PaginationFilter {
  column: string;
  value: any;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';
}

export interface PaginationOrderBy {
  column: string;
  ascending?: boolean;
}

export interface UsePaginationOptions {
  table: string;
  columns?: string;
  pageSize?: number;
  initialPage?: number;
  orderBy?: PaginationOrderBy;
  filters?: PaginationFilter[];
}

export interface UsePaginationReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refetch: () => void;
}

export function usePagination<T = any>({
  table,
  columns = '*',
  pageSize: initialPageSize = 10,
  initialPage = 1,
  orderBy,
  filters = [],
}: UsePaginationOptions): UsePaginationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.log(`Fetching ${table} - Page: ${page}, Size: ${pageSize}`);

      // Calculate range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query
      let query = supabase.from(table).select(columns, { count: 'exact' });

      // Apply filters
      filters.forEach((filter) => {
        const operator = filter.operator || 'eq';
        query = query[operator](filter.column, filter.value);
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Apply pagination
      query = query.range(from, to);

      // Execute query
      const { data: result, error: queryError, count } = await query;

      if (queryError) {
        logger.error('Pagination query error:', queryError);
        throw queryError;
      }

      setData(result || []);
      setTotalCount(count || 0);

      logger.log(`Fetched ${result?.length || 0} records. Total: ${count}`);
    } catch (err: any) {
      logger.error('Pagination error:', err);
      setError(err.message || 'Veri yüklenirken hata oluştu');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [table, columns, page, pageSize, filters, orderBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages]
  );

  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    setPageSize: setPageSizeHandler,
    refetch,
  };
}
