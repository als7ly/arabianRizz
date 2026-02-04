import { approveKnowledge, rejectKnowledge, editKnowledge } from '@/lib/actions/admin.actions';
import GlobalKnowledge from '@/lib/database/models/global-knowledge.model';
import { connectToDatabase } from '@/lib/database/mongoose';
import { generateEmbedding } from '@/lib/actions/rag.actions';

// Mocks
jest.mock('@/lib/database/models/global-knowledge.model', () => ({
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/actions/rag.actions', () => ({
  generateEmbedding: jest.fn(),
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Admin Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
  });

  describe('approveKnowledge', () => {
    it('should set status to approved', async () => {
      (GlobalKnowledge.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const result = await approveKnowledge('id123');

      expect(GlobalKnowledge.findByIdAndUpdate).toHaveBeenCalledWith('id123', { status: 'approved' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('rejectKnowledge', () => {
    it('should delete the record', async () => {
      (GlobalKnowledge.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      const result = await rejectKnowledge('id123');

      expect(GlobalKnowledge.findByIdAndDelete).toHaveBeenCalledWith('id123');
      expect(result).toEqual({ success: true });
    });
  });

  describe('editKnowledge', () => {
    it('should update content and regenerate embedding', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
      (GlobalKnowledge.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const result = await editKnowledge('id123', 'New Content');

      expect(generateEmbedding).toHaveBeenCalledWith('New Content');
      expect(GlobalKnowledge.findByIdAndUpdate).toHaveBeenCalledWith('id123', {
          content: 'New Content',
          embedding: mockEmbedding
      });
      expect(result).toEqual({ success: true });
    });
  });
});
