/**
 * Interface for wallet connection state
 */
export interface PollState {
  id: number;
  creator: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  createdAt: Date;
  options: string[];
  rewardPerResponse: string;
  maxResponses: string;
  duration: string;
  endTime: Date;
  isOpen: boolean;
  totalResponses: number;
  funds: number;
  minContribution: string;
  targetFund: string;
  responses: string[];
  responsesWithAddress: {
    address: string;
    response: string;
    isClaimed: boolean;
    weight: number;
    timestamp: Date;
    reward: number;
  }[];
}