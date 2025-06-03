"use client"

import { VotePollModal } from "@/components/modals/vote-poll-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { useSignature } from '@/hooks';
import { PollState } from "@/types/poll";
import { Button, Result } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users } from "lucide-react";
import { useState } from "react";

interface ActivePollsProps {
  AAaddress: string
  polls: PollState[]
  isWalletConnected: boolean
  setIsWalletConnected: (isWalletConnected: boolean) => void
  fetchPolls: () => void
  handleTabChange: (tab: string) => void,
}

export default function ActivePolls({ polls, fetchPolls, AAaddress, handleTabChange, isWalletConnected, setIsWalletConnected }: ActivePollsProps) {

  const { isConnected } = useSignature();
  // Filter polls based on their status
  const targetPolls = polls.filter(poll => poll.isOpen && (poll.status === "open"))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targetPolls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            type="active"
            fetchPolls={fetchPolls}
            AAaddress={AAaddress}
          />
        ))}
        {targetPolls.length === 0 && (
          <div className="col-span-3 text-center py-10">
            {isConnected ?
              <>
                <Result
                  status="404"
                  title="Oops!"
                  subTitle="No polls are accepting responses"
                />
                <Button className="mt-4" onClick={() => handleTabChange('create-poll')}>
                  Create Your First Poll
                </Button>
              </>
              :
              <WalletConnector isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected} />
             }
          </div>
        )}
      </div>
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


function PollCard({ poll, type, fetchPolls, AAaddress }:
  { poll: any, type: string, fetchPolls: () => void, AAaddress: string, }) {

  const isVoted = poll.responsesWithAddress?.some(response => response.address === AAaddress);

  const [selectedPoll, setSelectedPoll] = useState<any | null>(null)
  const [isPollModalOpen, setIsPollModalOpen] = useState(false)

  const handleViewPoll = (poll: any) => {
    setSelectedPoll(poll)
    setIsPollModalOpen(true)
  }

  const closePollModal = () => {
    setIsPollModalOpen(false)
    setSelectedPoll(null)
  }

  const computePercentage = (responses: string[], option: string) => {
    if (responses?.length === 0) {
      return 0;
    }
    const totalResponses = responses?.length;
    const optionCount = responses?.filter(response => response === option).length;
    return Math.floor((optionCount / totalResponses) * 100);
  }

  const modOptions = poll.options.map((option) => {
    return { text: option, percentage: computePercentage(poll.responses, option) };
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{poll.subject || poll.title || poll.question}</CardTitle>
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
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
          {type === "created" &&
            <>
              <CircleDollarSign className="h-4 w-4" />
              <span>{ethers.utils.formatEther(poll.funds || '0')} NERO </span>
            </>
          }
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
        <div className="flex flex-col gap-2">
          {poll.status === "open" && type === "active" &&
            <Button
              block
              type="primary"
              disabled={isVoted}
              onClick={() => handleViewPoll(poll)}
            >
              Vote
            </Button>
          }
        </div>
      </CardFooter>
      {/* Poll Modal */}
      <VotePollModal
        featureFlagNew={true} 
        poll={selectedPoll} isOpen={isPollModalOpen} onClose={closePollModal}
        fetchPolls={fetchPolls}
      />
    </Card>
  )
}