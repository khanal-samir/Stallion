import { Search, Upload, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { PeopleTable } from "@/components/people/people-table";
import { MOCK_PEOPLE } from "@/types/crm";

export default function PeoplePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        count={MOCK_PEOPLE.length}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search people..." className="w-72 pl-8" />
            </div>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="u1">Alex Kim</SelectItem>
                <SelectItem value="u2">Jordan Lee</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1.5" />
              Import CSV
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Person
            </Button>
          </>
        }
      />

      <PeopleTable />
    </div>
  );
}
