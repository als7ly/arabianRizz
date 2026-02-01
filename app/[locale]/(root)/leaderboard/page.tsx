import Header from "@/components/shared/Header";
import { getLeaderboard } from "@/lib/actions/gamification.actions";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, MessageSquare } from "lucide-react";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Header title="Rizz Gods Leaderboard" subtitle="Top Wingmen of the Community" />

      <div className="mt-8 bg-white rounded-xl shadow-sm border overflow-hidden">
        {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No data yet. Start rizzing up!</div>
        ) : (
            <table className="w-full text-left">
                <thead className="bg-purple-50 text-purple-900 border-b">
                    <tr>
                        <th className="p-4 font-semibold">Rank</th>
                        <th className="p-4 font-semibold">User</th>
                        <th className="p-4 font-semibold text-center">Interactions</th>
                        <th className="p-4 font-semibold text-center">Streak</th>
                        <th className="p-4 font-semibold">Badges</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {leaderboard.map((user: any, index: number) => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-bold text-gray-500 w-16 text-center">
                                {index + 1 === 1 ? <Trophy className="text-yellow-500 mx-auto" /> :
                                 index + 1 === 2 ? <Trophy className="text-gray-400 mx-auto" /> :
                                 index + 1 === 3 ? <Trophy className="text-amber-700 mx-auto" /> :
                                 `#${index + 1}`}
                            </td>
                            <td className="p-4 flex items-center gap-3">
                                <Image
                                    src={user.photo}
                                    alt={user.username}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                                <div>
                                    <p className="font-semibold text-dark-700">{user.firstName}</p>
                                    <p className="text-xs text-gray-400">@{user.username}</p>
                                </div>
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex-center gap-1 font-medium text-gray-700">
                                    <MessageSquare size={16} className="text-blue-500" />
                                    {user.totalInteractions}
                                </div>
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex-center gap-1 font-medium text-gray-700">
                                    <Flame size={16} className="text-orange-500" />
                                    {user.streak?.current || 0}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex gap-1 flex-wrap">
                                    {user.badges.slice(0, 3).map((badge: string) => (
                                        <Badge key={badge} variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200">
                                            {badge}
                                        </Badge>
                                    ))}
                                    {user.badges.length > 3 && (
                                        <span className="text-xs text-gray-400">+{user.badges.length - 3}</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
