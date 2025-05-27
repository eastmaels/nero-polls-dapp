"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Link } from 'react-router-dom'
import { useSignature, useConfig } from '@/hooks';

import { POLLS_DAPP_ABI,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { ethers } from 'ethers';
import { convertTimestampToDate } from '@/utils/format';
import { PollState } from '@/types/poll';

import { Button } from "@/components/ui_v3/button"
import { Input } from "@/components/ui_v3/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card"
import { Badge } from "@/components/ui_v3/badge"
import { ArrowRight, Users, Trophy, Shield, Coins, Clock, Eye } from "lucide-react"
import Image from "next/image"
import LandingPageHeader from "@/pages/landing/landing-header";

const TypewriterText = () => {
  const words = ["businesses", "surveys", "art contests", "debates"]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentWord = words[currentWordIndex]

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false)
          setIsDeleting(true)
          return
        }

        if (isDeleting) {
          setCurrentText(currentWord.substring(0, currentText.length - 1))
          if (currentText === "") {
            setIsDeleting(false)
            setCurrentWordIndex((prev) => (prev + 1) % words.length)
          }
        } else {
          setCurrentText(currentWord.substring(0, currentText.length + 1))
          if (currentText === currentWord) {
            setIsPaused(true)
          }
        }
      },
      isDeleting ? 50 : isPaused ? 2000 : 100,
    )

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, isPaused, currentWordIndex, words])

  return (
    <span className="text-primary">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  )
}

const featuredPolls = [
  {
    id: 1,
    title: "Best Logo Design Contest",
    description: "Vote for the most creative logo design",
    participants: 156,
    timeLeft: "2 days",
    prize: "0.5 ETH",
    category: "Design",
  },
  {
    id: 2,
    title: "Favorite Programming Language",
    description: "What's your go-to programming language?",
    participants: 342,
    timeLeft: "5 days",
    prize: "0.2 ETH",
    category: "Tech",
  },
  {
    id: 3,
    title: "Best Coffee Shop in NYC",
    description: "Help us find the best coffee in the city",
    participants: 89,
    timeLeft: "1 day",
    prize: "0.1 ETH",
    category: "Lifestyle",
  },
  {
    id: 4,
    title: "Crypto Art Showcase",
    description: "Vote for the most innovative crypto art",
    participants: 234,
    timeLeft: "3 days",
    prize: "1.0 ETH",
    category: "Art",
  },
  {
    id: 5,
    title: "Best DeFi Protocol",
    description: "Which DeFi protocol do you trust most?",
    participants: 567,
    timeLeft: "4 days",
    prize: "0.3 ETH",
    category: "DeFi",
  },
  {
    id: 6,
    title: "Sustainable Energy Solutions",
    description: "Vote for the most promising green tech",
    participants: 123,
    timeLeft: "6 days",
    prize: "0.4 ETH",
    category: "Environment",
  },
  {
    id: 7,
    title: "Best Mobile App UI",
    description: "Which app has the best user interface?",
    participants: 298,
    timeLeft: "2 days",
    prize: "0.25 ETH",
    category: "Design",
  },
  {
    id: 8,
    title: "Future of Web3",
    description: "What's the next big thing in Web3?",
    participants: 445,
    timeLeft: "7 days",
    prize: "0.6 ETH",
    category: "Web3",
  },
]

export default function LandingPage() {
  const { AAaddress, isConnected } = useSignature();

  const config = useConfig(); // Get config to access RPC URL
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [polls, setPolls] = useState<any[]>([]);
  const [email, setEmail] = useState("")

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Email submitted:", email)
    setEmail("")
  }

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

  return (
    <div className="min-h-screen bg-background pr-9">
      {/* Header */}
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl text-white">D</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            polls for <TypewriterText />
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create decentralized polls and contests with built-in rewards. Fair, transparent, and profitable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/polls/new">
              <Button size="lg" className="w-full sm:w-auto text-white">
                Create Your First Poll
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/polls/live">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Polls
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Polls Section */}
      <AnimatedSection>
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Polls</h2>
              <p className="text-muted-foreground text-lg">Join active polls and contests happening right now</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {featuredPolls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">{poll.category}</Badge>
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
                    <Button className="w-full" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Poll
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Link to="/polls/live">
                <Button size="lg" className="text-white">
                  View All Polls
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* As Used By Section */}
      {/* <AnimatedSection>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-8">As used by</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+A"
                    alt="Company A"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+B"
                    alt="Company B"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+C"
                    alt="Company C"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+D"
                    alt="Company D"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection> */}

      {/* Why Create Polls Section */}
      <AnimatedSection>
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why create polls with NERO dpolls?</h2>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Trophy className="h-4 w-4 text-primary-foreground text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Make a contest, make money</h3>
                      <p className="text-muted-foreground">Turn your creative ideas into profitable contests</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Coins className="h-4 w-4 text-primary-foreground text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">We split all charges 70 (you)/30 (us)</h3>
                      <p className="text-muted-foreground">Keep most of what you earn from your polls</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="h-4 w-4 text-primary-foreground text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Let anyone vote—or allowlist. The choice is yours, and it's anti-bot
                      </h3>
                      <p className="text-muted-foreground">Control who participates with built-in bot protection</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Trophy className="h-4 w-4 text-primary-foreground text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Create a rewards pool for winners</h3>
                      <p className="text-muted-foreground">Incentivize participation with attractive rewards</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Coins className="h-4 w-4 text-primary-foreground text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Keep the money you earn, or put it back into rewards pool</h3>
                      <p className="text-muted-foreground">Flexible reward distribution options</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="h-4 w-4 text-primary-foreground text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Give players rewards, points, credentials—all data is onchain
                      </h3>
                      <p className="text-muted-foreground">Transparent, verifiable achievements</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <form onSubmit={handleEmailSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button className="text-white" type="submit">Get Started</Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How it works</h2>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6">To create a contest:</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm text-white">1</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Pick your contest type:</strong> who can enter? who can vote?
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm text-white">2</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Pick a gallery view or text view</strong>
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm text-white">3</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Set duration</strong> for entry and voting periods
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm text-white">4</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Set charges</strong> for entering and voting
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm text-white">5</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Bonus:</strong> add a rewards pool. Fund it yourself—or with money you earn from the
                      contest.
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm text-white">6</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>And it's free.</strong> You just pay the cost to deploy (often just cents).
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Link to="/polls/live">
                  <Button size="lg" className="text-white">
                    View Polls
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm text-white">D</span>
                </div>
                <span className="text-xl font-bold text-white">dpolls</span>
              </div>
              <p className="text-muted-foreground">Decentralized polling platform for the future of decision making.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="/polls/live" className="hover:text-foreground">
                    Live Polls
                  </Link>
                </li>
                <li>
                  <Link to="/polls/new" className="hover:text-foreground">
                    Create Poll
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    How it Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 dpolls. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
