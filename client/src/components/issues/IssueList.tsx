import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Business, IssueReport } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";

// Helper function to get status badge color
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "outline";
    case "in_progress":
      return "secondary";
    case "resolved":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

type IssueUpdateDialogProps = {
  issue: IssueReport;
  isOpen: boolean;
  onClose: () => void;
};

function IssueUpdateDialog({ issue, isOpen, onClose }: IssueUpdateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>(issue.status);
  const [adminNotes, setAdminNotes] = useState<string>(issue.adminNotes || "");
  
  const updateIssueMutation = useMutation({
    mutationFn: async (data: { status: string; adminNotes: string }) => {
      const res = await apiRequest("PATCH", `/api/issues/${issue.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue updated",
        description: `The issue has been marked as ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${issue.businessId}/issues`] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update issue",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateIssueMutation.mutate({ status, adminNotes });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Issue Status</DialogTitle>
          <DialogDescription>
            Review and update the status of this issue
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Issue Type</h4>
              <p>{issue.issueType}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{issue.description}</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="adminNotes" className="text-sm font-medium">
                Admin Notes
              </label>
              <Textarea
                id="adminNotes"
                placeholder="Add notes about this issue"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                These notes are only visible to admins
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={updateIssueMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateIssueMutation.isPending}
            >
              {updateIssueMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Issue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type IssueListProps = {
  businessId?: number;
  className?: string;
};

export default function IssueList({ businessId, className = "" }: IssueListProps) {
  const { user } = useAuth();
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  
  // Query to fetch issues
  const { data: issues = [], isLoading } = useQuery<IssueReport[]>({
    queryKey: businessId 
      ? [`/api/businesses/${businessId}/issues`] 
      : ["/api/issues"],
    enabled: !!user && (!!businessId || user.isAdmin),
  });
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (issues.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No issue reports</h3>
        <p className="text-sm text-muted-foreground">
          {businessId 
            ? "No issues have been reported for this business." 
            : "No issues have been reported."}
        </p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium">Issue Reports</h3>
      
      {issues.map((issue: IssueReport) => (
        <Card key={issue.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">{issue.issueType}</CardTitle>
                <CardDescription>
                  Reported on {format(new Date(issue.createdAt), "MMM d, yyyy")}
                </CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(issue.status)}>
                {issue.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm">{issue.description}</p>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between">
            <p className="text-xs text-muted-foreground">
              {issue.status === "resolved" && issue.resolvedBy
                ? `Resolved by Admin #${issue.resolvedBy}`
                : ""}
            </p>
            {user?.isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIssue(issue)}
              >
                Update Status
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
      
      {selectedIssue && (
        <IssueUpdateDialog
          issue={selectedIssue}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}