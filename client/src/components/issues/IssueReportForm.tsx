import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Business } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Create form schema
const formSchema = z.object({
  issueType: z.string().min(1, "Please select an issue type"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

type IssueReportFormProps = {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
};

export default function IssueReportForm({ business, isOpen, onClose }: IssueReportFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get issue types
  const { data: issueTypes = [], isLoading: isLoadingTypes } = useQuery<string[]>({
    queryKey: ["/api/issue-types"],
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueType: "",
      description: "",
    },
  });
  
  const reportIssueMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", `/api/businesses/${business.id}/issues`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue reported",
        description: "Thank you for helping improve the quality of our listings.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${business.id}/issues`] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to report issue",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You must be logged in to report issues",
        variant: "destructive",
      });
      return;
    }
    
    reportIssueMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Report an issue with <span className="font-medium">{business.name}</span>. Your feedback helps us maintain accurate listings.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingTypes || reportIssueMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the type of issue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {issueTypes?.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the category that best describes the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide details about the issue"
                      className="min-h-[100px]"
                      disabled={reportIssueMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include any relevant details that can help verify this issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={reportIssueMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={reportIssueMutation.isPending}
              >
                {reportIssueMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}