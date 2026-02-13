import { getChatHistory, togglePinGirl } from '@/lib/actions/girl.actions';
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
  findOneAndUpdate: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/lib/database/models/message.model', () => ({
  find: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Girl Actions', () => {
    const mockUserId = 'user_db_id';
    const mockClerkId = 'user_clerk_id';
    const mockGirlId = 'girl_id';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (User.findOne as jest.Mock).mockResolvedValue({ _id: mockUserId });
    });

    describe('getChatHistory', () => {
        it('should return messages if authorized', async () => {
             const mockGirl = { _id: mockGirlId, author: mockUserId };
             const mockMessages = [{ content: 'Hi' }, { content: 'Hello' }];

             (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);

             const mockSort = jest.fn().mockResolvedValue(mockMessages);
             (Message.find as jest.Mock).mockReturnValue({ sort: mockSort });

             const result = await getChatHistory(mockGirlId);

             expect(Girl.findById).toHaveBeenCalledWith(mockGirlId);
             expect(Message.find).toHaveBeenCalledWith({ girl: mockGirlId });
             expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
             expect(result).toEqual(mockMessages);
        });

        it('should throw if girl not found', async () => {
            (Girl.findById as jest.Mock).mockResolvedValue(null);
            // handleError wraps it, but essentially it should fail
            await expect(getChatHistory(mockGirlId)).rejects.toThrow();
        });

        it('should throw if unauthorized (not owner)', async () => {
             const mockGirl = { _id: mockGirlId, author: 'other_user' };
             (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);

             await expect(getChatHistory(mockGirlId)).rejects.toThrow();
        });
    });

    describe('togglePinGirl', () => {
        it('should toggle isPinned status', async () => {
            const mockGirl = { _id: mockGirlId, author: mockUserId, isPinned: false };
            const updatedGirl = { ...mockGirl, isPinned: true };

            (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);
            (Girl.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedGirl);

            const result = await togglePinGirl(mockGirlId);

            expect(Girl.findById).toHaveBeenCalledWith(mockGirlId);
            expect(Girl.findByIdAndUpdate).toHaveBeenCalledWith(
                mockGirlId,
                { isPinned: true },
                { new: true }
            );
            expect(result).toEqual(updatedGirl);
        });

         it('should throw if unauthorized', async () => {
             const mockGirl = { _id: mockGirlId, author: 'other_user', isPinned: false };
             (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);

             await expect(togglePinGirl(mockGirlId)).rejects.toThrow();
        });
    });
});
