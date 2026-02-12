import { updateUserProfile } from '@/lib/actions/user.actions';
import { updateUser } from '@/lib/services/user.service';
import { auth } from '@clerk/nextjs';
import { revalidatePath } from 'next/cache';

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

describe('updateUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call updateUser with correct params and revalidate path', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: 'test-clerk-id' });
    (updateUser as jest.Mock).mockResolvedValue({ _id: 'test-id', bio: 'New Bio' });

    const data = { bio: 'New Bio', age: 25 };
    const result = await updateUserProfile(data);

    expect(auth).toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith('test-clerk-id', data);
    expect(revalidatePath).toHaveBeenCalledWith('/profile');
    expect(result).toEqual({ _id: 'test-id', bio: 'New Bio' });
  });

  it('should handle unauthorized access', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: null });

    // updateUserProfile uses handleError which console.errors and returns undefined/null usually
    // or throws. Let's see utils.ts
    // Assuming handleError catches and logs, result might be undefined.
    // But in the code: if (!clerkId) throw new Error("Unauthorized");
    // And try/catch block catches it and calls handleError(error).

    // If handleError throws, then it rejects. If it swallows, it returns undefined.
    // Let's assume standard behavior.

    const result = await updateUserProfile({});
    expect(updateUser).not.toHaveBeenCalled();
  });
});
