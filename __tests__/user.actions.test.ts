/** @jest-environment node */
import { deleteAccount } from "@/lib/actions/user.actions";
import User from "@/lib/database/models/user.model";
import Girl from "@/lib/database/models/girl.model";
import Message from "@/lib/database/models/message.model";
import UserKnowledge from "@/lib/database/models/user-knowledge.model";
import Event from "@/lib/database/models/event.model";
import UsageLog from "@/lib/database/models/usage-log.model";
import { auth, clerkClient } from "@clerk/nextjs";

// Mock Mongoose models
jest.mock("@/lib/database/models/user.model");
jest.mock("@/lib/database/models/girl.model");
jest.mock("@/lib/database/models/message.model");
jest.mock("@/lib/database/models/user-knowledge.model");
jest.mock("@/lib/database/models/event.model");
jest.mock("@/lib/database/models/usage-log.model");
jest.mock("@/lib/database/mongoose", () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
  clerkClient: {
    users: {
      deleteUser: jest.fn(),
    },
  },
}));

describe("deleteAccount", () => {
  const mockUserId = "user_123";
  const mockUser = { _id: "mongo_user_123", clerkId: mockUserId };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
  });

  it("should successfully delete account and related data", async () => {
    // Mock user finding
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    // Mock girls finding
    (Girl.find as jest.Mock).mockResolvedValue([{ _id: "girl_1" }, { _id: "girl_2" }]);

    // Execute
    const result = await deleteAccount();

    // Verify
    expect(result).toEqual({ success: true });

    // Verify DB deletions
    expect(User.findOne).toHaveBeenCalledWith({ clerkId: mockUserId });
    expect(Girl.find).toHaveBeenCalledWith({ author: mockUser._id });
    expect(Message.deleteMany).toHaveBeenCalled();
    expect(Girl.deleteMany).toHaveBeenCalledWith({ author: mockUser._id });
    expect(UserKnowledge.deleteMany).toHaveBeenCalledWith({ user: mockUser._id });
    expect(UsageLog.deleteMany).toHaveBeenCalledWith({ user: mockUser._id });
    expect(Event.deleteMany).toHaveBeenCalledWith({ user: mockUser._id });
    expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);

    // Verify Clerk deletion
    expect(clerkClient.users.deleteUser).toHaveBeenCalledWith(mockUserId);
  });

  it("should return error if user not found", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const result = await deleteAccount();

    expect(result).toEqual({ success: false, error: "User not found" });
    expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    expect(clerkClient.users.deleteUser).not.toHaveBeenCalled();
  });

  it("should return error if unauthorized", async () => {
    (auth as jest.Mock).mockReturnValue({ userId: null });

    const result = await deleteAccount();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });
});
