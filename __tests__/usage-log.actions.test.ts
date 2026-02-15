import { getUserUsage } from '@/lib/actions/usage-log.actions';
import { logUsage } from '@/lib/services/usage.service';
import { deductCredits } from '@/lib/services/user.service';
import UsageLog from '@/lib/database/models/usage-log.model';
import User from '@/lib/database/models/user.model';
import { connectToDatabase } from '@/lib/database/mongoose';

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/usage-log.model', () => ({
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
}));

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
    it('should return paginated usage logs for a user when authorized', async () => {
      // Mock User.findOne to return a user whose _id matches the requested userId
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user1' });

      const mockLogs = [{ action: 'test', cost: 1 }];
      const mockLimit = jest.fn().mockReturnValue(mockLogs);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      (UsageLog.find as jest.Mock).mockReturnValue({ sort: mockSort });
      (UsageLog.countDocuments as jest.Mock).mockResolvedValue(15);

      const result = await getUserUsage('user1', 1, 10);

      expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
      expect(UsageLog.find).toHaveBeenCalledWith({ user: 'user1' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(UsageLog.countDocuments).toHaveBeenCalledWith({ user: 'user1' });

      expect(result).toEqual({
          data: mockLogs,
          totalPages: 2, // ceil(15/10)
          currentPage: 1
      });
    });

    it('should handle pagination correctly (page 2)', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user1' });

      const mockLogs = [{ action: 'test2', cost: 1 }];
      const mockLimit = jest.fn().mockReturnValue(mockLogs);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

      (UsageLog.find as jest.Mock).mockReturnValue({ sort: mockSort });
      (UsageLog.countDocuments as jest.Mock).mockResolvedValue(15);

      const result = await getUserUsage('user1', 2, 10);

      expect(mockSkip).toHaveBeenCalledWith(10); // (2-1)*10
      expect(result.currentPage).toBe(2);
    });

    it('should return empty result if user ID does not match', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({ _id: 'other_user' });

        const result = await getUserUsage('user1');

        expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
        expect(result).toEqual({ data: [], totalPages: 0, currentPage: 1 });
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
