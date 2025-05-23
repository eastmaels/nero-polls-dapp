"use client"

import { useState } from "react"
import { useSignature, useSendUserOp, useConfig, useEthersSigner } from '@/hooks';
import { POLLS_DAPP_ABI,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v2/tabs"
import { Badge } from "@/components/ui_v2/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar"
import { PlusCircle, Clock, Users, CircleDollarSign } from "lucide-react"
import { Button, Form, Modal, Space, Input } from 'antd';
import ManagePoll from "@/pages/simple/manage-poll";
import { PollState } from "@/types/poll";
import { ethers } from 'ethers';
import { getSigner, fundPoll } from '@/utils/aaUtils';
import { getCompressedAddress } from "@/utils/addressUtil";

const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...POLLS_DAPP_ABI,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];

export default function CreatedPolls({ AAaddress, handleTabChange, polls, fetchPolls, activeDashboardTab }: 
  { AAaddress: string, handleTabChange: (tab: string) => void, polls: PollState[], fetchPolls: () => void, activeDashboardTab: string }) {
  // Filter polls based on their status
  const createdPolls = polls.filter(poll => poll.creator === AAaddress)

  return (
    <div className="container mx-auto px-4 py-8">
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


function PollCard({ poll, type, fetchPolls, handleTabChange, AAaddress, handleFundPoll }: 
  { poll: any, type: string, fetchPolls: () => void, handleTabChange?: (tab: string) => void, AAaddress?: string, handleFundPoll?: (poll: any, amount: any) => void, }) {
  
  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isManagePollModalOpen, setIsManagePollModalOpen] = useState(false);
  const [isOpenPollModalOpen, setIsOpenPollModalOpen] = useState(false);
  const [isClosePollModalOpen, setIsClosePollModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isOpenForFundingModalOpen, setIsOpenForFundingModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const isClaimed = poll.responsesWithAddress?.some(response => response.address === AAaddress && response.isClaimed);
  const [isForClaimingModalOpen, setIsForClaimingModalOpen] = useState(false);
  const [votedOption, setVotedOption] = useState<string | null>(null);

  const [form] = Form.useForm();

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
      setIsVoteModalOpen(false);
    }

  };

  const handleUpdatePoll = async (updatedPoll: any) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'updatePoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
        params: [
          updatedPoll.id,
          updatedPoll.subject,
          updatedPoll.description,
          ethers.utils.parseEther(updatedPoll.rewardPerResponse).toString(),
          parseInt(updatedPoll.duration),
          parseInt(updatedPoll.maxResponses),
          ethers.utils.parseEther(updatedPoll.minContribution).toString(),
          ethers.utils.parseEther(updatedPoll.targetFund).toString(),
        ],
        value: 0,
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);

      if (result.result === true) {
        setIsPolling(false);
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
    } finally {
      setIsLoading(false);
      setIsManagePollModalOpen(false);
    }
  };

  const handleOpenForClaiming = async (poll: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'forClaiming',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI,
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
      setIsForClaimingModalOpen(false);
    }
  };

  const handleOpenPoll = async (poll: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'openPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI,
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
      setIsOpenPollModalOpen(false);
    }
  };

  const handleClosePoll = async (poll: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'closePoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI,
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
    }
  };

  const handlePollStatusChange = async (poll: PollState, method: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: method,
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI,
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
    }
  };

  const handleClaimRewards = async (poll) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await execute({
        function: 'claimReward',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI,
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
      setIsClaimModalOpen(false);
    }
  };

  const handleFundPollLocal = async (poll) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    const amount = form.getFieldValue("contribution");
    const ethAmount = ethers.utils.parseEther(amount);

    try {
      await execute({
        function: 'fundPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
        params: [
          poll.id,
        ],
        value: ethAmount,
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
      setIsFundingModalOpen(false);
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
          <StatusBadge status={poll.status} />
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
        <div className="flex items-center">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Creator" />
            <AvatarFallback>{poll.creator.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{getCompressedAddress(poll.creator)}</span>
        </div>
        <div className="flex">
          {poll.status === "open" && type === "active" && 
            <Button
              // variant={type === "voted" ? "outline" : "default"} size="sm" className="text-white"
              block
              onClick={() => setIsVoteModalOpen(true)}
              type="primary"
            >
            Vote
            </Button>
          }
          {(poll.status === "new" && type === "created") &&
            <Button block variant="outlined" size="small" type="primary"
              onClick={() => setIsManagePollModalOpen(true)}>
              Manage
            </Button>
          }
          {poll.status === "new" && type === "created" &&
            <Button block variant="outlined" size="small" type="primary" 
              onClick={() => setIsOpenForFundingModalOpen(true)}>
                Open For Funding
            </Button>
          }
          {poll.status === "for-funding" && type === "created" &&
            <Button block variant="outlined" size="small" type="primary" 
              onClick={() => setIsOpenPollModalOpen(true)}>
                Open For Voting
            </Button>
          }
          {type === "created" && poll.status === "open" &&
            <Button block variant="outlined" size="small" type="primary"
              onClick={() => setIsForClaimingModalOpen(true)}>
                For Rewards Claim
            </Button>
          }
          {type === "created" && poll.status === "for-claiming" && 
            <Button block variant="outlined" size="small" type="primary"
              onClick={() => setIsClosePollModalOpen(true)}>
                Close Poll
            </Button>
          }
          {type === "voted" && poll.status === "for-claiming" &&
            <Button block variant="outlined" size="small" type="primary"
              disabled={isClaimed}
              onClick={() => setIsClaimModalOpen(true)}>
                Claim
            </Button>
          }
          {(type === "created" || type === "funding") && poll.status === "for-funding" &&
            <Button block variant="outlined" size="small" type="primary"
              onClick={() => setIsFundingModalOpen(true)}>
                Fund
            </Button>
          }
        </div>
      </CardFooter>
      <Modal
        title={poll.subject || poll.title || poll.question}
        open={isVoteModalOpen}
        onCancel={() => setIsVoteModalOpen(false)}
        footer={null}
        maskClosable={false}
      >
        <Space direction="vertical" size="middle">
        {modOptions.map((option, index) => (
          <Button
            key={index} block onClick={() => handleOptionVote(option)}
            loading={isVoting}
            disabled={type === "voted"}
            type={votedOption === option.text ? "primary" : "default"}
          >
            {option.text}
          </Button>
        ))}
        </Space>
      </Modal>
      <Modal
        title={poll.subject || poll.title || poll.question}
        open={isManagePollModalOpen}
        footer={null}
        onCancel={() => setIsManagePollModalOpen(false)}
      >
        <ManagePoll poll={poll} handleUpdatePoll={handleUpdatePoll} />
      </Modal>
      <Modal
        title={"Close Poll: " + poll.subject || poll.title || poll.question}
        open={isClosePollModalOpen}
        maskClosable={false}
        onCancel={() => setIsClosePollModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handleClosePoll(poll);
              setIsClosePollModalOpen(false);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsClosePollModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
      <Modal
        title={"Open Poll: " + poll.subject || poll.title || poll.question}
        open={isOpenPollModalOpen}
        maskClosable={false}
        onCancel={() => setIsOpenPollModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={() => {
              handleOpenPoll(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsOpenPollModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
      <Modal
        title={"Start Claims for: " + poll.subject || poll.title || poll.question}
        open={isForClaimingModalOpen}
        maskClosable={false}
        onCancel={() => setIsForClaimingModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={() => {
              handleOpenForClaiming(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" onClick={() => {
            setIsForClaimingModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
      <Modal
        title={"Claim Rewards for poll: " + poll.subject || poll.title || poll.question}
        open={isClaimModalOpen}
        maskClosable={false}
        onCancel={() => setIsClaimModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={() => {
              handleClaimRewards(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsClaimModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>

      <Modal
        title={"Open poll for funding: " + poll.subject || poll.title || poll.question}
        open={isOpenForFundingModalOpen}
        maskClosable={false}
        onCancel={() => setIsOpenForFundingModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handlePollStatusChange(poll, "forFunding");
              setIsOpenForFundingModalOpen(false);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsOpenForFundingModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>

      <Modal
        title={"Close Poll: " + poll.subject || poll.title || poll.question}
        open={isClosePollModalOpen}
        maskClosable={false}
        onCancel={() => setIsClosePollModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handleClosePoll(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsClosePollModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>

      <Modal
        title={"Fund poll: " + poll.subject || poll.title || poll.question}
        open={isFundingModalOpen}
        maskClosable={false}
        onCancel={() => setIsFundingModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handleFundPollLocal(poll);
              setIsFundingModalOpen(false);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsFundingModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
        <Form
          layout={"horizontal"}
          form={form}
          name="basicInfo"
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          {/* <div style={contentStyle}>{stepItems[current].content}</div> */}
          <Form.Item 
            label="Fund"
            name="contribution"
            rules={[{ required: true, message: 'Please enter amount to contribute' }]}
            style={{ textAlign: 'center' }}
          >
            <Input placeholder="Amount in ETH" />
          </Form.Item>
        </Form>
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