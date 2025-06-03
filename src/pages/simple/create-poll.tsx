"use client"

import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useSendUserOp, useSignature } from '@/hooks';
import { ethers } from 'ethers';

import { Button } from "@/components/ui_v3/button";
import { Progress } from "@/components/ui_v3/progress";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

import PollStep1 from "@/components/poll-steps/new-poll-step1";
import PollStep2 from "@/components/poll-steps/new-poll-step2";
import PollStep3 from "@/components/poll-steps/new-poll-step3";
import { PollState } from '@/types/poll';

const STEPS = [
  { id: 1, title: "Content", description: "Question, description & duration" },
  { id: 2, title: "Options", description: "Poll choices & display type" },
  { id: 3, title: "Settings", description: "Funding, rewards & limits" },
]

export default function CreatePoll() {
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();
  const navigate = useNavigate();

  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [isLoading, setIsLoading] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleCreatePoll = async (pollForm: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {

      if (pollForm.fundingType === 'unfunded') {
        const pollInput = {
          subject: pollForm.subject,
          description: pollForm.description,
          category: pollForm.category,
          viewType: pollForm.viewType,
          options: pollForm.options,
          durationDays: parseInt(pollForm.duration || "90"),
          isOpenImmediately: pollForm.openImmediately
        };
        console.log('pollInput', pollInput);

        await execute({
          function: 'createUnfundedPoll',
          contractAddress: CONTRACT_ADDRESSES.dpollsContract,
          abi: POLLS_DAPP_ABI,
          params: [pollInput],
          value: 0
        });

      } else {
        const rewardPerResponse = pollForm.rewardDistribution === "split" ? "0" : pollForm.rewardPerResponse;
        const value = ethers.utils.parseEther(pollForm.targetFund || "0");
        const pollInput = {
          subject: pollForm.subject,
          description: pollForm.description,
          category: pollForm.category,
          viewType: pollForm.viewType,
          options: pollForm.options,
          rewardPerResponse: ethers.utils.parseEther(rewardPerResponse).toString(),
          durationDays: parseInt(pollForm.duration || "90"),
          maxResponses: parseInt(pollForm.maxResponses || "1000"),
          minContribution: ethers.utils.parseEther(pollForm.minContribution || "0.000001").toString(),
          fundingType: pollForm.fundingType,
          isOpenImmediately: pollForm.openImmediately,
          targetFund: ethers.utils.parseEther(pollForm.targetFund || "0").toString(),
          rewardToken: ethers.constants.AddressZero,
          rewardDistribution: pollForm.rewardDistribution,
          voteWeight: "simple", // Default to simple voting
          baseContributionAmount: ethers.utils.parseEther("1").toString(), // Default to 1 ETH as base
          maxWeight: "10" // Default max weight of 10
        };
        console.log('pollInput', pollInput);

        await execute({
          function: 'createPoll',
          contractAddress: CONTRACT_ADDRESSES.dpollsContract,
          abi: POLLS_DAPP_ABI,
          params: [pollInput],
          value: value
        });
      }

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);
      navigate("/polls/live");

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

  // Form state
  const [formData, setFormData] = useState<any>({
    // Step 1: Content
    subject: "",
    description: "",
    category: "",
    duration: "",
    useAI: false,
  
    // Step 2: Options
    viewType: "text",
    numOptions: 2,
    options: [],
  
    // Step 3: Settings
    fundingType: "self-funded",
    openImmediately: true,
    rewardDistribution: "split",
    targetFund: "",
    rewardPerResponse: "",
    maxResponses: "",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Poll created with data:", formData)
    await handleCreatePoll(formData);
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.subject &&
          formData.category &&
          formData.duration
        )
      case 2:
        return formData.options?.every((option: string) => option.trim() !== "")
      case 3:
        return formData.fundingType && (formData.rewardDistribution === "split" || formData.rewardPerResponse)
      default:
        return false
    }
  }

  const renderStepContent = () => {
    const baseClasses = `transition-all duration-300 ${isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      }`

    switch (currentStep) {
      case 1:
        return (
          <div className={baseClasses}>
            <PollStep1 formData={formData} updateFormData={updateFormData} />
          </div>
        )

      case 2:
        return (
          <div className={baseClasses}>
            <PollStep2 formData={formData} updateFormData={updateFormData} />
          </div>
        )

      case 3:
        return (
          <div className={baseClasses}>
            <PollStep3 formData={formData} updateFormData={updateFormData} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Create New Poll</h1>
        <p className="text-muted-foreground text-lg">
          Set up your poll or contest and start earning from participant fees
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step.id
                    ? "bg-primary text-primary-foreground text-white"
                    : currentStep > step.id
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 md:w-32 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{STEPS[currentStep - 1].title}</h2>
          <p className="text-muted-foreground">{STEPS[currentStep - 1].description}</p>
        </div>
        <Progress value={(currentStep / STEPS.length) * 100} className="mt-4" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step Content */}
        <div className="min-h-[500px]">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep === STEPS.length ? (
            <Button type="submit" className="flex items-center text-white">
              Create Poll
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className="flex items-center text-white"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Step Validation Info */}
        {!isStepValid(currentStep) && (
          <div className="text-center text-sm text-muted-foreground">
            Please fill in all required fields to continue
          </div>
        )}
      </form>

      {/* Cost Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Deployment cost: ~$0.50 USD (varies with gas prices)</p>
      </div>
    </div>
  )
}