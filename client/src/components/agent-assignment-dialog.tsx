import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Check, X } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  agentType: string;
  isActive: boolean;
}

interface AgentAssignmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Agent[];
  selectedItems: string[];
  onAssign: (agentIds: string[], itemIds: string[]) => void;
  isSubmitting?: boolean;
}

export function AgentAssignmentDialog({
  isOpen,
  onOpenChange,
  agents,
  selectedItems,
  onAssign,
  isSubmitting = false,
}: AgentAssignmentDialogProps) {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const activeAgents = agents.filter(agent => agent.isActive);

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleAssign = () => {
    if (selectedAgents.length > 0) {
      onAssign(selectedAgents, selectedItems);
      setSelectedAgents([]);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedAgents([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign to Agents
          </DialogTitle>
          <DialogDescription>
            Assign {selectedItems.length} document{selectedItems.length > 1 ? 's' : ''} to agents. 
            Agents will use these documents as knowledge sources.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected documents summary */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">
              {selectedItems.length} document{selectedItems.length > 1 ? 's' : ''} selected
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedItems.length === 1 
                ? "1 document will be assigned" 
                : `${selectedItems.length} documents will be assigned to selected agents`}
            </div>
          </div>

          {/* Agent selection */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Select Agents</div>
            {activeAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active agents available
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activeAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAgents.includes(agent.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                    onClick={() => handleAgentToggle(agent.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/api/placeholder/avatar/${agent.id}`} />
                        <AvatarFallback className="text-xs">
                          {agent.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.agentType}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    {selectedAgents.includes(agent.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected agents summary */}
          {selectedAgents.length > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-sm font-medium mb-2">
                {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} selected
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedAgents.map((agentId) => {
                  const agent = activeAgents.find(a => a.id === agentId);
                  return agent ? (
                    <Badge key={agentId} variant="default" className="text-xs">
                      {agent.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={selectedAgents.length === 0 || isSubmitting}
          >
            <Check className="h-4 w-4 mr-2" />
            {isSubmitting ? "Assigning..." : `Assign to ${selectedAgents.length} Agent${selectedAgents.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}