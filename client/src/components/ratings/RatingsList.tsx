import { useQuery } from "@tanstack/react-query";
import { Rating } from "@shared/schema";
import { format } from "date-fns";
import { Loader2, MessagesSquare } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { Separator } from "@/components/ui/separator";

interface RatingsListProps {
  businessId: number;
  className?: string;
}

export function RatingsList({ businessId, className = "" }: RatingsListProps) {
  // Fetch ratings for this business
  const {
    data: ratings = [],
    isLoading,
    isError,
  } = useQuery<Rating[]>({
    queryKey: [`/api/businesses/${businessId}/ratings`],
  });

  // Fetch average rating
  const { data: averageData } = useQuery<{ averageRating: number }>({
    queryKey: [`/api/businesses/${businessId}/average-rating`],
  });

  const averageRating = averageData?.averageRating || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Failed to load ratings. Please try again later.
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <MessagesSquare className="mx-auto h-10 w-10 mb-2 opacity-20" />
        <p>No ratings yet. Be the first to rate this business!</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Average rating summary */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <StarRating rating={averageRating} size="md" />
          <div className="text-sm text-muted-foreground mt-1">
            Based on {ratings.length} {ratings.length === 1 ? "review" : "reviews"}
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* List of ratings */}
      <div className="space-y-6">
        {ratings.map((rating) => (
          <div key={rating.id} className="space-y-2">
            {/* User and date */}
            <div className="flex justify-between items-center">
              <div className="font-medium">User #{rating.userId}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(rating.createdAt), "MMM d, yyyy")}
              </div>
            </div>
            
            {/* Stars */}
            <StarRating rating={rating.rating} size="sm" />
            
            {/* Comment */}
            {rating.comment && (
              <p className="text-sm mt-2">{rating.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}