"use client"

import { Form } from 'antd';
import { useState } from "react";

import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useConfig, useSendUserOp, useSignature } from '@/hooks';
import { ethers } from 'ethers';

import LandingPageHeader from "@/pages/landing/landing-header";
import CreatePoll from "@/pages/simple/create-poll";

export default function CreatePollPage() {
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();

  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const config = useConfig(); // Get config to access RPC URL
  const [isLoading, setIsLoading] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCreatePoll = async (pollForm: any) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'createPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: [
          pollForm.subject,
          pollForm.description,
          pollForm.options,
          ethers.utils.parseEther(pollForm.rewardPerResponse).toString(),
          parseInt(pollForm.duration),
          parseInt(pollForm.maxResponses),
          ethers.utils.parseEther(pollForm.minContribution).toString(),
          ethers.utils.parseEther(pollForm.targetFund).toString(),
          ethers.constants.AddressZero, // Use address(0) for native ETH
        ],
        value: 0
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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LandingPageHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <CreatePoll handleCreatePoll={handleCreatePoll} /> 
      </div>
    </div>
  )
}
