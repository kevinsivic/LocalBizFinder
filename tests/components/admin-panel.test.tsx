import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPanel from '../../client/src/components/admin/AdminPanel';

// Mock the toast functions
vi.mock('../../client/src/hooks/use-toast', () => {
  return {
    useToast: () => ({
      toast: vi.fn()
    })
  };
});

// Mock API request
vi.mock('../../client/src/lib/queryClient', () => {
  return {
    apiRequest: vi.fn(),
    queryClient: {
      invalidateQueries: vi.fn()
    }
  };
});

describe('AdminPanel Component', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    vi.clearAllMocks();
  });
  
  it('should render when isOpen is true', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPanel isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
  });
  
  it('should not render when isOpen is false', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPanel isOpen={false} onClose={mockOnClose} />
      </QueryClientProvider>
    );
    
    expect(screen.queryByText(/Admin Panel/i)).not.toBeInTheDocument();
  });
  
  it('should call onClose when close button is clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPanel isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );
    
    // Get the close button and click it
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should have the expected admin tabs', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPanel isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );
    
    // Check that all tabs exist
    expect(screen.getByRole('tab', { name: /Issue Reports/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Users/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Businesses/i })).toBeInTheDocument();
  });
  
  it('should switch tabs when clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPanel isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    );
    
    // Get the Businesses tab and click it
    const businessesTab = screen.getByRole('tab', { name: /Businesses/i });
    fireEvent.click(businessesTab);
    
    // Check that the Businesses tab content is visible
    await waitFor(() => {
      expect(screen.getByText(/Manage Businesses/i)).toBeInTheDocument();
    });
    
    // Get the Users tab and click it
    const usersTab = screen.getByRole('tab', { name: /Users/i });
    fireEvent.click(usersTab);
    
    // Check that the Users tab content is visible
    await waitFor(() => {
      expect(screen.getByText(/Manage Users/i)).toBeInTheDocument();
    });
  });
});