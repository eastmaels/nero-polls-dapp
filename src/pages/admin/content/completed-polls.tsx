"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useSendUserOp, useSignature } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { Button, Form, Input, Modal } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users } from "lucide-react";
import { useState } from "react";

export default function CompletedPolls({ AAaddress, polls, fetchPolls, handleTabChange, }:
  { AAaddress: string, polls: PollState[], fetchPolls: () => void, handleTabChange: (tab: string) => void, }) {

  // Filter polls based on their status
  const targetPolls = polls.filter(poll => poll.status === "closed")
  console.log('target poll', targetPolls)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targetPolls.map((poll: PollState) => (
          <PollCard
            key={poll.id}
            poll={poll}
            type="funding"
            fetchPolls={fetchPolls}
            AAaddress={AAaddress}
          />
        ))}
        {targetPolls.length === 0 && (
          <div className="col-span-3 text-center py-10">
            <p className="text-gray-500">Nothing to see here</p>
            <Button className="mt-4" onClick={() => handleTabChange('create-poll')}>
              Create Your First Poll
            </Button>
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
  { poll: PollState, type: string, fetchPolls: () => void, AAaddress: string }) {

  console.log('poll', poll)
  const isClaimed = poll.responsesWithAddress?.some(response => response.address === AAaddress && response.isClaimed);
  console.log('isClaimed', isClaimed)

  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClaimRewards = async (poll) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'claimReward',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: [
          poll.id,
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
      setIsLoading(false);
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
    return { text: option, percentage: computePercentage(poll.responses, option) };
  });

  const funds = parseFloat(ethers.utils.formatEther(poll.funds || '0'));
  const targetFund = parseFloat(ethers.utils.formatEther(poll.targetFund || '0'));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{poll.subject}</CardTitle>
          <StatusBadge status={poll.status} />
        </div>
        <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Users className="h-4 w-4" />
          <span>{poll.totalResponses} / {poll.maxResponses} votes</span>
          <CircleDollarSign className="h-4 w-4" />
          <span>{funds} / {targetFund} NERO </span>
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
        <div className="flex items-center">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Creator" />
            <AvatarFallback>{poll.creator.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{getCompressedAddress(poll.creator)}</span>
        </div>
        <div className="flex">
          <Button block variant="outlined" size="small" type="primary"
            disabled={isClaimed}
            onClick={() => setIsModalOpen(true)}>
            {isClaimed ? 'Already Claimed' : 'Claim'}
          </Button>
        </div>
      </CardFooter>
      <Modal
        title={"Claim Rewards for poll: " + poll.subject}
        open={isModalOpen}
        maskClosable={false}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={() => {
              handleClaimRewards(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
    </Card>
  )
}

function StatusBadge({ status }) {
  if (status === "active" || status === "open") {
    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    )
  } else if (status === "new") {
    return (
      <Badge variant="default" className="bg-blue-500">
        New
      </Badge>
    )
  } else if (status === "for-funding") {
    return (
      <Badge variant="default" className="bg-blue-500">
        Funding
      </Badge>
    )
  } else if (status === "closed") {
    return <Badge variant="secondary">Ended</Badge>
  } else if (status === "for-claiming") {
    return (
      <Badge variant="outline" className="text-yellow-500 border-yellow-500">
        For Claiming
      </Badge>
    )
  }
}