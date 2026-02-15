import { analyzeConversation } from '@/lib/actions/analysis.actions';
import { openrouter } from '@/lib/openrouter';
import { deductCredits } from '@/lib/services/user.service';
import User from '@/lib/database/models/user.model';
import Girl from '@/lib/database/models/girl.model';
import Message from '@/lib/database/models/message.model';
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

jest.mock('@/lib/services/user.service', () => ({
  deductCredits: jest.fn(),
}));

jest.mock('@/lib/services/usage.service', () => ({
  logUsage: jest.fn(),
}));

jest.mock('@/lib/services/logger.service', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  }
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

jest.mock('@/lib/database/models/message.model', () => ({
  find: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/services/email.service", () => ({
    sendEmail: jest.fn(),
}));

describe('Conversation Analysis', () => {
    const mockGirlId = 'girl123';
    const mockUserId = 'user123';
    const mockUser = {
        _id: mockUserId,
        creditBalance: 10,
        email: 'test@example.com',
        settings: { lowBalanceAlerts: true }
    };
    const mockGirl = {
        _id: mockGirlId,
        author: mockUserId,
    };
    const mockMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'girl', content: 'Hi' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user' });
        (connectToDatabase as jest.Mock).mockResolvedValue(true);
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);

        // Mock chainable Message.find
        const mockQuery = {
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockMessages),
        };
        (Message.find as jest.Mock).mockReturnValue(mockQuery);

        (deductCredits as jest.Mock).mockResolvedValue({ ...mockUser, creditBalance: 9 });
    });

    it('should analyze conversation successfully', async () => {
        const mockAnalysis = {
            score: 85,
            summary: "Good chat",
            strengths: ["Polite"],
            weaknesses: ["Short"],
            tips: "Ask more."
        };

        (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
            choices: [{ message: { content: JSON.stringify(mockAnalysis) } }],
        });

        const result = await analyzeConversation(mockGirlId);

        expect(User.findOne).toHaveBeenCalled();
        expect(Girl.findById).toHaveBeenCalledWith(mockGirlId);
        expect(Message.find).toHaveBeenCalledWith({ girl: mockGirlId });
        expect(openrouter.chat.completions.create).toHaveBeenCalled();
        expect(deductCredits).toHaveBeenCalledWith(mockUserId, 1);
        expect(result).toEqual(mockAnalysis);
    });

    it('should throw error if user has insufficient credits', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({ ...mockUser, creditBalance: 0 });

        const result = await analyzeConversation(mockGirlId);

        expect(result).toBeNull();
        expect(openrouter.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should throw error if unauthorized', async () => {
        (Girl.findById as jest.Mock).mockResolvedValue({ ...mockGirl, author: 'otherUser' });

        const result = await analyzeConversation(mockGirlId);

        expect(result).toBeNull();
    });

    it('should handle AI JSON parse error', async () => {
        (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
            choices: [{ message: { content: "Bad JSON" } }],
        });

        const result = await analyzeConversation(mockGirlId);

        expect(result).toBeNull();
        expect(deductCredits).not.toHaveBeenCalled(); // Should not deduct if failed
    });
});
