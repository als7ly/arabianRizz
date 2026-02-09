import { logUsage, getUserUsage } from '@/lib/actions/usage-log.actions';
import { deductCredits } from '@/lib/actions/user.actions';
import UsageLog from '@/lib/database/models/usage-log.model';
import User from '@/lib/database/models/user.model';
import { connectToDatabase } from '@/lib/database/mongoose';

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/usage-log.model', () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
}));

// Mock Clerk auth if needed, though mostly used in user.actions functions we aren't testing or mocking
jest.mock("@clerk/nextjs", () => ({
    auth: jest.fn().mockReturnValue({ userId: 'clerk_user_123' }),
}));

describe('Usage Log Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
  });

  describe('logUsage', () => {
    it('should create a usage log entry', async () => {
      await logUsage({ userId: 'user1', action: 'message_generation', cost: 1 });
      expect(UsageLog.create).toHaveBeenCalledWith({
        user: 'user1',
        action: 'message_generation',
        cost: 1,
        metadata: undefined
      });
    });

    it('should handle errors gracefully (log to console)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (UsageLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await logUsage({ userId: 'user1', action: 'message_generation', cost: 1 });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getUserUsage', () => {
    it('should return usage logs for a user', async () => {
      const mockLogs = [{ action: 'test', cost: 1 }];
      const mockSort = jest.fn().mockReturnValue(mockLogs);
      (UsageLog.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await getUserUsage('user1');

      expect(UsageLog.find).toHaveBeenCalledWith({ user: 'user1' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockLogs);
    });
  });
});

describe('User Actions - Credits', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
    });

    describe('deductCredits', () => {
        it('should deduct credits successfully', async () => {
            const mockUser = { _id: 'user1', creditBalance: 9 };
            (User.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUser);

            const result = await deductCredits('user1', 1);

            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'user1', creditBalance: { $gte: 1 } },
                { $inc: { creditBalance: -1 } },
                { new: true }
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw error if insufficient credits', async () => {
            (User.findOneAndUpdate as jest.Mock).mockResolvedValue(null);
            (User.findById as jest.Mock).mockResolvedValue({ _id: 'user1' }); // User exists

            await expect(deductCredits('user1', 1)).rejects.toThrow('Insufficient credits');
        });
    });
});
