
import { generateArt } from '../lib/actions/image.actions';
import { deductCredits, refundCredits } from '../lib/services/user.service';
import Girl from '../lib/database/models/girl.model';
import User from '../lib/database/models/user.model';
import { auth } from '@clerk/nextjs';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('../lib/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('../lib/database/models/user.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('../lib/database/models/girl.model', () => ({
  findById: jest.fn(),
}));

jest.mock('../lib/services/user.service', () => ({
  deductCredits: jest.fn(),
  refundCredits: jest.fn(),
}));

jest.mock('../lib/openai', () => ({
  openai: {
    images: {
      generate: jest.fn(),
    },
  },
}));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
    },
  },
}));

jest.mock('../lib/actions/usage-log.actions', () => ({
  logUsage: jest.fn(),
}));

describe('generateArt Performance Optimization', () => {
  const mockUserId = 'user123';
  const mockGirlId = 'girl123';
  const mockUser = { _id: mockUserId, creditBalance: 100 };
  const mockGirl = { _id: mockGirlId, name: 'Test Girl', vibe: 'Chill', author: mockUserId };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: 'clerk_user_id' });
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    // Default mocks
    (Girl.findById as jest.Mock).mockReturnValue(Promise.resolve(mockGirl));
    (deductCredits as jest.Mock).mockResolvedValue({ ...mockUser, creditBalance: 97 });
  });

  it('executes Girl fetch and Credit deduction in parallel', async () => {
    const deductCreditsSpy = deductCredits as jest.Mock;
    const girlFindByIdSpy = Girl.findById as jest.Mock;

    let deductCreditsCallTime: number = 0;
    let girlFindByIdCallTime: number = 0;
    let deductCreditsFinishTime: number = 0;

    // Mock deductCredits with delay
    deductCreditsSpy.mockImplementation(async () => {
      deductCreditsCallTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 50));
      deductCreditsFinishTime = Date.now();
      return { ...mockUser, creditBalance: 97 };
    });

    // Mock Girl.findById with delay
    girlFindByIdSpy.mockImplementation(() => {
      girlFindByIdCallTime = Date.now();
      return new Promise(resolve => setTimeout(() => resolve(mockGirl), 50));
    });

    try {
        await generateArt('test prompt', mockGirlId);
    } catch (e) {
        // ignore errors downstream from openai/cloudinary mocks
    }

    // Expect both to be called
    expect(deductCreditsCallTime).toBeGreaterThan(0);
    expect(girlFindByIdCallTime).toBeGreaterThan(0);

    // Parallel execution check:
    // Girl fetch should start roughly at the same time as deductCredits,
    // definitely BEFORE deductCredits finishes.

    // If sequential: Girl fetch starts AFTER deductCredits finishes.
    // So checking: girlFindByIdCallTime < deductCreditsFinishTime verifies overlap (parallelism).

    console.log(`Deduct Start: ${deductCreditsCallTime}`);
    console.log(`Deduct Finish: ${deductCreditsFinishTime}`);
    console.log(`Girl Fetch Start: ${girlFindByIdCallTime}`);

    expect(girlFindByIdCallTime).toBeLessThan(deductCreditsFinishTime);
  });
});
