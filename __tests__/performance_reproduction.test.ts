import { generateWingmanReply } from '@/lib/actions/wingman.actions';
import { openrouter } from '@/lib/openrouter';
import { getGirlById } from '@/lib/actions/girl.actions';
import { getContext } from '@/lib/actions/rag.actions';
import { getUserContext } from '@/lib/actions/user-knowledge.actions';
import { updateGamification } from '@/lib/services/gamification.service';
import User from '@/lib/database/models/user.model';
import { connectToDatabase } from '@/lib/database/mongoose';
import { auth } from "@clerk/nextjs";
import { sendEmail } from '@/lib/services/email.service';

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
    moderations: { create: jest.fn().mockResolvedValue({ results: [{ flagged: false }] }) }, // Safe content
    embeddings: { create: jest.fn().mockResolvedValue({ data: [{ embedding: [] }] }) },
  },
}));

jest.mock('@/lib/actions/girl.actions', () => ({
  getGirlById: jest.fn(),
}));

jest.mock('@/lib/actions/rag.actions', () => ({
  getContext: jest.fn(),
}));

jest.mock('@/lib/actions/user-knowledge.actions', () => ({
  getUserContext: jest.fn(),
}));

jest.mock('@/lib/actions/global-rag.actions', () => ({
    getGlobalKnowledge: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/services/gamification.service', () => ({
  updateGamification: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/services/email.service', () => ({
  sendEmail: jest.fn(),
}));

describe('Wingman Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user_123' });
    // Initial user find
    (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user123', creditBalance: 10 });
    // Update deducts credit, returning 9 (triggering low balance check < 10)
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: 'user123', creditBalance: 9, email: 'test@example.com' });
    (updateGamification as jest.Mock).mockResolvedValue({ newBadges: [] });

    // Setup Mock Email with Delay
    (sendEmail as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    });
  });

  it('measures execution time of generateWingmanReply', async () => {
    const mockGirl = {
      _id: 'girl123',
      name: 'Jessica',
      vibe: 'Fun',
      relationshipStatus: 'Dating',
      author: 'user123',
      dialect: 'English',
      language: 'en'
    };

    (getGirlById as jest.Mock).mockResolvedValue(mockGirl);
    (getContext as jest.Mock).mockResolvedValue([]);
    (getUserContext as jest.Mock).mockResolvedValue([]);

    const mockAiResponse = {
      reply: 'Hello there',
      explanation: 'Greetings',
    };

    (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockAiResponse) } }],
    });

    const start = Date.now();
    await generateWingmanReply('girl123', 'Hi');
    const end = Date.now();
    const duration = end - start;

    console.log(`Execution time: ${duration}ms`);

    // Expect it to be fast (non-blocking email)
    expect(duration).toBeLessThan(200);

    expect(sendEmail).toHaveBeenCalled();
  });
});
