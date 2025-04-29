import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Business, IssueReport } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IssueList from "@/components/issues/IssueList";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function IssuesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [, setLocation] = useLocation();
  
  // Redirect non-admin users
  useEffect(() => {
    if (!user || !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page",
        variant: "destructive"
      });
      setLocation("/");
    }
  }, [user, toast, setLocation]);
  
  // Fetch all issues
  const {
    data: issues = [],
    isLoading,
    isError,
    refetch
  } = useQuery<IssueReport[]>({
    queryKey: ["/api/issues"],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch businesses to display names
  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
    staleTime: 300000, // 5 minutes
  });
  
  // Function to get business name by ID
  const getBusinessName = (businessId: number) => {
    const business = businesses.find(b => b.id === businessId);
    return business ? business.name : `Business #${businessId}`;
  };
  
  // Filter issues based on status and search term
  const filteredIssues = issues.filter(issue => {
    // Filter by status if selected
    if (filterStatus && issue.status !== filterStatus) {
      return false;
    }
    
    // Filter by search term (business name, issue type, or description)
    if (searchTerm) {
      const businessName = getBusinessName(issue.businessId).toLowerCase();
      const termLower = searchTerm.toLowerCase();
      
      return (
        businessName.includes(termLower) ||
        issue.issueType.toLowerCase().includes(termLower) ||
        issue.description.toLowerCase().includes(termLower)
      );
    }
    
    return true;
  });
  
  // Get issue counts by status
  const issueCounts = {
    total: issues.length,
    pending: issues.filter(i => i.status === "pending").length,
    inProgress: issues.filter(i => i.status === "in_progress").length,
    resolved: issues.filter(i => i.status === "resolved").length,
    rejected: issues.filter(i => i.status === "rejected").length,
  };
  
  // Calculate percentage of resolved issues
  const resolvedPercentage = issueCounts.total > 0
    ? Math.round((issueCounts.resolved / issueCounts.total) * 100)
    : 0;
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-xl">Loading issues...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
        <h1 className="text-2xl font-bold mb-2">Failed to load issues</h1>
        <p className="mb-4 text-muted-foreground">There was an error fetching the issue reports.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Issue Reports</h1>
        <p className="text-muted-foreground mb-4">
          Manage and respond to user-reported issues with business listings
        </p>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-background rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{issueCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </div>
          <div className="bg-background rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{issueCounts.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-background rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold text-blue-500">{issueCounts.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-background rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{issueCounts.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          <div className="bg-background rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{resolvedPercentage}%</div>
            <div className="text-sm text-muted-foreground">Resolution Rate</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by business, issue type, or description..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/4">
            <Select 
              value={filterStatus || ""} 
              onValueChange={(value) => setFilterStatus(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            className="md:w-auto"
            onClick={() => {
              setFilterStatus(null);
              setSearchTerm("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>
      
      {/* Issues Table */}
      {filteredIssues.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableCaption>
              {filteredIssues.length} issue reports found
            </TableCaption>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Issue Type</TableHead>
                <TableHead className="hidden md:table-cell">Reported On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.id}</TableCell>
                  <TableCell>{getBusinessName(issue.businessId)}</TableCell>
                  <TableCell>{issue.issueType}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(issue.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        issue.status === "pending" ? "outline" :
                        issue.status === "in_progress" ? "secondary" :
                        issue.status === "resolved" ? "default" : 
                        "destructive"
                      }
                    >
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        // Future implementation: open a modal to view details and update
                        toast({
                          title: "View Details",
                          description: `Viewing details for issue #${issue.id}`,
                        });
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-lg bg-background">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No issues found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterStatus ? 
              "Try adjusting your filters or search terms to see more results." : 
              "There are currently no reported issues to display."}
          </p>
          {(searchTerm || filterStatus) && (
            <Button 
              variant="outline"
              onClick={() => {
                setFilterStatus(null);
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}