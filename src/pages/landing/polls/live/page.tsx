"use client"

import { useState, useEffect } from "react"
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui_v3/button"
import { Input } from "@/components/ui_v3/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card"
import { Badge } from "@/components/ui_v3/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_v3/select"
import { Search, Users, Trophy, Clock, Eye, Filter } from "lucide-react"

import { useSignature, useConfig } from '@/hooks';
import { POLLS_DAPP_ABI,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { ethers } from 'ethers';
import { convertTimestampToDate } from '@/utils/format';
import { PollState } from '@/types/poll';
import LandingPageHeader from "@/pages/landing/landing-header"


const allPolls = [
  {
    id: 1,
    title: "Best Logo Design Contest",
    description: "Vote for the most creative logo design submission",
    participants: 156,
    timeLeft: "2 days",
    prize: "0.5 ETH",
    category: "Design",
    status: "Active",
  },
  {
    id: 2,
    title: "Favorite Programming Language",
    description: "What's your go-to programming language for web development?",
    participants: 342,
    timeLeft: "5 days",
    prize: "0.2 ETH",
    category: "Tech",
    status: "Active",
  },
  {
    id: 3,
    title: "Best Coffee Shop in NYC",
    description: "Help us find the best coffee shop in New York City",
    participants: 89,
    timeLeft: "1 day",
    prize: "0.1 ETH",
    category: "Lifestyle",
    status: "Ending Soon",
  },
  {
    id: 4,
    title: "Crypto Art Showcase",
    description: "Vote for the most innovative crypto art piece",
    participants: 234,
    timeLeft: "3 days",
    prize: "1.0 ETH",
    category: "Art",
    status: "Active",
  },
  {
    id: 5,
    title: "Best DeFi Protocol",
    description: "Which DeFi protocol do you trust the most?",
    participants: 567,
    timeLeft: "4 days",
    prize: "0.3 ETH",
    category: "DeFi",
    status: "Active",
  },
  {
    id: 6,
    title: "Sustainable Energy Solutions",
    description: "Vote for the most promising green technology",
    participants: 123,
    timeLeft: "6 days",
    prize: "0.4 ETH",
    category: "Environment",
    status: "Active",
  },
  {
    id: 7,
    title: "Best Mobile App UI",
    description: "Which mobile app has the best user interface design?",
    participants: 298,
    timeLeft: "2 days",
    prize: "0.25 ETH",
    category: "Design",
    status: "Active",
  },
  {
    id: 8,
    title: "Future of Web3",
    description: "What do you think is the next big thing in Web3?",
    participants: 445,
    timeLeft: "7 days",
    prize: "0.6 ETH",
    category: "Web3",
    status: "Active",
  },
  {
    id: 9,
    title: "Best Pizza in Chicago",
    description: "Help settle the debate about Chicago's best pizza",
    participants: 201,
    timeLeft: "Ended",
    prize: "0.15 ETH",
    category: "Food",
    status: "Ended",
  },
  {
    id: 10,
    title: "AI Tool of the Year",
    description: "Which AI tool has been most useful this year?",
    participants: 389,
    timeLeft: "3 days",
    prize: "0.35 ETH",
    category: "Tech",
    status: "Active",
  },
]

export default function LivePollsPage() {
  
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const { AAaddress, isConnected } = useSignature();

  const config = useConfig(); // Get config to access RPC URL
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [polls, setPolls] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected) {
      fetchPolls();
    }
  }, [isConnected]); 

  const fetchPolls = async () => {
    if (!isConnected || !AAaddress) return;

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

  const filteredPolls = polls.filter((poll) => {
    const matchesSearch =
      poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || poll.category === categoryFilter
    const matchesStatus = statusFilter === "all" || poll.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })
  console.log('filteredPolls', filteredPolls)

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
            Showing {filteredPolls.length} of {allPolls.length} polls
          </p>
        </div>

        {/* Polls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <Card key={poll.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <Badge variant="secondary">{poll.category}</Badge>
                    <Badge
                      variant={
                        poll.status === "Active" ? "default" : poll.status === "Ending Soon" ? "destructive" : "outline"
                      }
                    >
                      {poll.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {poll.timeLeft}
                  </div>
                </div>
                <CardTitle className="text-lg">{poll.title}</CardTitle>
                <CardDescription>{poll.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    {poll.participants} participants
                  </div>
                  <div className="flex items-center text-sm font-semibold text-primary">
                    <Trophy className="h-4 w-4 mr-1" />
                    {poll.prize}
                  </div>
                </div>
                <Button className="w-full" variant={poll.status === "Ended" ? "outline" : "default"}>
                  <Eye className="h-4 w-4 mr-2" />
                  {poll.status === "Ended" ? "View Results" : "View Poll"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredPolls.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">No polls found matching your criteria</p>
            <Button
              className="text-white"
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
              <Button size="lg" className="text-white">
                Create Your Poll
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
