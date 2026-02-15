
import { createCustomerPortalSession } from '@/lib/actions/transaction.actions';
import { connectToDatabase } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import { auth } from '@clerk/nextjs';

// Mocks
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

// We need to mock the User model specifically to track calls
// Since the real implementation imports User, we need to ensure the mock is used
jest.mock('@/lib/database/models/user.model', () => {
  return {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
});

// Mock Stripe
const mockSessionsCreate = jest.fn();
const mockCustomersList = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    billingPortal: {
      sessions: {
        create: mockSessionsCreate,
      },
    },
    customers: {
      list: mockCustomersList,
    },
  }));
});

describe('createCustomerPortalSession', () => {
    const mockClerkId = 'user_clerk_id';
    const mockUserId = 'user_db_id';
    const mockUserEmail = 'test@example.com';
    const mockStripeCustomerId = 'cus_12345';
    const mockPortalUrl = 'http://test-portal-url.com';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        mockSessionsCreate.mockResolvedValue({ url: mockPortalUrl });
    });

    it('should use existing stripeCustomerId if available', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({
            _id: mockUserId,
            email: mockUserEmail,
            stripeCustomerId: mockStripeCustomerId,
        });

        const url = await createCustomerPortalSession();

        expect(url).toBe(mockPortalUrl);
        expect(mockSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({
            customer: mockStripeCustomerId,
        }));
        // Should NOT lookup customer
        expect(mockCustomersList).not.toHaveBeenCalled();
        // Should NOT update user
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should lookup and persist stripeCustomerId if missing', async () => {
        // User has no stripeCustomerId
        (User.findOne as jest.Mock).mockResolvedValue({
            _id: mockUserId,
            email: mockUserEmail,
            stripeCustomerId: undefined,
        });

        // Stripe lookup finds a customer
        mockCustomersList.mockResolvedValue({
            data: [{ id: mockStripeCustomerId }],
        });

        const url = await createCustomerPortalSession();

        expect(url).toBe(mockPortalUrl);

        // Should have looked up customer
        expect(mockCustomersList).toHaveBeenCalledWith(expect.objectContaining({
            email: mockUserEmail,
        }));

        // Should have used the found ID
        expect(mockSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({
            customer: mockStripeCustomerId,
        }));

        // CRITICAL: Should have persisted the found ID
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            mockUserId,
            { stripeCustomerId: mockStripeCustomerId }
        );
    });

    it('should handle failure to save gracefully', async () => {
        // User has no stripeCustomerId
        (User.findOne as jest.Mock).mockResolvedValue({
            _id: mockUserId,
            email: mockUserEmail,
            stripeCustomerId: undefined,
        });

        // Stripe lookup finds a customer
        mockCustomersList.mockResolvedValue({
            data: [{ id: mockStripeCustomerId }],
        });

        // Save fails
        (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error("DB Error"));

        const url = await createCustomerPortalSession();

        // Should still succeed in returning the URL
        expect(url).toBe(mockPortalUrl);

        // Verify it TRIED to update
        expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });
});
