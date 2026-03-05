"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { DEAL_STAGES, MOCK_PEOPLE } from "@/types/crm";

export function NewDealDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-1.5" />
          New Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Title - full width */}
          <div className="col-span-2 space-y-2">
            <Label htmlFor="deal-title">Title</Label>
            <Input id="deal-title" placeholder="Deal title" />
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label htmlFor="deal-value">Value</Label>
            <Input id="deal-value" type="number" placeholder="0" />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select defaultValue="USD">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select defaultValue="New">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Person */}
          <div className="space-y-2">
            <Label>Person</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PEOPLE.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label>Owner</Label>
            <Select defaultValue="u1">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="u1">Alex Kim</SelectItem>
                <SelectItem value="u2">Jordan Lee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Close Date */}
          <div className="space-y-2">
            <Label htmlFor="deal-close-date">Close Date</Label>
            <Input id="deal-close-date" type="date" />
          </div>

          {/* Notes - full width */}
          <div className="col-span-2 space-y-2">
            <Label htmlFor="deal-notes">Notes</Label>
            <Textarea id="deal-notes" placeholder="Additional notes..." rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Create Deal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
