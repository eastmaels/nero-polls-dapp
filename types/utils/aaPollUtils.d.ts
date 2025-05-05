import { ethers } from 'ethers';
import { PollState } from '../types/poll';
export declare const throttledRequest: (key: string, requestFn: () => Promise<any>, timeWindow?: number) => Promise<any>;
export declare const getProvider: () => ethers.providers.JsonRpcProvider;
export declare const getSigner: () => Promise<ethers.providers.JsonRpcSigner>;
export declare const initAAClient: (accountSigner: ethers.Signer) => Promise<any>;
export declare const initAABuilder: (accountSigner: ethers.Signer, apiKey?: string) => Promise<any>;
export declare const getAAWalletAddress: (accountSigner: ethers.Signer, apiKey?: string) => Promise<any>;
export declare const setPaymentType: (builder: any, paymentType: number, tokenAddress?: string) => any;
export declare const getSupportedTokensFromSDK: (client: any, builder: any) => Promise<any>;
export declare const getTokenBalance: (address: string, tokenAddress: string) => Promise<string>;
export declare const directGetSupportedTokens: (sender: string, apiKey: string) => Promise<any>;
export declare const getAllTokenBalances: (userAddress: string, tokens: any[]) => Promise<{
    [key: string]: string;
}>;
export declare const getSupportedTokens: (client: any, builder: any) => Promise<any>;
export declare const resetTokenRequestCount: () => void;
export declare const mintERC20Token: (accountSigner: ethers.Signer, recipientAddress: string, amount: ethers.BigNumber, paymentType?: number, // 0: free, 1: prepay, 2: postpay
selectedToken?: string, // Token address for ERC20 payment
options?: {
    apiKey?: string;
    gasMultiplier?: number;
}) => Promise<any>;
export declare const createPoll: (accountSigner: ethers.Signer, recipientAddress: string, pollForm: PollState, metadataUri: string, paymentType?: number, // 0: free, 1: prepay, 2: postpay
selectedToken?: string, // Token address for ERC20 payment
options?: {
    apiKey?: string;
    gasMultiplier?: number;
}) => Promise<any>;
export declare const getNFTsForAddress: (address: string) => Promise<any[]>;
export declare const getTestTokenBalance: (address: string) => Promise<string>;
export declare const checkTokenAllowance: (provider: ethers.providers.Provider, tokenAddress: string, ownerAddress: string, spenderAddress?: string) => Promise<string>;
export declare const approveToken: (provider: ethers.providers.Web3Provider, tokenAddress: string, amount: ethers.BigNumber, spenderAddress?: string) => Promise<{
    success: boolean;
    transactionHash: any;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    transactionHash?: undefined;
}>;
export declare const transferTokenToAAWallet: (provider: ethers.providers.Web3Provider, tokenAddress: string, amount: ethers.BigNumber, recipientAddress: string) => Promise<{
    success: boolean;
    transactionHash: any;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    transactionHash?: undefined;
}>;
export declare const getNFTs: (ownerAddress: string) => Promise<{
    id: any;
    tokenId: number;
    name: string;
    description: string;
    image: string;
}[]>;
