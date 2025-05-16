/**
 * Interface for wallet connection state
 */
export interface PollState {
  id: number;
  creator: string;
  subject: string;
  description: string;
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
  responsesWithAddress: any[];
}