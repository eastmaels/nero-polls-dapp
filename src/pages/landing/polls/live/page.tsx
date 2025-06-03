"use client"

import { useState, useEffect } from "react"
import { Link } from 'react-router-dom'
import { Tag, Modal, Space, Button } from "antd"
import { Input } from "@/components/ui_v3/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_v3/select"
import { Search, Users, Trophy, Clock, Eye, Filter } from "lucide-react"

import { useSignature, useConfig, useSendUserOp } from '@/hooks';
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { ethers } from 'ethers';
import { convertTimestampToDate } from '@/utils/format';
import { PollState } from '@/types/poll';
import LandingPageHeader from "@/pages/landing/landing-header"
import { calculateTimeLeft } from "@/utils/timeUtils"
import { VotePollModal } from "@/components/modals/vote-poll-modal"


export default function LivePollsPage() {

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { AAaddress, isConnected } = useSignature();

  const config = useConfig(); // Get config to access RPC URL
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [polls, setPolls] = useState<PollState[]>([]);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setIsLoading(true);

      // Create a provider using the RPC URL from config
      const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

      // Create a contract instance for the NFT contract
      const pollsContract = new ethers.Contract(
        CONTRACT_ADDRESSES.dpollsContract,
        POLLS_DAPP_ABI,
        provider
      );
      console.log('pollsContract', pollsContract)

      // Get all poll IDs
      const allPollIds = await pollsContract.getAllPollIds();
      if (allPollIds.length > 0) {
        const fetchedPolls: PollState[] = await Promise.all(
          allPollIds.map(async (pollId: number) => {
            try {
              // Get poll details using the polls function
              const pollDetails = await pollsContract.getPoll(pollId);
              const pollResponses = await pollsContract.getPollResponses(pollId);
              const modPollResponses = pollResponses?.map((response: any) => {
                return response.response
              });
              const pollResonsesWithAddress = pollResponses?.map((response: any) => {
                return {
                  address: response.responder,
                  response: response.response,
                  isClaimed: response.isClaimed,
                  weight: response.weight,
                  timestamp: convertTimestampToDate(Number(response.timestamp)),
                  reward: response.reward
                }
              });

              console.log('pollDetails', pollDetails)

              // Format the poll data
              return {
                id: pollId,
                creator: pollDetails.creator,
                subject: pollDetails.subject,
                description: pollDetails.description,
                category: pollDetails.category,
                status: pollDetails.status,
                createdAt: new Date(Number(pollDetails.endTime) * 1000 - Number(pollDetails.durationDays) * 24 * 60 * 60 * 1000),
                options: pollDetails.options,
                rewardPerResponse: pollDetails.rewardPerResponse,
                maxResponses: pollDetails.maxResponses.toString(),
                endTime: new Date(Number(pollDetails.endTime) * 1000),
                isOpen: pollDetails.isOpen,
                totalResponses: pollDetails.totalResponses.toString(),
                funds: pollDetails.funds,
                minContribution: pollDetails.minContribution,
                targetFund: pollDetails.targetFund,
                responses: modPollResponses,
                responsesWithAddress: pollResonsesWithAddress
              };
            } catch (error) {
              console.error(`Error fetching Poll #${pollId}:`, error);
              return null;
            }
          })
        );

        // Filter out any null values from failed fetches
        const validPolls = fetchedPolls.filter(poll => poll !== null);

        if (validPolls.length > 0) {
          setPolls(validPolls);
          setTxStatus(`Found ${validPolls.length} Polls`);
        } else {
          setTxStatus('No valid polls found');
          // Show sample polls as fallback
          setPolls([]);
        }
      } else {
        setTxStatus('No polls found');
        setPolls([]);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      setTxStatus('Error fetching polls');

      // Fallback to sample polls in case of error
      setPolls([]);
    } finally {
      setIsLoading(false);
    }
  };
  console.log('polls', polls)
  const filteredPolls = polls.filter((poll) => {
    const matchesSearch =
      poll.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || poll.category === categoryFilter
    const matchesStatus = statusFilter === "all" || poll.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = ["all", ...Array.from(new Set(polls.map((poll) => poll.category)))]
  const statuses = ["all", ...Array.from(new Set(polls.map((poll) => poll.status)))]
  console.log('categories', categories)
  console.log('statuses', statuses)

  return (
    <div className="min-h-screen bg-background">
      <LandingPageHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Live Polls</h1>
          <p className="text-muted-foreground text-lg">Discover and participate in active polls and contests</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredPolls.length} of {polls.length} polls
          </p>
        </div>

        {/* Polls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              type="active"
              fetchPolls={fetchPolls}
              AAaddress={AAaddress}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredPolls.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">No polls found matching your criteria</p>
            <Button
              color="default"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
                setStatusFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Create Poll CTA */}
        <div className="mt-12 text-center">
          <div className="bg-muted/50 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Don't see what you're looking for?</h3>
            <p className="text-muted-foreground mb-6">Create your own poll and start earning from participant fees</p>
            <Link to="/polls/new">
              <Button color="default">
                Create Your Poll
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  function PollCard({ poll, fetchPolls, AAaddress }:
    { poll: any, type: string, fetchPolls: () => void, AAaddress: string, }) {

    const { isConnected, } = useSignature();
    const { execute, waitForUserOpResult } = useSendUserOp();
    const [userOpHash, setUserOpHash] = useState<string | null>(null);
    const [txStatus, setTxStatus] = useState<string>('');
    const [isPolling, setIsPolling] = useState(false);
    const [isVoting, setIsVoting] = useState(false);

    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    const isVoted = poll.responsesWithAddress?.some(response => response.address === AAaddress);

    const [selectedPoll, setSelectedPoll] = useState<any | null>(null)
    const [isPollModalOpen, setIsPollModalOpen] = useState(false)

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
          abi: POLLS_DAPP_ABI, // Use the specific ABI with mint function
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

    const handleViewPoll = (poll: any) => {
      setSelectedPoll(poll)
      setIsPollModalOpen(true)
    }

    const closePollModal = () => {
      setIsPollModalOpen(false)
      setSelectedPoll(null)
    }

    function renderButtonText(poll: any): import("react").ReactNode {
      let btnTxt = "";
      switch (poll.status) {
        case "new":
          btnTxt = "View Details";
          break;
        case "closed":
          btnTxt = "View Results";
          break;
        default:
          btnTxt = "Respond to Poll"
          break;
      }
      return btnTxt;
    }

    return (
      <Card key={poll.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2">
              <Tag>{poll.category}</Tag>
              <Tag
                color={
                  poll.status === "new" ? "#108ee9" : poll.status === "for-claiming" ? "#f50" : "#87d068"
                }
              >
                {poll.status}
              </Tag>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{poll.endTime ? calculateTimeLeft(poll.endTime) : `${poll.duration} days`}</span>
            </div>
          </div>
          <CardTitle className="text-lg">{poll.subject}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-1" />
              <span>{poll.totalResponses} / {poll.maxResponses} participants</span>
            </div>
            <div className="flex items-center text-sm font-semibold text-primary">
              <Trophy className="h-4 w-4 mr-1" />
              <span>{ethers.utils.formatEther(poll.targetFund || '0')} NERO </span>
            </div>
          </div>
          <Button
            color="default"
            className="w-full"
            onClick={() => handleViewPoll(poll)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {renderButtonText(poll)}
          </Button>
        </CardContent>
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
                disabled={isVoted}
              >
                {option.text}
              </Button>
            ))}
          </Space>
        </Modal>
        <VotePollModal
          featureFlagNew={true} 
          poll={selectedPoll} isOpen={isPollModalOpen} onClose={closePollModal}
          fetchPolls={fetchPolls}
        />
      </Card>
    )
  }
}
