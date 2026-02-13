import { generateWingmanReply, analyzeProfile, generateHookupLine, submitFeedback, generateSpeech, generateResponseImage } from '@/lib/actions/wingman.actions';
import { openrouter } from '@/lib/openrouter';
import { openai } from '@/lib/openai';
import { getContext } from '@/lib/actions/rag.actions';
import { generateEmbedding, retrieveContext, retrieveUserContext } from '@/lib/services/rag.service';
import { getUserContext } from '@/lib/actions/user-knowledge.actions';
import { extractTextFromImage } from '@/lib/actions/ocr.actions';
import { updateGamification } from '@/lib/services/gamification.service';
import Message from '@/lib/database/models/message.model';
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
    images: { generate: jest.fn() },
    audio: { speech: { create: jest.fn() } },
    embeddings: { create: jest.fn() },
  },
}));

jest.mock('@/lib/actions/rag.actions', () => ({
  getContext: jest.fn(),
}));

jest.mock('@/lib/services/rag.service', () => ({
  generateEmbedding: jest.fn(),
  retrieveContext: jest.fn(),
  retrieveUserContext: jest.fn(),
}));

jest.mock('@/lib/actions/user-knowledge.actions', () => ({
  getUserContext: jest.fn(),
}));

jest.mock('@/lib/actions/ocr.actions', () => ({
  extractTextFromImage: jest.fn(),
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

jest.mock('@/lib/database/models/message.model', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
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

describe('Wingman Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockUser = { _id: 'user123', clerkId: 'clerk_user_123', email: 'test@test.com', creditBalance: 10 };
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user_123' });
    (User.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
    });
    (updateGamification as jest.Mock).mockResolvedValue({ newBadges: [] });

    // Mock deductCredits to return the updated user
    const { deductCredits } = require('@/lib/services/user.service');
    (deductCredits as jest.Mock).mockImplementation((userId: string, amount: number) => {
        return Promise.resolve({ ...mockUser, creditBalance: mockUser.creditBalance - amount });
    });
  });

  describe('generateWingmanReply', () => {
    const mockGirl = {
      _id: 'girl123',
      name: 'Jessica',
      vibe: 'Fun and adventurous',
      relationshipStatus: 'Dating',
      author: 'user123',
      dialect: 'Egyptian',
    };

    const mockContext = [{ role: 'user', content: 'Hi' }, { role: 'wingman', content: 'Hello' }];
    const mockUserContext = [{ content: 'User loves hiking' }];
    const mockEmbedding = [0.1, 0.2, 0.3];

    it('should generate a reply successfully with valid JSON response', async () => {
      (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);
      (retrieveContext as jest.Mock).mockResolvedValue(mockContext);
      (retrieveUserContext as jest.Mock).mockResolvedValue(mockUserContext);
      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      const mockAiResponse = {
        reply: 'Go for a hike together!',
        explanation: 'Because you both like it.',
      };

      (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockAiResponse) } }],
      });

      const result = await generateWingmanReply('girl123', 'I want to go hiking', 'Flirty');

      expect(Girl.findById).toHaveBeenCalledWith('girl123');
      expect(generateEmbedding).toHaveBeenCalledWith('I want to go hiking');
      expect(retrieveContext).toHaveBeenCalledWith('girl123', 'I want to go hiking', mockEmbedding);
      expect(retrieveUserContext).toHaveBeenCalledWith('user123', 'I want to go hiking', mockEmbedding);

      expect(openrouter.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
        model: 'mock-model',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: expect.stringContaining('She speaks the Egyptian Arabic dialect') }),
          expect.objectContaining({ role: 'user' }),
        ]),
      }));
      expect(result).toEqual({ ...mockAiResponse, newBadges: [] });
    });

    it('should handle invalid JSON from AI gracefully', async () => {
      (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);
      (retrieveContext as jest.Mock).mockResolvedValue([]);
      (retrieveUserContext as jest.Mock).mockResolvedValue([]);
      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: 'Not valid JSON' } }],
      });

      const result = await generateWingmanReply('girl123', 'Hi');

      expect(result).toEqual({
        reply: 'Not valid JSON',
        explanation: 'Could not parse AI response.',
        newBadges: []
      });
    });

    it('should handle errors gracefully', async () => {
      (Girl.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await generateWingmanReply('girl123', 'Hi');

      expect(result).toEqual({
        reply: 'Error generating reply.',
        explanation: 'Something went wrong with the AI.',
      });
    });

    it('should handle instruction sender role correctly', async () => {
        (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);
        (retrieveContext as jest.Mock).mockResolvedValue([]);
        (retrieveUserContext as jest.Mock).mockResolvedValue([]);
        (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

        const mockAiResponse = {
          reply: 'Sure, how about a picnic?',
          explanation: 'Picnics are romantic.',
        };

        (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(mockAiResponse) } }],
        });

        const result = await generateWingmanReply('girl123', 'Suggest a date', 'Flirty', 'instruction');

        expect(openrouter.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: expect.stringContaining('User Instruction: "Suggest a date"') }),
          ]),
        }));
        expect(result).toEqual({ ...mockAiResponse, newBadges: [] });
      });
  });

  describe('analyzeProfile', () => {
    it('should analyze profile successfully', async () => {
      (extractTextFromImage as jest.Mock).mockResolvedValue('Name: Sarah, Age: 25');

      const mockAnalysis = {
        name: 'Sarah',
        age: 25,
        vibe: 'Unknown',
        socialMediaHandle: null,
      };

      (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockAnalysis) } }],
      });

      const result = await analyzeProfile('http://example.com/image.jpg');

      expect(extractTextFromImage).toHaveBeenCalledWith('http://example.com/image.jpg');
      expect(result).toEqual(mockAnalysis);
    });

    it('should return null if OCR fails (returns empty)', async () => {
      (extractTextFromImage as jest.Mock).mockResolvedValue('');

      const result = await analyzeProfile('http://example.com/image.jpg');

      expect(result).toBeNull();
      expect(openrouter.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should return null on JSON parse error and refund credits', async () => {
        const { deductCredits, refundCredits } = require('@/lib/services/user.service');
        (extractTextFromImage as jest.Mock).mockResolvedValue('text');
        (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
            choices: [{ message: { content: 'Bad JSON' } }],
        });

        const result = await analyzeProfile('url');
        expect(result).toBeNull();
        expect(deductCredits).toHaveBeenCalled();
        expect(refundCredits).toHaveBeenCalled();
    });
  });

  describe('generateSpeech', () => {
    it('should generate speech successfully and deduct credits', async () => {
        const { deductCredits } = require('@/lib/services/user.service');
        const { logUsage } = require('@/lib/services/usage.service');

        const mockAudioResponse = {
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
        };
        (openai.audio.speech.create as jest.Mock).mockResolvedValue(mockAudioResponse);

        const result = await generateSpeech('Hello world', 'nova');

        expect(deductCredits).toHaveBeenCalledWith('user123', 1);
        expect(logUsage).toHaveBeenCalledWith(expect.objectContaining({ action: 'speech_generation', cost: 1 }));
        expect(result).toContain('data:audio/mp3;base64,');
    });

    it('should refund credits if OpenAI fails', async () => {
        const { deductCredits, refundCredits } = require('@/lib/services/user.service');
        (openai.audio.speech.create as jest.Mock).mockRejectedValue(new Error('OpenAI Error'));

        await expect(generateSpeech('Hello', 'nova')).rejects.toThrow('OpenAI Error');

        expect(deductCredits).toHaveBeenCalledWith('user123', 1);
        expect(refundCredits).toHaveBeenCalledWith('user123', 1);
    });
  });

  describe('generateResponseImage', () => {
      it('should generate image successfully and deduct 3 credits', async () => {
          const { deductCredits } = require('@/lib/services/user.service');
          const { logUsage } = require('@/lib/services/usage.service');

          (openai.images.generate as jest.Mock).mockResolvedValue({
              data: [{ url: 'http://image.url' }]
          });

          const result = await generateResponseImage('A beautiful sunset');

          expect(deductCredits).toHaveBeenCalledWith('user123', 3);
          expect(logUsage).toHaveBeenCalledWith(expect.objectContaining({ action: 'image_generation', cost: 3 }));
          expect(result).toBe('http://image.url');
      });

      it('should refund credits if safety check fails', async () => {
          const { deductCredits, refundCredits } = require('@/lib/services/user.service');
          // checkContentSafety is internal but we can trigger it via openai mock if we wanted,
          // or just mock it if it was exported. Since it's internal, we trigger its failure.
          // Wait, checkContentSafety uses openai.moderations.create
          (openai.moderations.create as jest.Mock).mockResolvedValue({
              results: [{ flagged: true, categories: {} }]
          });

          const result = await generateResponseImage('bad prompt');

          expect(result).toContain('Content+Violation');
          expect(deductCredits).toHaveBeenCalledWith('user123', 3);
          expect(refundCredits).toHaveBeenCalledWith('user123', 3);
      });
  });

  describe('generateHookupLine', () => {
    const mockGirl = {
        _id: 'girl123',
        name: 'Jessica',
        vibe: 'Fun',
        relationshipStatus: 'Dating',
        author: 'user123',
        dialect: 'Levantine',
      };

      it('should generate hookup line successfully', async () => {
        (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);
        (retrieveUserContext as jest.Mock).mockResolvedValue([{ content: 'Context' }]);
        (updateGamification as jest.Mock).mockResolvedValue({ newBadges: [] });

        const mockResponse = {
          line: 'Nice shoes.',
          explanation: 'It works.',
        };

        (openrouter.chat.completions.create as jest.Mock).mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        });

        const result = await generateHookupLine('girl123');

        expect(Girl.findById).toHaveBeenCalledWith('girl123');
        expect(openrouter.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
            messages: expect.arrayContaining([
                expect.objectContaining({ role: 'system', content: expect.stringContaining('Levantine') })
            ])
        }));
        expect(result).toEqual({ ...mockResponse, newBadges: [] });
      });
  });

  describe('submitFeedback', () => {
      it('should update message feedback', async () => {
          // Setup Mocks for Ownership Verification
          const mockMsg = { _id: 'msg123', girl: 'girl123', role: 'wingman', content: 'hello' };
          const mockGirl = { _id: 'girl123', author: 'user123' };
          const mockUser = { _id: 'user123' };

          (Message.findById as jest.Mock).mockResolvedValue(mockMsg);
          (Girl.findById as jest.Mock).mockResolvedValue(mockGirl);
          (User.findOne as jest.Mock).mockResolvedValue(mockUser);
          (Message.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...mockMsg, feedback: 'positive' });

          const result = await submitFeedback('msg123', 'positive');

          expect(Message.findById).toHaveBeenCalledWith('msg123');
          expect(Girl.findById).toHaveBeenCalledWith('girl123');
          expect(Message.findByIdAndUpdate).toHaveBeenCalledWith('msg123', { feedback: 'positive' }, { new: true });
          expect(result).toEqual({ success: true });
      });

      it('should handle errors', async () => {
          (Message.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

          const result = await submitFeedback('msg123', 'positive');

          expect(result).toEqual({ success: false });
      });
  });
});
