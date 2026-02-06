import { getContext } from "@/lib/actions/rag.actions";
import { retrieveContext } from "@/lib/services/rag.service";
import Girl from "@/lib/database/models/girl.model";
import User from "@/lib/database/models/user.model";
import { auth } from "@clerk/nextjs";

// Mock dependencies
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/database/mongoose", () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock("@/lib/database/models/message.model", () => ({
  aggregate: jest.fn(),
  find: jest.fn(),
}));

jest.mock("@/lib/database/models/girl.model", () => ({
  findById: jest.fn(),
}));

jest.mock("@/lib/database/models/user.model", () => ({
  findOne: jest.fn(),
}));

// Mock the service to verify calls
jest.mock("@/lib/services/rag.service", () => ({
  retrieveContext: jest.fn(),
  generateEmbedding: jest.fn(),
}));

describe("RAG Optimization & Security", () => {
  const mockGirlId = "girl123";
  const mockUserId = "user123";
  const mockClerkId = "clerk123";
  const mockQuery = "hello";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getContext should verify ownership and call retrieveContext", async () => {
    (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
    (User.findOne as jest.Mock).mockResolvedValue({ _id: mockUserId });
    (Girl.findById as jest.Mock).mockResolvedValue({
        _id: mockGirlId,
        author: mockUserId
    });
    (retrieveContext as jest.Mock).mockResolvedValue([{ content: "hi" }]);

    await getContext(mockGirlId, mockQuery);

    expect(User.findOne).toHaveBeenCalled();
    expect(Girl.findById).toHaveBeenCalled();
    expect(retrieveContext).toHaveBeenCalledWith(mockGirlId, mockQuery);
  });

  test("getContext should THROW if ownership verification fails", async () => {
    (auth as jest.Mock).mockReturnValue({ userId: mockClerkId });
    (User.findOne as jest.Mock).mockResolvedValue({ _id: "otherUser" });
    (Girl.findById as jest.Mock).mockResolvedValue({
        _id: mockGirlId,
        author: "differentOwner"
    });

    await expect(getContext(mockGirlId, mockQuery)).rejects.toThrow("Unauthorized");

    expect(retrieveContext).not.toHaveBeenCalled();
  });
});
