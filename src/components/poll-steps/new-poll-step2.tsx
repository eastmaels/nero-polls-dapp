"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui_v3/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Input } from "@/components/ui_v3/input";
import { Label } from "@/components/ui_v3/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui_v3/radio-group";
import { PollState } from "@/types/poll";
import { Plus, Trash2, Upload, Users } from "lucide-react";
import dpollsConfig from '@/../dpolls.config'

interface PollStepProps {
  formData: PollState;
  updateFormData: (name: string, value: any) => void;
}

export default function PollStep2({ formData, updateFormData }: PollStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  console.log('poll step2-1')

  useEffect(() => {
    console.log('poll step2-2 dpollsConfig.api', dpollsConfig.api)
    const generateOptions = async () => {
      if (formData.useAI) {
        setIsGenerating(true);
        try {
          const response = await fetch(`${dpollsConfig.api}/api/poll-options`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: formData.subject,
              category: formData.category,
              numOptions: formData.numOptions || 4
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate options');
          }

          const resp = await response.json();
          updateFormData("options", resp.data.options || []);
        } catch (error) {
          console.error('Error generating options:', error);
          // Fallback to empty options if generation fails
          updateFormData("options", []);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    generateOptions();
  }, [formData.useAI, formData.subject, formData.numOptions]);

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

  return (
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
            {/* <div className="flex items-center space-x-2">
              <RadioGroupItem value="gallery" id="gallery" />
              <Label htmlFor="gallery">Gallery view (images/media)</Label>
            </div> */}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label>Poll Options *</Label>
          {isGenerating ? (
            <div className="text-center py-4">Generating options...</div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}