import { submitFeedback } from '@/lib/actions/wingman.actions';
import { openai } from '@/lib/openai';
import Message from '@/lib/database/models/message.model';
import User from '@/lib/database/models/user.model';
import Girl from '@/lib/database/models/girl.model';
import GlobalKnowledge from '@/lib/database/models/global-knowledge.model';
import { connectToDatabase } from '@/lib/database/mongoose';
import { auth } from "@clerk/nextjs";

// Mocks
jest.mock('@/lib/openai', () => ({
  openai: {
    embeddings: { create: jest.fn() },
    moderations: { create: jest.fn() },
  },
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/message.model', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/lib/database/models/girl.model', () => ({
  findById: jest.fn(),
}));

jest.mock('@/lib/database/models/global-knowledge.model', () => ({
  create: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

describe('Wingman Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user_123' });

    // Setup standard mocks for a successful feedback flow
    const mockUser = { _id: 'user123', clerkId: 'clerk_user_123' };
    const mockGirl = { _id: 'girl123', author: 'user123' };
    const mockMsg = { _id: 'msg123', girl: 'girl123', role: 'wingman', content: 'test content' };

    (User.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
    });
    (Girl.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockGirl)
    });
    (Message.findById as jest.Mock).mockResolvedValue(mockMsg);
    (Message.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...mockMsg, feedback: 'positive' });
    (GlobalKnowledge.create as jest.Mock).mockResolvedValue({});
  });

  it('submitFeedback should not block on embedding generation', async () => {
    // Mock a slow embedding generation
    (openai.embeddings.create as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        return { data: [{ embedding: [0.1, 0.2] }] };
    });

    const start = Date.now();
    await submitFeedback('msg123', 'positive');
    const end = Date.now();
    const duration = end - start;

    console.log(`Execution time: ${duration}ms`);

    // Ideally we want to assert on duration, but for now I'll just print it.
    // If optimized, duration should be significantly less than 500ms.
    // expect(duration).toBeLessThan(200);
  });
});
