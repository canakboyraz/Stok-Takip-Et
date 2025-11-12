/**
 * Mock Supabase client for testing
 * This allows testing without real database connections
 */

export const createMockSupabaseClient = () => {
  const mockAuth = {
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
      },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-access-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
      },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    }),
    onAuthStateChange: jest.fn((callback) => {
      // Simulate initial session
      callback('SIGNED_IN', {
        access_token: 'mock-access-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      });
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    }),
  };

  const createMockQuery = (data: any[] = []) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: data[0] || null,
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: data[0] || null,
      error: null,
    }),
    then: jest.fn((resolve) =>
      resolve({
        data,
        error: null,
      })
    ),
  });

  const mockFrom = jest.fn((table: string) => createMockQuery([]));

  const mockRpc = jest.fn().mockResolvedValue({
    data: null,
    error: null,
  });

  return {
    auth: mockAuth,
    from: mockFrom,
    rpc: mockRpc,
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        }),
        download: jest.fn().mockResolvedValue({
          data: new Blob(),
          error: null,
        }),
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    },
  };
};

/**
 * Mock Supabase error
 */
export const createMockSupabaseError = (message: string, code?: string) => ({
  message,
  code: code || 'MOCK_ERROR',
  details: null,
  hint: null,
});

/**
 * Mock successful Supabase response
 */
export const createMockSupabaseResponse = <T>(data: T) => ({
  data,
  error: null,
});

/**
 * Mock failed Supabase response
 */
export const createMockSupabaseErrorResponse = (message: string) => ({
  data: null,
  error: createMockSupabaseError(message),
});

export default createMockSupabaseClient;
