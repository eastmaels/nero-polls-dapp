"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Input } from "@/components/ui_v3/input";
import { Label } from "@/components/ui_v3/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui_v3/radio-group";
import { PollState } from "@/types/poll";
import { ConfigProvider, Switch } from 'antd';
import { Shield } from "lucide-react";

interface PollStepProps {
  formData: PollState;
  updateFormData: (name: string, value: any) => void;
}

export default function PollStep3({ formData, updateFormData }: PollStepProps) {

  return (
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
            onValueChange={(value) => {
              updateFormData("openImmediately", false)
              updateFormData("fundingType", value)
            }}
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
              disabled={formData.fundingType === "crowdfunded"}
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
  );
}