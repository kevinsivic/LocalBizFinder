import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  totalStars?: number;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating = 0,
  totalStars = 5,
  editable = false,
  size = "md",
  onChange,
  className,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  const handleStarClick = (index: number) => {
    if (!editable) return;
    
    const newRating = index + 1;
    setSelectedRating(newRating);
    onChange?.(newRating);
  };

  const handleStarHover = (index: number) => {
    if (!editable) return;
    setHoveredRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (!editable) return;
    setHoveredRating(0);
  };

  // Determine star size based on prop
  const starSize = 
    size === "sm" ? "w-4 h-4" : 
    size === "lg" ? "w-7 h-7" : 
    "w-5 h-5";

  const displayRating = hoveredRating || selectedRating || rating;

  return (
    <div 
      className={cn("flex items-center gap-1", className)} 
      onMouseLeave={handleMouseLeave}
    >
      {[...Array(totalStars)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            starSize,
            "cursor-default transition-all",
            editable && "cursor-pointer",
            index < displayRating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300",
          )}
          onClick={() => handleStarClick(index)}
          onMouseEnter={() => handleStarHover(index)}
        />
      ))}
    </div>
  );
}

export function RatingDisplay({ 
  rating = 0, 
  showEmpty = true,
  className
}: { 
  rating: number, 
  showEmpty?: boolean,
  className?: string
}) {
  if (rating === 0 && !showEmpty) {
    return null;
  }

  return (
    <div className={cn("flex items-center", className)}>
      <StarRating rating={rating} size="sm" />
      <span className="text-sm ml-1 text-muted-foreground">
        {rating > 0 ? rating.toFixed(1) : "No ratings"}
      </span>
    </div>
  );
}