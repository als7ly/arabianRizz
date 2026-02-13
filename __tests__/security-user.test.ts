import { updateUserProfile } from '@/lib/actions/user.actions';
import { updateUser } from '@/lib/services/user.service';
import { auth } from '@clerk/nextjs';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/services/user.service', () => ({
  updateUser: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('updateUserProfile Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should strip unauthorized fields (Mass Assignment Vulnerability)', async () => {
    // Mock authenticated user
    (auth as jest.Mock).mockReturnValue({ userId: 'test-clerk-id' });

    // Mock successful update
    (updateUser as jest.Mock).mockResolvedValue({ _id: 'test-id', bio: 'Safe Bio' });

    // Malicious payload with extra field 'creditBalance'
    const maliciousData = {
      bio: 'Safe Bio',
      creditBalance: 999999
    };

    // Call the action (casting to any to simulate client sending extra data)
    await updateUserProfile(maliciousData as any);

    // Expect updateUser to be called with ONLY safe fields
    // This assertion will FAIL if the vulnerability exists
    expect(updateUser).toHaveBeenCalledWith('test-clerk-id', {
      bio: 'Safe Bio'
    });

    // Specifically ensure creditBalance was NOT passed
    const callArgs = (updateUser as jest.Mock).mock.calls[0][1];
    expect(callArgs).not.toHaveProperty('creditBalance');
  });
});
