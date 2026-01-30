import { render, screen, waitFor } from '@testing-library/react';
import CreditBalance from '@/components/shared/CreditBalance';
import { getUserById } from '@/lib/actions/user.actions';

// Mock the server action
jest.mock('@/lib/actions/user.actions', () => ({
  getUserById: jest.fn(),
}));

describe('CreditBalance', () => {
  it('renders loading state initially', () => {
    // Mock user data with delay effectively simulating loading
    (getUserById as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { container } = render(<CreditBalance userId="user_123" />);
    // Check for skeleton or loading state
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders credit balance correctly', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ creditBalance: 10 });

    render(<CreditBalance userId="user_123" />);

    await waitFor(() => {
      expect(screen.getByText('10 Credits')).toBeInTheDocument();
    });
  });

  it('applies low balance styling when credits < 3', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ creditBalance: 2 });

    render(<CreditBalance userId="user_123" />);

    await waitFor(() => {
        const badge = screen.getByText('2 Credits');
        expect(badge).toHaveClass('bg-red-100');
        expect(badge).toHaveClass('text-red-700');
    });
  });

  it('applies normal styling when credits >= 3', async () => {
    (getUserById as jest.Mock).mockResolvedValue({ creditBalance: 5 });

    render(<CreditBalance userId="user_123" />);

    await waitFor(() => {
        const badge = screen.getByText('5 Credits');
        expect(badge).toHaveClass('bg-purple-100');
        expect(badge).toHaveClass('text-purple-700');
    });
  });
});
