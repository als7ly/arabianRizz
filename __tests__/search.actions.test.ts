import { searchMessages } from '@/lib/actions/girl.actions';
import { connectToDatabase } from '@/lib/database/mongoose';
import Girl from '@/lib/database/models/girl.model';
import User from '@/lib/database/models/user.model';
import Message from '@/lib/database/models/message.model';
import { auth } from '@clerk/nextjs';

// Mocks
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/girl.model', () => ({
  findById: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/lib/database/models/message.model', () => ({
  find: jest.fn(),
}));

describe('Search Actions', () => {
    const mockUserId = 'user_db_id';
    const mockClerkId = 'user_clerk_id';
    const mockGirlId = 'girl_id';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (User.findOne as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: mockUserId })
        });
    });

    describe('searchMessages', () => {
        it('should return matching messages if authorized', async () => {
             const mockGirl = { _id: mockGirlId, author: mockUserId };
             const mockMessages = [{ content: 'Hello there' }];
             const query = "Hello";

             (Girl.findById as jest.Mock).mockReturnValue({
                 lean: jest.fn().mockResolvedValue(mockGirl)
             });

             const mockLean = jest.fn().mockResolvedValue(mockMessages);
             const mockSort = jest.fn().mockReturnValue({ lean: mockLean });
             (Message.find as jest.Mock).mockReturnValue({ sort: mockSort });

             const result = await searchMessages(mockGirlId, query);

             expect(Girl.findById).toHaveBeenCalledWith(mockGirlId);
             expect(Message.find).toHaveBeenCalledWith({
                 girl: mockGirlId,
                 content: { $regex: 'Hello', $options: 'i' }
             });
             expect(result.success).toBe(true);
             expect(result.data).toEqual(mockMessages);
        });

        it('should return empty if query is empty', async () => {
             const mockGirl = { _id: mockGirlId, author: mockUserId };
             (Girl.findById as jest.Mock).mockReturnValue({
                 lean: jest.fn().mockResolvedValue(mockGirl)
             });

             const result = await searchMessages(mockGirlId, "   ");
             expect(result.success).toBe(true);
             expect(result.data).toEqual([]);
             expect(Message.find).not.toHaveBeenCalled();
        });

        it('should return error if unauthorized', async () => {
             const mockGirl = { _id: mockGirlId, author: 'other_user' };
             (Girl.findById as jest.Mock).mockReturnValue({
                 lean: jest.fn().mockResolvedValue(mockGirl)
             });

             const result = await searchMessages(mockGirlId, "Hello");
             expect(result.success).toBe(false);
             expect(result.error).toBe("Unauthorized");
        });

        it('should escape regex special characters', async () => {
             const mockGirl = { _id: mockGirlId, author: mockUserId };
             const query = "Hello?";

             (Girl.findById as jest.Mock).mockReturnValue({
                 lean: jest.fn().mockResolvedValue(mockGirl)
             });

             const mockLean = jest.fn().mockResolvedValue([]);
             const mockSort = jest.fn().mockReturnValue({ lean: mockLean });
             (Message.find as jest.Mock).mockReturnValue({ sort: mockSort });

             await searchMessages(mockGirlId, query);

             expect(Message.find).toHaveBeenCalledWith({
                 girl: mockGirlId,
                 content: { $regex: 'Hello\\?', $options: 'i' }
             });
        });
    });
});
