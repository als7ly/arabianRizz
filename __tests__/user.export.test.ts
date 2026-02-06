import { exportAllUserData } from '@/lib/actions/user.actions';
import User from '@/lib/database/models/user.model';
import Girl from '@/lib/database/models/girl.model';
import Message from '@/lib/database/models/message.model';
import UserKnowledge from '@/lib/database/models/user-knowledge.model';
import { connectToDatabase } from '@/lib/database/mongoose';
import { auth } from "@clerk/nextjs";

// Mocks
jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/lib/database/models/girl.model', () => ({
  find: jest.fn(),
}));

jest.mock('@/lib/database/models/message.model', () => ({
  find: jest.fn(),
}));

jest.mock('@/lib/database/models/user-knowledge.model', () => ({
  find: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

describe('User Actions - Export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user_123' });
  });

  it('should export all user data successfully', async () => {
    // Mock Data
    const mockUser = {
      _id: 'user123',
      clerkId: 'clerk_user_123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      createdAt: new Date('2023-01-01'),
      creditBalance: 100,
      badges: ['Newbie'],
    };

    const mockPersona = [
      { content: 'I like dogs', createdAt: new Date('2023-01-02') },
    ];

    const mockGirls = [
      { _id: 'girl1', name: 'Alice', vibe: 'Cool', author: 'user123', createdAt: new Date('2023-01-03') },
    ];

    const mockMessages = [
      { role: 'user', content: 'Hi', createdAt: new Date('2023-01-03'), feedback: null },
      { role: 'wingman', content: 'Hello', createdAt: new Date('2023-01-03'), feedback: 'positive' },
    ];

    // Setup Mocks
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (UserKnowledge.find as jest.Mock).mockResolvedValue(mockPersona);
    (Girl.find as jest.Mock).mockResolvedValue(mockGirls);

    // Mock Message.find().sort() chain
    const mockSort = jest.fn().mockResolvedValue(mockMessages);
    (Message.find as jest.Mock).mockReturnValue({ sort: mockSort });

    const result = await exportAllUserData();

    expect(connectToDatabase).toHaveBeenCalled();
    expect(auth).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk_user_123' });
    expect(UserKnowledge.find).toHaveBeenCalledWith({ user: 'user123' });
    expect(Girl.find).toHaveBeenCalledWith({ author: 'user123' });
    expect(Message.find).toHaveBeenCalledWith({ girl: 'girl1' });

    // Verify Structure
    expect(result).toEqual({
      user: {
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        createdAt: expect.any(String), // Dates are stringified
        creditBalance: 100,
        badges: ['Newbie'],
      },
      persona: [
        { content: 'I like dogs', createdAt: expect.any(String) },
      ],
      chats: [
        {
          girl: {
            name: 'Alice',
            vibe: 'Cool',
            createdAt: expect.any(String),
            // dialect, relationshipStatus are undefined in mock, so they won't appear in JSON.parse(JSON.stringify) result if undefined
          },
          messages: [
            { role: 'user', content: 'Hi', createdAt: expect.any(String), feedback: null },
            { role: 'wingman', content: 'Hello', createdAt: expect.any(String), feedback: 'positive' },
          ],
        },
      ],
    });
  });

  it('should throw error if not authenticated', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: null });

    await expect(exportAllUserData()).rejects.toThrow('Error: Unauthorized');
  });
});
