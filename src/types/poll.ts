/**
 * Interface for wallet connection state
 */
export interface PollState {
  id: number;
  creator: string;
  subject: string;
  description: string;
  status: string;
  createdAt: Date;
  options: string[];
  rewardPerResponse: number;
  maxResponses: number;
  endTime: Date;
  isOpen: boolean;
  totalResponses: number;
  funds: number;
  minContribution: number;
  targetFund: number;
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