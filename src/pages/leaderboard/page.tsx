import { Crown, Medal, Trophy } from "lucide-react"
import { Avatar, Space } from 'antd';

import { Card } from "@/components/ui_v2/card"
import { Progress } from "@/components/ui_v2/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v2/tabs"

// Mock data for our leaderboard
const users = [
  {
    id: 1,
    name: "Alex Johnson",
    username: "alexj",
    avatar: "/avatars/abstract-avatar-1.png",
    pollsVoted: 247,
    rank: 1,
    badge: "Gold",
    recentActivity: "Voted on 12 polls today",
    joinDate: "Jan 2023",
  },
  {
    id: 2,
    name: "Samantha Lee",
    username: "samlee",
    avatar: "/avatars/abstract-avatar-2.png",
    pollsVoted: 213,
    rank: 2,
    badge: "Gold",
    recentActivity: "Voted on 5 polls today",
    joinDate: "Feb 2023",
  },
  {
    id: 3,
    name: "Michael Chen",
    username: "mikechen",
    avatar: "/avatars/abstract-avatar-3.png",
    pollsVoted: 189,
    rank: 3,
    badge: "Silver",
    recentActivity: "Voted on 8 polls today",
    joinDate: "Mar 2023",
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    username: "emilyr",
    avatar: "/avatars/abstract-avatar-4.png",
    pollsVoted: 156,
    rank: 4,
    badge: "Silver",
    recentActivity: "Voted on 3 polls today",
    joinDate: "Apr 2023",
  },
  {
    id: 5,
    name: "David Kim",
    username: "davidk",
    avatar: "/avatars/abstract-avatar-5.png",
    pollsVoted: 132,
    rank: 5,
    badge: "Bronze",
    recentActivity: "Voted on 2 polls today",
    joinDate: "May 2023",
  },
  {
    id: 6,
    name: "Jessica Taylor",
    username: "jesst",
    avatar: "/avatars/abstract-avatar-6.png",
    pollsVoted: 118,
    rank: 6,
    badge: "Bronze",
    recentActivity: "Voted on 4 polls today",
    joinDate: "Jun 2023",
  },
  {
    id: 7,
    name: "Ryan Patel",
    username: "ryanp",
    avatar: "/avatars/abstract-avatar-7.png",
    pollsVoted: 97,
    rank: 7,
    badge: "Bronze",
    recentActivity: "Voted on 1 poll today",
    joinDate: "Jul 2023",
  },
  {
    id: 8,
    name: "Olivia Wilson",
    username: "oliviaw",
    avatar: "/avatars/abstract-avatar-8.png",
    pollsVoted: 85,
    rank: 8,
    badge: "Bronze",
    recentActivity: "Voted on 2 polls today",
    joinDate: "Aug 2023",
  },
  {
    id: 9,
    name: "James Brown",
    username: "jamesb",
    avatar: "/avatars/abstract-avatar-9.png",
    pollsVoted: 72,
    rank: 9,
    badge: "Bronze",
    recentActivity: "Voted on 1 poll today",
    joinDate: "Sep 2023",
  },
  {
    id: 10,
    name: "Sophia Martinez",
    username: "sophiam",
    avatar: "/avatars/abstract-avatar-10.png",
    pollsVoted: 64,
    rank: 10,
    badge: "Bronze",
    recentActivity: "Voted on 3 polls today",
    joinDate: "Oct 2023",
  },
]

// Calculate the maximum number of polls voted for scaling
const maxPollsVoted = Math.max(...users.map((user) => user.pollsVoted))

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Poll Voting Leaderboard</h1>

      <Tabs defaultValue="all-time" className="w-full mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>
        <TabsContent value="all-time">
          <div className="grid gap-6 mt-6">
            {/* Top 3 users with special styling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.slice(0, 3).map((user) => (
                <Card
                  key={user.id}
                  className={`p-6 flex flex-col items-center ${
                    user.rank === 1
                      ? "border-yellow-400 border-2 bg-yellow-50"
                      : user.rank === 2
                        ? "border-gray-400 border-2 bg-gray-50"
                        : "border-amber-700 border-2 bg-amber-50"
                  }`}
                >
                  <div className="relative">
                    <div className="absolute -top-3 -right-3 z-10">
                      {user.rank === 1 ? (
                        <Crown className="h-8 w-8 text-yellow-500" />
                      ) : user.rank === 2 ? (
                        <Medal className="h-8 w-8 text-gray-500" />
                      ) : (
                        <Trophy className="h-8 w-8 text-amber-700" />
                      )}
                    </div>
                    <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-gray-200">
                      <Avatar
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        size={80}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mt-4">{user.name}</h3>
                  <p className="text-gray-500">@{user.username}</p>
                  <div className="mt-4 text-center">
                    <p className="text-2xl font-bold">{user.pollsVoted}</p>
                    <p className="text-sm text-gray-500">Polls Voted</p>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Member since {user.joinDate}</p>
                </Card>
              ))}
            </div>

            {/* Remaining users in a list */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Leaderboard Rankings</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0 w-10 text-center font-bold text-gray-500">#{user.rank}</div>
                    <div className="flex-shrink-0 ml-2">
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        <Avatar
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                          size={48}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    <div className="flex-grow max-w-md mx-4 hidden md:block">
                      <div className="flex items-center">
                        <Progress value={(user.pollsVoted / maxPollsVoted) * 100} className="h-2" />
                        <span className="ml-2 text-sm font-medium">{user.pollsVoted}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{user.recentActivity}</p>
                    </div>
                    <div className="flex-shrink-0 text-right md:hidden">
                      <p className="font-bold">{user.pollsVoted}</p>
                      <p className="text-xs text-gray-500">polls</p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.badge === "Gold"
                            ? "bg-yellow-100 text-yellow-800"
                            : user.badge === "Silver"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {user.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="monthly">
          <div className="p-8 text-center">
            <p className="text-gray-500">Monthly leaderboard data would be displayed here.</p>
          </div>
        </TabsContent>
        <TabsContent value="weekly">
          <div className="p-8 text-center">
            <p className="text-gray-500">Weekly leaderboard data would be displayed here.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">How the Leaderboard Works</h2>
        <div className="space-y-4">
          <p>
            Users earn points by voting on polls across the platform. The more polls you vote on, the higher your
            ranking!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-bold flex items-center">
                <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                Gold Badge
              </h3>
              <p className="text-sm mt-2">Awarded to users with 200+ poll votes</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold flex items-center">
                <Medal className="h-5 w-5 text-gray-500 mr-2" />
                Silver Badge
              </h3>
              <p className="text-sm mt-2">Awarded to users with 150-199 poll votes</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-bold flex items-center">
                <Trophy className="h-5 w-5 text-amber-700 mr-2" />
                Bronze Badge
              </h3>
              <p className="text-sm mt-2">Awarded to users with 50-149 poll votes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
