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

describe('Girl Actions Reproduction (ReDoS)', () => {
    const mockUserId = 'user_db_id';
    const mockClerkId = 'user_clerk_id';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (User.findOne as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: mockUserId })
        });
    });

    it('should use escaped query in regex', async () => {
        const query = '.'; // Special regex character
        const escapedQuery = '\\.'; // Escaped regex character
        const mockLean = jest.fn().mockResolvedValue([]);
        const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
        const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
        const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

        // Mock the initial find call to return the chainable object
        (Girl.find as jest.Mock).mockReturnValue({ sort: mockSort });
        (Girl.countDocuments as jest.Mock).mockResolvedValue(0);

        await getUserGirls({ userId: mockUserId, query });

        // Check if Girl.find was called with the escaped query in regex
        expect(Girl.find).toHaveBeenCalledWith(expect.objectContaining({
            $or: expect.arrayContaining([
                expect.objectContaining({ name: { $regex: escapedQuery, $options: 'i' } }),
                expect.objectContaining({ vibe: { $regex: escapedQuery, $options: 'i' } })
            ])
        }));
    });
});
