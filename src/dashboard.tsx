"use client"

import { useState } from "react"
//import { Button } from "@/components/ui_v2/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v2/tabs"
import { Badge } from "@/components/ui_v2/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar"
import { PlusCircle, Clock, Users } from "lucide-react"
import { Button, Modal, Space } from 'antd';

export default function Dashboard({ AAaddress, handleTabChange, polls, handleVote }: { AAaddress: string, handleTabChange: (tab: string) => void, polls: any[], handleVote: (pollId: number, option: string) => void }) {
  const [activeTab, setActiveTab] = useState("active")

  // Filter polls based on their status
  const activePolls = polls.filter(poll => poll.isOpen)
  const createdPolls = polls.filter(poll => poll.creator === AAaddress)
  const votedPolls = polls.filter(poll => poll.voted) // Assuming there's a voted flag
  
  console.log(activePolls);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Connected: {AAaddress ? AAaddress.slice(0, 6) + "..." + AAaddress.slice(-4) : "Not Connected"}
          </Button>
          <Button className="gap-2 text-white" onClick={() => handleTabChange('create-poll')}>
            <PlusCircle className="h-4 w-4" />
            Create Poll
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="active">Active Polls</TabsTrigger>
          <TabsTrigger value="created">My Polls</TabsTrigger>
          <TabsTrigger value="voted">Voted</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} type="active" handleVote={handleVote} />
            ))}
            {activePolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">No active polls found</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="created" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} type="created" />
            ))}
            {createdPolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">You haven't created any polls yet</p>
                <Button className="mt-4 text-white" onClick={() => handleTabChange('create-poll')}>
                  Create Your First Poll
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voted" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {votedPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} type="voted" />
            ))}
            {votedPolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">You haven't voted on any polls yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function calculateTimeLeft(endTime: string | Date): string {
  console.log('endTime:', endTime);
  const endDate = new Date(endTime);
  const now = new Date();
  
  // Convert the difference to days
  const timeLeftMs = endDate.getTime() - now.getTime();
  
  if (timeLeftMs <= 0) {
    return "Ended";
  }

  const days = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));
  return `${days} days left`;
}


