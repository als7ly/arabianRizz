
import { getTransactions } from '@/lib/actions/transaction.actions';
import { connectToDatabase } from '@/lib/database/mongoose';
import Transaction from '@/lib/database/models/transaction.model';
import User from '@/lib/database/models/user.model';
import { auth } from '@clerk/nextjs';

// Mocks
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
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
});
