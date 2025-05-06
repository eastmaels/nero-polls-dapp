"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui_v2/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card"
import { Input } from "@/components/ui_v2/input"
import { Textarea } from "@/components/ui_v2/textarea"
import { Label } from "@/components/ui_v2/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui_v2/radio-group"
import { Switch } from "@/components/ui_v2/switch"
import { Separator } from "@/components/ui_v2/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_v2/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v2/tabs"
import { Calendar } from "@/components/ui_v2/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui_v2/popover"
import { format } from "date-fns"
import { CalendarIcon, Trash2, PlusCircle, ArrowLeft, Info, Lock, Globe, Users2 } from "lucide-react"

interface CreatePollProps {
  handleCreatePoll: () => Promise<void>;
  handleTabChange: (tab: string) => void;
}

interface PollOption {
  id: number;
  text: string;
}

export default function CreatePoll({ handleCreatePoll, handleTabChange }: CreatePollProps) {
  const navigate = useNavigate()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [options, setOptions] = useState<PollOption[]>([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ])
  const [isCreating, setIsCreating] = useState(false)

  const addOption = () => {
    const newId = options.length > 0 ? Math.max(...options.map((o) => o.id)) + 1 : 1
    setOptions([...options, { id: newId, text: "" }])
  }

  const removeOption = (id: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((option) => option.id !== id))
  }

  const updateOption = (id: number, text: string) => {
    setOptions(options.map((option) => (option.id === id ? { ...option, text } : option)))
  }

  const handleCreate = () => {
    setIsCreating(true)
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsCreating(false)
      navigate("/dashboard")
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-8">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Poll Information</CardTitle>
              <CardDescription>Enter the basic details for your poll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title</Label>
                <Input id="title" placeholder="Enter a clear, specific question" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide context and details about what you're asking"
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="governance">Governance</SelectItem>
                    <SelectItem value="treasury">Treasury</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={(newDate: Date | undefined) => setDate(newDate)}
                      initialFocus 
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button>Continue to Options</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Poll Options</CardTitle>
              <CardDescription>Add the choices voters can select from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {index + 1}
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={addOption}>
                <PlusCircle className="h-4 w-4" />
                Add Option
              </Button>

              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Poll Options</p>
                    <p>You need at least 2 options. Each option will be stored on-chain when you create the poll.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Back</Button>
              <Button>Continue to Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Poll Settings</CardTitle>
              <CardDescription>Configure how your poll works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voting Power</Label>
                    <p className="text-sm text-muted-foreground">How votes are weighted</p>
                  </div>
                  <RadioGroup defaultValue="token" className="flex">
                    <div className="flex items-center space-x-2 mr-4">
                      <RadioGroupItem value="token" id="token" />
                      <Label htmlFor="token">Token-based</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="equal" id="equal" />
                      <Label htmlFor="equal">Equal (1 wallet = 1 vote)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>Visibility</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Who can see this poll</p>
                  </div>
                  <RadioGroup defaultValue="public" className="flex">
                    <div className="flex items-center space-x-2 mr-4">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Public
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="token-holders" id="token-holders" />
                      <Label htmlFor="token-holders" className="flex items-center gap-1">
                        <Users2 className="h-3 w-3" /> Token Holders
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>Hide Results Until End</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Only show results after poll ends</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>Require Minimum Token Balance</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Set minimum tokens to vote</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="min-balance" />
                    <Input type="number" placeholder="100" className="w-24" disabled={true} />
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50 mt-6">
                  <div className="flex gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Immutable Settings</p>
                      <p>These settings cannot be changed after the poll is created due to the nature of blockchain.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Back</Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating Poll..." : "Create Poll"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}