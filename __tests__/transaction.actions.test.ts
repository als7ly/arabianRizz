
import { getTransactions, checkoutCredits } from '@/lib/actions/transaction.actions';
import { connectToDatabase } from '@/lib/database/mongoose';
import Transaction from '@/lib/database/models/transaction.model';
import User from '@/lib/database/models/user.model';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

// Mocks
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/transaction.model', () => ({
  find: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
}));

// Mock Stripe
const mockSessionsCreate = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionsCreate,
      },
    },
  }));
});

describe('Transaction Actions Security', () => {
    const mockClerkId = 'user_clerk_id';
    const mockUserId = 'user_db_id';
    const otherUserId = 'other_user_db_id';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (User.findOne as jest.Mock).mockResolvedValue({ _id: mockUserId });

        const mockSort = jest.fn().mockResolvedValue([]);
        (Transaction.find as jest.Mock).mockReturnValue({ sort: mockSort });
    });

    describe('getTransactions', () => {
        it('should fetch transactions if authorized', async () => {
             await getTransactions(mockUserId);
             expect(Transaction.find).toHaveBeenCalledWith({ buyer: mockUserId });
        });

        it('should NOT fetch transactions if requesting another user data (IDOR)', async () => {
             // Attempt to fetch other user's transactions
             const result = await getTransactions(otherUserId);

             // Should verify auth first
             expect(User.findOne).toHaveBeenCalledWith({ clerkId: mockClerkId });

             // Should NOT query transactions for the other user
             expect(Transaction.find).not.toHaveBeenCalled();

             // Should return empty array (due to catch block or explicit return)
             expect(result).toEqual([]);
        });

        it('should NOT fetch transactions if unauthenticated', async () => {
             (auth as jest.Mock).mockReturnValue({ userId: null });

             const result = await getTransactions(mockUserId);

             expect(Transaction.find).not.toHaveBeenCalled();
             expect(result).toEqual([]);
        });
    });

    describe('checkoutCredits', () => {
        it('should create a checkout session for the authenticated user', async () => {
            const transactionParams = {
                plan: 'Starter Pack',
                amount: 9.99,
                credits: 100,
                buyerId: mockUserId, // Correct user
            };

            // Mock successful session creation
            mockSessionsCreate.mockResolvedValue({ url: 'http://test-checkout-url.com' });

            await checkoutCredits(transactionParams);

            expect(mockSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({
                metadata: expect.objectContaining({
                    buyerId: mockUserId
                })
            }));
        });

        it('should NOT allow IDOR by using buyerId from input when it differs from auth user', async () => {
            const transactionParams = {
                plan: 'Starter Pack',
                amount: 9.99,
                credits: 100,
                buyerId: otherUserId, // Attacker tries to pay for/as someone else
            };

            mockSessionsCreate.mockResolvedValue({ url: 'http://test-checkout-url.com' });

            await checkoutCredits(transactionParams);

            // Expectation: The metadata.buyerId should be OVERRIDDEN with the authenticated user's ID (mockUserId)
            // If the vulnerability exists, this test will FAIL because it will use otherUserId
            expect(mockSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({
                metadata: expect.objectContaining({
                    buyerId: mockUserId // It MUST be the authenticated user
                })
            }));
        });
    });
});