function PollCard({ poll, type, handleVote }: { poll: any, type: string, handleVote: (pollId: number, option: string) => void }) {
  console.log(poll);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const getRandomPercentage = () => {
    return Math.floor(Math.random() * 100);
  }
  
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOptionVote = async (option) => {
    console.log(option);
    setIsLoading(true);
    try {
      const result = await handleVote(poll.id, option);
      console.log(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const modOptions = poll.options.map((option) => {
    return { text: option, percentage: getRandomPercentage()};
  });
  console.log(modOptions);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{poll.subject || poll.title || poll.question}</CardTitle>
          <StatusBadge status={poll.isOpen ? "active" : "ended"} />
        </div>
        <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Clock className="h-4 w-4" />
          <span>{poll.endTime ? calculateTimeLeft(poll.endTime) : `${poll.duration} days`}</span>
          <span className="mx-1">•</span>
          <Users className="h-4 w-4" />
          <span>{poll.totalResponses} / {poll.maxResponses} votes</span>
        </div>

        <div className="space-y-2">
          {(poll.options || []).slice(0, 3).map((option, index) => (
            <div key={index} className="relative pt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">{typeof option === 'string' ? option : option.text}</span>
                <span className="text-xs font-medium text-muted-foreground">{typeof option === 'string' ? '0' : option.percentage}%</span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                <div
                  style={{ width: `${typeof option === 'string' ? 0 : option.percentage}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                ></div>
              </div>
            </div>
          ))}
          {(poll.options || []).length > 3 && (
            <div className="text-xs text-center text-muted-foreground mt-1">
              +{poll.options.length - 3} more options
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Creator" />
            <AvatarFallback>{poll.creator.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{poll.creator}</span>
        </div>
        <Button
          // variant={type === "voted" ? "outline" : "default"} size="sm" className="text-white"
          onClick={showModal}
        >
          {type === "active" && "Vote"}
          {type === "created" && "Manage"}
        </Button>
      </CardFooter>
      <Modal
        title={poll.subject || poll.title || poll.question}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isModalOpen}
        footer={[]}
      >
        <Space direction="vertical" size="middle">
        {modOptions.map((option, index) => (
          <Button
            key={index} block onClick={() => handleOptionVote(option)}
            loading={isLoading}
          >
            {option.text}
          </Button>
        ))}
        </Space>
      </Modal>
    </Card>
  )
}

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    )
  } else if (status === "ended") {
    return <Badge variant="secondary">Ended</Badge>
  } else if (status === "pending") {
    return (
      <Badge variant="outline" className="text-yellow-500 border-yellow-500">
        Pending
      </Badge>
    )
  }
}

// Sample data
const activePolls = [
  {
    id: 1,
    title: "Should we integrate with Arbitrum?",
    description:
      "Vote on whether our protocol should expand to the Arbitrum network for lower gas fees and faster transactions.",
    status: "active",
    timeLeft: "2 days left",
    votes: 342,
    creator: "0x71C...93A4",
    options: [
      { text: "Yes, ASAP", percentage: 65 },
      { text: "Yes, but later", percentage: 20 },
      { text: "No", percentage: 10 },
      { text: "Undecided", percentage: 5 },
    ],
  },
  {
    id: 2,
    title: "Treasury allocation for Q3",
    description: "How should we allocate the community treasury funds for the upcoming quarter?",
    status: "active",
    timeLeft: "5 days left",
    votes: 189,
    creator: "0x45D...21B7",
    options: [
      { text: "Development", percentage: 45 },
      { text: "Marketing", percentage: 30 },
      { text: "Liquidity", percentage: 15 },
      { text: "Community rewards", percentage: 10 },
    ],
  },
  {
    id: 3,
    title: "New governance model proposal",
    description: "Should we adopt a new governance model with delegated voting?",
    status: "active",
    timeLeft: "1 day left",
    votes: 421,
    creator: "0x92F...76C1",
    options: [
      { text: "Keep current model", percentage: 35 },
      { text: "Adopt new model", percentage: 55 },
      { text: "Need more information", percentage: 10 },
    ],
  },
]

const createdPolls = [
  {
    id: 4,
    title: "Token burn mechanism",
    description: "Should we implement a token burn mechanism to reduce supply?",
    status: "active",
    timeLeft: "3 days left",
    votes: 156,
    creator: "0x71C...93A4",
    options: [
      { text: "Yes, 1% per transaction", percentage: 40 },
      { text: "Yes, 0.5% per transaction", percentage: 35 },
      { text: "No burn", percentage: 25 },
    ],
  },
  {
    id: 5,
    title: "Community call frequency",
    description: "How often should we hold community calls?",
    status: "ended",
    timeLeft: "Ended 2 days ago",
    votes: 203,
    creator: "0x71C...93A4",
    options: [
      { text: "Weekly", percentage: 25 },
      { text: "Bi-weekly", percentage: 60 },
      { text: "Monthly", percentage: 15 },
    ],
  },
]

const votedPolls = [
  {
    id: 6,
    title: "Logo redesign options",
    description: "Vote for your preferred logo design for our rebrand.",
    status: "active",
    timeLeft: "6 days left",
    votes: 312,
    creator: "0x38A...F4E2",
    options: [
      { text: "Design A", percentage: 30 },
      { text: "Design B", percentage: 45 },
      { text: "Design C", percentage: 25 },
    ],
  },
  {
    id: 7,
    title: "Fee structure update",
    description: "Should we update our fee structure to be more competitive?",
    status: "ended",
    timeLeft: "Ended 1 day ago",
    votes: 278,
    creator: "0x59B...A3D1",
    options: [
      { text: "Keep current fees", percentage: 20 },
      { text: "Reduce fees by 25%", percentage: 65 },
      { text: "Reduce fees by 50%", percentage: 15 },
    ],
  },
]