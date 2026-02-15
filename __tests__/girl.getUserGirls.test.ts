import { getUserGirls } from '@/lib/actions/girl.actions';
import { connectToDatabase } from '@/lib/database/mongoose';
import Girl from '@/lib/database/models/girl.model';
import User from '@/lib/database/models/user.model';
import { auth } from '@clerk/nextjs';

// Mocks
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/girl.model', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
}));

describe('getUserGirls', () => {
    const mockUserId = 'user_db_id';
    const mockClerkId = 'user_clerk_id';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        // Mock user lookup
        (User.findOne as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: mockUserId })
        });
    });

    it('should return girls with pagination', async () => {
        const mockGirls = [
            {
                _id: 'girl_1',
                name: 'Girl 1',
                author: mockUserId,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02')
            },
            {
                _id: 'girl_2',
                name: 'Girl 2',
                author: mockUserId,
                createdAt: new Date('2023-01-03'),
                updatedAt: new Date('2023-01-04')
            }
        ];
        const totalCount = 10;

        // Mock chain: find -> sort -> skip -> limit -> lean -> exec
        const mockExec = jest.fn().mockResolvedValue(mockGirls);
        const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
        const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
        const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
        const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
        (Girl.find as jest.Mock).mockReturnValue({ sort: mockSort });

        (Girl.countDocuments as jest.Mock).mockResolvedValue(totalCount);

        const result = await getUserGirls({ userId: mockUserId, page: 1, limit: 2 });

        expect(result).toBeDefined();
        if (!result) return;

        expect(result.totalPages).toBe(5); // 10 / 2 = 5
        expect(result.data).toHaveLength(2);

        // Check if data is serialized correctly
        expect(result.data[0]._id).toBe('girl_1');
        expect(result.data[0].author).toBe(mockUserId);

        // JSON.stringify converts Date to string
        expect(typeof result.data[0].createdAt).toBe('string');
        expect(result.data[0].createdAt).toBe(mockGirls[0].createdAt.toISOString());
    });
});
