
import { getWingmanRecommendations } from '@/lib/actions/referral.actions';
import { auth } from '@clerk/nextjs';
import { connectToDatabase } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import Girl from '@/lib/database/models/girl.model';
import Message from '@/lib/database/models/message.model';
import ReferralItem from '@/lib/database/models/referral-item.model';
import { generateEmbedding } from '@/lib/services/rag.service';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/database/models/user.model');
jest.mock('@/lib/database/models/girl.model');
jest.mock('@/lib/database/models/message.model');
jest.mock('@/lib/database/models/referral-item.model');
jest.mock('@/lib/services/rag.service');

const EMBEDDING_DIM = 1536;
const NUM_ITEMS = 2000; // Increase to make the difference more noticeable

// Helper to generate random embedding
const randomEmbedding = () => Array.from({ length: EMBEDDING_DIM }, () => Math.random());

describe('Referral Performance Benchmark', () => {
  let mockUser: any;
  let mockGirl: any;
  let mockMessages: any[];
  let mockItems: any[];
  let queryEmbedding: number[];

  beforeAll(() => {
    // Setup mock data
    mockUser = { _id: 'user123', clerkId: 'clerk123' };
    mockGirl = { _id: 'girl123', author: 'user123', name: 'Test Girl', vibe: 'Friendly', relationshipStatus: 'Single' };
    mockMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ];

    queryEmbedding = randomEmbedding();

    // Generate heavy mock items
    mockItems = Array.from({ length: NUM_ITEMS }, (_, i) => ({
      _id: `item${i}`,
      name: `Item ${i}`,
      description: `Description for item ${i}. This is a long string to simulate heavy objects. `.repeat(20),
      category: 'gift',
      url: `http://example.com/item${i}`,
      imageUrl: `http://example.com/image${i}.jpg`, // Simulate large strings
      isActive: true,
      embedding: randomEmbedding(),
      toObject: function() {
        // return shallow copy excluding toObject itself
        const { toObject, ...rest } = this;
        return rest;
      }
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (auth as jest.Mock).mockReturnValue({ userId: 'clerk123' });
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (Girl.findOne as jest.Mock).mockResolvedValue(mockGirl);

    // Mock Message.find().sort().limit() chain
    const mockSort = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue(mockMessages);
    (Message.find as jest.Mock).mockReturnValue({
      sort: mockSort,
      limit: mockLimit,
    });
    // Mock sort().limit() chain for Message.find
    // Actually, in the code: Message.find({}).sort({}).limit(20)
    // So Message.find needs to return an object with sort() which returns an object with limit() which resolves.

    (Message.find as jest.Mock).mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMessages)
    }));

    (generateEmbedding as jest.Mock).mockResolvedValue(queryEmbedding);

    // Mock ReferralItem.find({ isActive: true }).select('+embedding')
    // The code calls: await ReferralItem.find({ isActive: true }).select('+embedding');
    // So find needs to return an object with select() that resolves to the items.
    (ReferralItem.find as jest.Mock).mockImplementation((query: any) => {
        // If query is checking for isActive: true, return the chain for fetching candidates
        if (query && query.isActive === true) {
            return {
                select: jest.fn().mockImplementation((selectArg: string) => {
                  // Simulate filtering of fields if necessary, or just return mockItems for now
                  // In unoptimized: select('+embedding') returns full items + embedding
                  // In optimized: select('_id embedding') returns partial items

                  if (selectArg === '_id embedding') {
                    const partialItems = mockItems.map(item => ({ _id: item._id, embedding: item.embedding }));
                    return {
                      lean: jest.fn().mockResolvedValue(partialItems),
                      // Allow awaiting directly if lean() is not used (though optimization should use it)
                      then: (resolve: any) => resolve(partialItems)
                    };
                  }

                  // Default (unoptimized)
                  return {
                      lean: jest.fn().mockResolvedValue(mockItems), // In case unoptimized uses lean later
                      then: (resolve: any) => resolve(mockItems) // For direct await
                  };
                })
            };
        }

        // If query is fetching by IDs (for the optimized version later), handle it
        if (query && query._id && query._id.$in) {
             const ids = query._id.$in;
             // Match based on ID
             // The mockItems created in beforeAll have string IDs "item0", "item1", etc.
             const found = mockItems.filter((item: any) => ids.includes(item._id));

             return {
                 select: jest.fn().mockReturnThis(),
                 lean: jest.fn().mockReturnThis(),
                 // Allow awaiting directly
                 then: (resolve: any) => resolve(found)
             };
        }

        return {
             select: jest.fn().mockReturnThis(),
             lean: jest.fn().mockReturnThis(),
             then: (resolve: any) => resolve([])
        };
    });
  });

  it('should measure performance of getWingmanRecommendations', async () => {
    const start = performance.now();
    const result = await getWingmanRecommendations('girl123');
    const end = performance.now();

    console.log(`Execution time for ${NUM_ITEMS} items: ${(end - start).toFixed(2)}ms`);

    expect(result).toBeDefined();
    expect(result.length).toBeLessThanOrEqual(5);
    // Basic verification
    expect(auth).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalledWith({ clerkId: 'clerk123' });
    expect(ReferralItem.find).toHaveBeenCalled();
  }, 30000); // increase timeout
});
