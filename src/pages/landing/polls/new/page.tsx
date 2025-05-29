"use client"

import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';

import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useSendUserOp, useSignature } from '@/hooks';
import { ethers } from 'ethers';

import { ConfigProvider, Switch } from 'antd';
import { Button } from "@/components/ui_v3/button";
import { Input } from "@/components/ui_v3/input"
import { Label } from "@/components/ui_v3/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Progress } from "@/components/ui_v3/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui_v3/radio-group";
//import { Switch } from "@/components/ui_v3/switch";
import { ArrowLeft, ArrowRight, CheckCircle, Plus, Shield, Trash2, Upload, Users } from "lucide-react";

import LandingPageHeader from "@/pages/landing/landing-header";
import { PollState } from '@/types/poll';
import PollStep1 from "./poll-step1";

const STEPS = [
  { id: 1, title: "Content", description: "Question, description & duration" },
  { id: 2, title: "Options", description: "Poll choices & display type" },
  { id: 3, title: "Settings", description: "Funding, rewards & limits" },
]

export default function CreatePollPage() {
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();
  const navigate = useNavigate();

  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [isLoading, setIsLoading] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [currentStep, setCurrentStep] = useState(1)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
      const rewardPerResponse = pollForm.rewardDistribution === "split" ?  "0" : pollForm.rewardPerResponse;

      const pollData = [
        pollForm.subject,
        pollForm.description,
        pollForm.category,
        pollForm.viewType,
        pollForm.options,
        ethers.utils.parseEther(rewardPerResponse).toString(),
        parseInt(pollForm.duration || "90"),
        parseInt(pollForm.maxResponses || "1000"),
        ethers.utils.parseEther(pollForm.minContribution || "0.000001").toString(),
        pollForm.fundingType,
        pollForm.openImmediately,
        ethers.utils.parseEther(pollForm.targetFund || "0").toString(),
        ethers.constants.AddressZero,
        pollForm.rewardDistribution
      ];
      console.log('pollData', pollData)

      console.log('pollForm.targetFund', pollForm.targetFund)
      const value = ethers.utils.parseEther(pollForm.targetFund) || 0;
      console.log('value', value)

      await execute({
        function: 'createPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: pollData,
        value: value
      });

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
  
    // Step 2: Options
    viewType: "text",
    options: ["", ""],
  
    // Step 3: Settings
    fundingType: "self-funded",
    openImmediately: true,
    rewardDistribution: "split",
    targetFund: "",
    rewardPerResponse: "",
    maxResponses: "",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addOption = () => {
    updateFormData("options", [...formData.options, ""])
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      updateFormData("options", newOptions)
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    updateFormData("options", newOptions)
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
          formData.description &&
          formData.category &&
          formData.duration
        )
      case 2:
        return formData.options.every((option) => option.trim() !== "")
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Poll Options
                </CardTitle>
                <CardDescription>Configure your poll choices and display type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Poll Display Type</Label>
                  <RadioGroup value={formData.viewType} onValueChange={(value) => updateFormData("viewType", value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="text" />
                      <Label htmlFor="text">Text-based poll</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gallery" id="gallery" />
                      <Label htmlFor="gallery">Gallery view (images/media)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label>Poll Options *</Label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          required
                        />
                      </div>
                      {formData.viewType === "gallery" && (
                        <Button type="button" variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                      {formData.options.length > 2 && (
                        <Button type="button" variant="outline" size="icon" onClick={() => removeOption(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addOption} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <div className={baseClasses}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Poll Settings
                </CardTitle>
                <CardDescription>Configure funding, rewards, and response limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>How will the poll be funded? *</Label>
                  <RadioGroup
                    value={formData.fundingType}
                    onValueChange={(value) => updateFormData("fundingType", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="self-funded" id="self-funded" />
                      <Label htmlFor="self-funded">Self-funded (I'll fund the rewards)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="crowdfunded" id="crowdfunded" />
                      <Label htmlFor="crowdfunded">Crowdfunded (Participants fund the rewards)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <ConfigProvider
                    theme={{
                      token: {
                        colorPrimary: "#000"
                      },
                    }}
                  >
                    <Switch
                      id="open-immediately"
                      checked={formData.openImmediately}
                      className="text-white"
                      onChange={(checked) => updateFormData("openImmediately", checked)}
                      checkedChildren="Y" unCheckedChildren="N"
                    />
                  </ConfigProvider>
                  <Label htmlFor="open-immediately">Open poll immediately after creation</Label>
                </div>

                <div className="space-y-4">
                  <Label>How will responders be rewarded? *</Label>
                  <RadioGroup
                    value={formData.rewardDistribution}
                    onValueChange={(value) => updateFormData("rewardDistribution", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="split" id="split" />
                      <Label htmlFor="split">Split total funds equally among all responders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed">Fixed amount per responder</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.rewardDistribution === "split" ? (
                  <div className="space-y-2">
                    <Label htmlFor="target-fund">Target Fund Amount (ETH) *</Label>
                    <Input
                      id="target-fund"
                      type="number"
                      step="0.001"
                      placeholder="1.0"
                      min="0"
                      value={formData.targetFund}
                      onChange={(e) => updateFormData("targetFund", e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="fixed-reward">Fixed Reward per Responder (ETH) *</Label>
                    <Input
                      id="fixed-reward"
                      type="number"
                      step="0.001"
                      placeholder="0.01"
                      min="0"
                      value={formData.rewardPerResponse}
                      onChange={(e) => updateFormData("rewardPerResponse", e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="response-limit">Target Number of Responses</Label>
                  <Input
                    id="response-limit"
                    type="number"
                    placeholder="100"
                    min="1"
                    value={formData.maxResponses}
                    onChange={(e) => updateFormData("maxResponses", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Leave empty for unlimited responses</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LandingPageHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link to="/polls/live" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Live Polls
        </Link>

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
    </div>
  )
}
