"use client"

import { useState } from "react"
import { Home, BarChart3, PieChart, PlusCircle, Settings, Users, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui_v3/button"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui_v3/collapsible"

interface LeftSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isMobile: boolean
}

export default function LeftSidebar({ activeTab, setActiveTab, isMobile }: LeftSidebarProps) {
  const [openPolls, setOpenPolls] = useState(true)

  return (
    <div className="h-full py-4 flex flex-col">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
        <div className="space-y-1">
          <Button
            variant={activeTab === "dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("dashboard")}
            data-tour="dashboard-nav"
          >
            <Home className="mr-2 h-4 w-4" />
            Overview
          </Button>

          <Collapsible open={openPolls} onOpenChange={setOpenPolls}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Polls
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", openPolls ? "transform rotate-180" : "")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 space-y-1">
              <Button
                variant={activeTab === "active-polls" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("active-polls")}
                data-tour="active-polls-nav"
              >
                Active Polls
              </Button>
              <Button
                variant={activeTab === "funding-polls" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("funding-polls")}
                data-tour="funding-polls-nav"
              >
                Funding
              </Button>
              <Button
                variant={activeTab === "claiming" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("claiming")}
                data-tour="claim-polls-nav"
              >
                Claiming
              </Button>
              <Button
                variant={activeTab === "completed-polls" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("completed-polls")}
              >
                Completed Polls
              </Button>
              <Button
                variant={activeTab === "new" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("created-polls")}
                data-tour="manage-polls-nav"
              >
                Manage
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Button
            variant={activeTab === "analytics" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("analytics")}
            data-tour="analytics-nav"
          >
            <PieChart className="mr-2 h-4 w-4" />
            Analytics
          </Button>

          <Button
            variant={activeTab === "create-poll" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("create-poll")}
            data-tour="create-poll-nav"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Poll
          </Button>

          <Button
            variant={activeTab === "users" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </Button>

          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {!isMobile && (
        <div className="mt-auto px-3 py-2">
          <div className="p-4 rounded-lg bg-muted">
            <h3 className="text-sm font-medium">Need help?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Check our documentation or contact support for assistance.
            </p>
            <Button className="w-full mt-3" size="sm">
              View Documentation
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
