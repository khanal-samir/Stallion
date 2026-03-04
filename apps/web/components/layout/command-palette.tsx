"use client";

import * as React from "react";
import { useEffect } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { MOCK_PEOPLE, MOCK_DEALS, MOCK_SEQUENCES } from "@/types/crm";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command className="rounded-lg">
          <CommandInput placeholder="Search people, deals, sequences..." />
          <CommandList className="max-h-80">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">People</div>
            {MOCK_PEOPLE.slice(0, 4).map((p) => (
              <CommandItem
                key={p.id}
                value={p.name}
                onSelect={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <Search className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm">{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{p.orgName}</span>
              </CommandItem>
            ))}

            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-1">Deals</div>
            {MOCK_DEALS.slice(0, 3).map((d) => (
              <CommandItem
                key={d.id}
                value={d.title}
                onSelect={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <Search className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm">{d.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  ${d.value.toLocaleString()}
                </span>
              </CommandItem>
            ))}

            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-1">
              Sequences
            </div>
            {MOCK_SEQUENCES.slice(0, 3).map((s) => (
              <CommandItem
                key={s.id}
                value={s.name}
                onSelect={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <Search className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm">{s.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{s.status}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
