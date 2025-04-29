import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { IssueReport, Business } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";
import { format } from "date-fns";

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
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, User, Calendar, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Helper function to get status badge variant
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

type IssueDetailsDialogProps = {
  issue: IssueReport;
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
};

export default function IssueDetailsDialog({ 
  issue, 
  isOpen, 
  onClose, 
  businessName = `Business #${issue.businessId}` 
}: IssueDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>(issue.status);
  const [adminNotes, setAdminNotes] = useState<string>(issue.adminNotes || "");
  
  const updateIssueMutation = useMutation({
    mutationFn: async (data: { status: string; adminNotes: string }) => {
      const res = await apiRequest("PATCH", `/api/issues/${issue.id}`, data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      // Track issue resolution event
      trackEvent(AnalyticsEvent.ISSUE_RESOLVE, {
        issueId: issue.id.toString(),
        businessId: issue.businessId.toString(),
        businessName: businessName,
        issueType: issue.issueType,
        newStatus: variables.status,
        hasAdminNotes: variables.adminNotes ? 'true' : 'false'
      });
      
      toast({
        title: "Issue updated",
        description: `The issue has been marked as ${status}`,
      });
      
      // Invalidate queries to update data
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

  // Handler for form submission
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Details</DialogTitle>
          <DialogDescription>
            View and manage issue #{issue.id}
          </DialogDescription>
        </DialogHeader>

        {/* Issue information section */}
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{issue.issueType}</h3>
            <Badge variant={getStatusBadgeVariant(issue.status)}>
              {issue.status}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <ExternalLink size={16} />
              <span className="font-medium">Business:</span>
              <span>{businessName}</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <User size={16} />
              <span className="font-medium">Reported by:</span>
              <span>User #{issue.reportedBy}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Calendar size={16} />
              <span className="font-medium">Reported on:</span>
              <span>{format(new Date(issue.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>
            </div>

            {issue.resolvedBy && (
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <User size={16} />
                <span className="font-medium">Resolved by:</span>
                <span>Admin #{issue.resolvedBy}</span>
              </div>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <MessageSquare size={18} className="mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm whitespace-pre-line">{issue.description}</p>
              </div>
            </div>
          </div>

          {issue.adminNotes && (
            <div className="border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3 rounded-md">
              <div className="flex items-start gap-2">
                <MessageSquare size={18} className="mt-0.5 text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-400">Admin Notes</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-line">{issue.adminNotes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Update status section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Update Status
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
            <p className="text-xs text-muted-foreground">
              These notes are only visible to admins
            </p>
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