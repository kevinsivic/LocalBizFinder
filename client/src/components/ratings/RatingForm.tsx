import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RatingFormProps {
  businessId: number;
  businessName: string;
  onRatingSubmitted?: () => void;
}

export function RatingForm({ businessId, businessName, onRatingSubmitted }: RatingFormProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Define type for the rating data
  interface UserRating {
    id: number;
    rating: number;
    comment: string | null;
    userId: number;
    businessId: number;
    createdAt: string;
  }

  // Fetch the user's existing rating if any
  const {
    data: existingRating,
    isLoading,
  } = useQuery<UserRating>({
    queryKey: [`/api/businesses/${businessId}/my-rating`],
    enabled: !!user,
  });

  // Set initial state based on existing rating
  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || "");
    }
  }, [existingRating]);

  // Submit rating mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/businesses/${businessId}/ratings`, {
        rating,
        comment: comment.trim() || null,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: `Your rating for ${businessName} has been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/my-rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/average-rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/ratings`] });
      onRatingSubmitted?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit rating: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete rating mutation
  const deleteMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!existingRating) return;
      await apiRequest("DELETE", `/api/businesses/${businessId}/ratings/${existingRating.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Rating deleted",
        description: `Your rating for ${businessName} has been removed.`,
      });
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/my-rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/average-rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/ratings`] });
      onRatingSubmitted?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete rating: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  // Handle deletion
  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  if (!user) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted/20">
        <p className="text-sm text-muted-foreground">Please log in to rate this business</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 bg-card">
      <h3 className="text-lg font-semibold mb-3">
        {existingRating ? "Your Rating" : "Rate This Business"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Rating</label>
          <StarRating
            rating={rating}
            editable
            onChange={setRating}
            size="lg"
            className="py-1"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium">
            Comment (optional)
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="min-h-[80px]"
          />
        </div>
        
        <div className="flex justify-between">
          {existingRating && (
            <div>
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
                onClick={() => setShowDeleteDialog(true)}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Rating"
                )}
              </Button>
              
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Rating</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete your rating for {businessName}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={submitMutation.isPending || rating === 0}
            className="ml-auto"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : existingRating ? (
              "Update Rating"
            ) : (
              "Submit Rating"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}