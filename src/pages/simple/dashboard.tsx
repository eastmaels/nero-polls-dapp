"use client"

import { useState } from "react"
import { useSignature, useSendUserOp, useConfig, useEthersSigner } from '@/hooks';
import { ERC20_ABI_DPOLLS,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v2/tabs"
import { Badge } from "@/components/ui_v2/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar"
import { PlusCircle, Clock, Users } from "lucide-react"
import { Button, Modal, Space } from 'antd';
import ManagePoll from "@/pages/simple/manage-poll";

const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...ERC20_ABI_DPOLLS,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];

export default function Dashboard({ AAaddress, handleTabChange, polls, fetchPolls }: 
  { AAaddress: string, handleTabChange: (tab: string) => void, polls: any[], fetchPolls: () => void }) {
  const [activeTab, setActiveTab] = useState("active")

  // Filter polls based on their status
  const activePolls = polls.filter(poll => poll.isOpen)
  const createdPolls = polls.filter(poll => poll.creator === AAaddress)
  const votedPolls = polls.filter(poll => poll.voted) // Assuming there's a voted flag
  
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
              <PollCard
                key={poll.id} poll={poll} type="active"
                fetchPolls={fetchPolls}
                handleTabChange={handleTabChange}
              />
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
              <PollCard
                key={poll.id} poll={poll} type="created" 
                fetchPolls={fetchPolls}
                handleTabChange={() => handleTabChange('create-poll')}
              />
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
              <PollCard 
                key={poll.id} poll={poll} type="voted" 
                fetchPolls={fetchPolls}
              />
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


function PollCard({ poll, type, fetchPolls, handleTabChange }: 
  { poll: any, type: string, fetchPolls: () => void, handleTabChange?: (tab: string) => void }) {
  
  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagePollModalOpen, setIsManagePollModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showManagePollModal = () => {
    setIsManagePollModalOpen(true);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOptionVote = async (option) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsVoting(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'submitResponse',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
        params: [
          poll.id,
          option.text,
        ],
        value: 0,
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);

      if (result.result === true) {
        setIsPolling(false);
        fetchPolls();
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
    } finally {
      setIsVoting(false);
      setIsModalOpen(false);
    }

  };

  const computePercentage = (responses: string[], option: string) => {
    if (responses?.length === 0) {
      return 0;
    }
    const totalResponses = responses?.length;
    const optionCount = responses?.filter(response => response === option).length;
    return Math.floor((optionCount / totalResponses) * 100);
  }

  const modOptions = poll.options.map((option) => {
    return { text: option, percentage: computePercentage(poll.responses, option)};
  });

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
          {(modOptions || []).slice(0, 3).map((option, index) => (
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
          {(modOptions || []).length > 3 && (
            <div className="text-xs text-center text-muted-foreground mt-1">
              +{modOptions.length - 3} more options
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
          onClick={() => {
            if (type === "active") {
              showModal();
            } else if (type === "created") {
              showManagePollModal();
            }
          }}
        >
          {type === "active" && "Vote"}
          {type === "created" && "Manage"}
        </Button>
      </CardFooter>
      <Modal
        title={poll.subject || poll.title || poll.question}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
      >
        <Space direction="vertical" size="middle">
        {modOptions.map((option, index) => (
          <Button
            key={index} block onClick={() => handleOptionVote(option)}
            loading={isVoting}
          >
            {option.text}
          </Button>
        ))}
        </Space>
      </Modal>
      <Modal
        title={poll.subject || poll.title || poll.question}
        open={isManagePollModalOpen}
        onOk={() => {
          setIsManagePollModalOpen(false);
          fetchPolls();
        }}
        onCancel={() => {
          setIsManagePollModalOpen(false);
        }}
        footer={null}
        maskClosable={false}
      >
        <ManagePoll poll={poll} />
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