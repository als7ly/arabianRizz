import { toggleSaveMessage, getSavedMessages, deleteSavedMessage } from '@/lib/actions/saved-message.actions';
import { connectToDatabase } from '@/lib/database/mongoose';
import SavedMessage from '@/lib/database/models/saved-message.model';
import Message from '@/lib/database/models/message.model';
import User from '@/lib/database/models/user.model';
import { auth } from '@clerk/nextjs';
import { revalidatePath } from 'next/cache';

// Mocks
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/saved-message.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndDelete: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('@/lib/database/models/message.model', () => ({
  findById: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Saved Message Actions', () => {
    const mockUserId = 'user_db_id';
    const mockClerkId = 'user_clerk_id';
    const mockMessageId = 'msg_id';
    const mockPath = '/chat';

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (User.findOne as jest.Mock).mockResolvedValue({ _id: mockUserId });
    });

    describe('toggleSaveMessage', () => {
        it('should save a message if not already saved', async () => {
            (SavedMessage.findOne as jest.Mock).mockResolvedValue(null);
            (Message.findById as jest.Mock).mockResolvedValue({ content: 'Hello' });
            (SavedMessage.create as jest.Mock).mockResolvedValue({});

            const result = await toggleSaveMessage(mockMessageId, mockPath);

            expect(SavedMessage.create).toHaveBeenCalledWith({
                user: mockUserId,
                message: mockMessageId,
                content: 'Hello',
            });
            expect(result).toEqual({ isSaved: true, message: 'Message saved!' });
            expect(revalidatePath).toHaveBeenCalledWith(mockPath);
        });

        it('should unsave a message if already saved', async () => {
            (SavedMessage.findOne as jest.Mock).mockResolvedValue({ _id: 'saved_id' });

            const result = await toggleSaveMessage(mockMessageId, mockPath);

            expect(SavedMessage.findByIdAndDelete).toHaveBeenCalledWith('saved_id');
            expect(result).toEqual({ isSaved: false, message: 'Removed from saved lines.' });
        });

        it('should throw error if user not found', async () => {
             (User.findOne as jest.Mock).mockResolvedValue(null);
             await expect(toggleSaveMessage(mockMessageId, mockPath)).rejects.toThrow('Failed to toggle save message');
        });
    });

    describe('getSavedMessages', () => {
        it('should return saved messages', async () => {
            const mockSaved = [{ _id: '1', content: 'Hi' }];
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnValue(mockSaved),
            };
            (SavedMessage.find as jest.Mock).mockReturnValue(mockFind);

            const result = await getSavedMessages();

            expect(SavedMessage.find).toHaveBeenCalledWith({ user: mockUserId });
            expect(result).toEqual(mockSaved);
        });
    });

    describe('deleteSavedMessage', () => {
        it('should delete saved message', async () => {
            (SavedMessage.findById as jest.Mock).mockResolvedValue({ user: mockUserId });

            const result = await deleteSavedMessage('saved_id', mockPath);

            expect(SavedMessage.findByIdAndDelete).toHaveBeenCalledWith('saved_id');
            expect(result).toEqual({ success: true, message: 'Removed from saved lines.' });
        });

         it('should throw unauthorized if user does not own saved message', async () => {
            (SavedMessage.findById as jest.Mock).mockResolvedValue({ user: 'other_user' });

            await expect(deleteSavedMessage('saved_id', mockPath)).rejects.toThrow('Failed to delete saved message');
        });
    });
});
