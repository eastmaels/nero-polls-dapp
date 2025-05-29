"use client"

import { DatePicker, Select } from "antd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Input } from "@/components/ui_v3/input";
import { Label } from "@/components/ui_v3/label";
import { Textarea } from "@/components/ui_v3/textarea";
import { PollState } from "@/types/poll";
import { Calendar } from "lucide-react";
import dayjs from 'dayjs';

const { Option } = Select;

interface PollStepProps {
  formData: PollState;
  updateFormData: (name: string, value: any) => void;
}

export default function PollStep1({ formData, updateFormData }: PollStepProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Poll Content
        </CardTitle>
        <CardDescription>Define your poll question, description, and timing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Poll Question/Topic *</Label>
          <Input
            id="subject"
            placeholder="What question do you want to ask?"
            value={formData.subject}
            onChange={(e) => updateFormData("subject", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Provide context and details about your poll"
            rows={4}
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
              placeholder="Select a category"
              allowClear
              onChange={(value) => updateFormData("category", value)}
              style={{ width: "100%" }}
            >
              <Option value="art">Art</Option>
              <Option value="design">Design</Option>
              <Option value="tech">Technology</Option>
              <Option value="defi">DeFi</Option>
              <Option value="lifestyle">Lifestyle</Option>
              <Option value="environment">Environment</Option>
              <Option value="web3">Web3</Option>
              <Option value="food">Food</Option>
              <Option value="other">Other</Option>
            </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voting-duration">Voting Period (days) *</Label>
          {/* <Input
            id="voting-duration"
            type="number"
            placeholder="3"
            min="1"
            value={formData.duration}
            onChange={(e) => updateFormData("duration", e.target.value)}
            required
          /> */}
          <DatePicker
            onChange={(endDate) => {
              const currentDate = new Date();
              const durationInMs = endDate?.toDate().getTime() - currentDate.getTime();
              const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
              updateFormData("duration", durationInDays)
            }}
            picker="date"
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            disabledDate={(current) => {
              return current && current < dayjs().endOf('day');
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}