import { generateDateIdea } from '@/lib/actions/wingman.actions';
import { openrouter } from '@/lib/openrouter';
import { generateEmbedding, retrieveUserContext } from '@/lib/services/rag.service';
import { updateGamification } from '@/lib/services/gamification.service';
import User from '@/lib/database/models/user.model';
import Girl from '@/lib/database/models/girl.model';
import { connectToDatabase } from '@/lib/database/mongoose';
import { auth } from "@clerk/nextjs";

// Mocks
jest.mock('@/lib/openrouter', () => ({
  openrouter: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  WINGMAN_MODEL: 'mock-model',
}));

jest.mock('@/lib/openai', () => ({
    openai: {
      embeddings: { create: jest.fn() },
      moderations: { create: jest.fn().mockResolvedValue({ results: [{ flagged: false }] }) },
    },
}));

jest.mock('@/lib/services/rag.service', () => ({
  generateEmbedding: jest.fn(),
  retrieveUserContext: jest.fn(),
  retrieveContext: jest.fn(),
}));

jest.mock('@/lib/actions/global-rag.actions', () => ({
    getGlobalKnowledge: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/services/gamification.service', () => ({
  updateGamification: jest.fn(),
}));

jest.mock('@/lib/services/user.service', () => ({
  deductCredits: jest.fn(),
  refundCredits: jest.fn(),
}));

jest.mock('@/lib/services/usage.service', () => ({
  logUsage: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/lib/database/models/girl.model', () => ({
  findById: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

describe('generateDateIdea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockUser = { _id: 'user123', clerkId: 'clerk_user_123', email: 'test@test.com', creditBalance: 10 };
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user_123' });
    (User.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
    });
    (updateGamification as jest.Mock).mockResolvedValue({ newBadges: [] });

    const { deductCredits } = require('@/lib/services/user.service');
    (deductCredits as jest.Mock).mockImplementation((userId: string, amount: number) => {
        return Promise.resolve({ ...mockUser, creditBalance: mockUser.creditBalance - amount });
    });
  });

  const mockGirl = {
    _id: 'girl123',
    name: 'Jessica',
    vibe: 'Fun',
    relationshipStatus: 'Dating',
    author: 'user123',
    dialect: 'English',
  };

  it('should generate date idea successfully', async () => {
    (Girl.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockGirl)
    });
    (retrieveUserContext as jest.Mock).mockResolvedValue([{ content: 'Context' }]);
    (generateEmbedding as jest.Mock).mockResolvedValue([0.1]);

    const mockResponse = {
      idea: 'Go to a jazz club.',
      explanation: 'Classy and intimate.',
      locationType: 'Activity'
    };

    (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockResponse) } }],
    });

    const result = await generateDateIdea('girl123');

    expect(Girl.findById).toHaveBeenCalledWith('girl123');
    expect(openrouter.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: expect.stringContaining('Generate a CREATIVE, PERSONALIZED DATE IDEA') })
        ])
    }));
    expect(result).toEqual({ ...mockResponse, newBadges: [], newBalance: 9 });
  });

  it('should refund credits if API fails', async () => {
      const { deductCredits, refundCredits } = require('@/lib/services/user.service');
      (Girl.findById as jest.Mock).mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockGirl)
      });
      (openrouter.chat.completions.create as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await generateDateIdea('girl123');

      expect(deductCredits).toHaveBeenCalledWith('user123', 1);
      expect(refundCredits).toHaveBeenCalledWith('user123', 1);
      expect(result.explanation).toBe("Something went wrong.");
  });

  it('should handle insufficient credits', async () => {
       const { deductCredits } = require('@/lib/services/user.service');
       (Girl.findById as jest.Mock).mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockGirl)
      });
       (deductCredits as jest.Mock).mockRejectedValue(new Error('Insufficient funds'));

       const result = await generateDateIdea('girl123');

       expect(result.explanation).toBe("Insufficient credits.");
  });
});
