import { updateUserSettings, getUserSettings } from "@/lib/actions/settings.actions";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/database/models/user.model";
import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

// Mock dependencies
jest.mock("@/lib/database/mongoose");
jest.mock("@/lib/database/models/user.model");
jest.mock("@clerk/nextjs");
jest.mock("next/cache");
jest.mock("@/lib/utils", () => ({
  handleError: jest.fn((error) => { throw error; })
}));

describe("Settings Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: "test_clerk_id" });
  });

  describe("updateUserSettings", () => {
    it("should update user settings", async () => {
      const mockUser = {
        _id: "user_id",
        clerkId: "test_clerk_id",
        settings: {
          defaultTone: "Funny",
          lowBalanceAlerts: false,
          theme: "dark"
        }
      };

      (User.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateUserSettings({
        defaultTone: "Funny",
        lowBalanceAlerts: false,
        theme: "dark"
      });

      expect(connectToDatabase).toHaveBeenCalled();
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { clerkId: "test_clerk_id" },
        {
          $set: {
            "settings.defaultTone": "Funny",
            "settings.lowBalanceAlerts": false,
            "settings.theme": "dark"
          }
        },
        { new: true }
      );
      expect(revalidatePath).toHaveBeenCalledWith("/settings");
      expect(result).toEqual(mockUser);
    });

    it("should handle unauthorized access", async () => {
        (auth as jest.Mock).mockReturnValue({ userId: null });
        await expect(updateUserSettings({})).rejects.toThrow("Unauthorized");
    });
  });

  describe("getUserSettings", () => {
      it("should return user settings", async () => {
          const mockSettings = { defaultTone: "Flirty" };
          const mockUser = {
              settings: mockSettings
          };

          (User.findOne as jest.Mock).mockReturnValue({
              select: jest.fn().mockResolvedValue(mockUser)
          });

          const result = await getUserSettings();

          expect(User.findOne).toHaveBeenCalledWith({ clerkId: "test_clerk_id" });
          expect(result).toEqual(mockSettings);
      });
  });
});
