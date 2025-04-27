import { Business } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Globe, Star } from "lucide-react";

type BusinessCardProps = {
  business: Business;
  onClick?: () => void;
};

const BusinessCard = ({ business, onClick }: BusinessCardProps) => {
  const defaultImageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80";
  
  // Calculate distance (would need user's location in a real app)
  const distance = "0.7";

  return (
    <Card 
      className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex">
          <div className="flex-shrink-0 h-24 w-24 bg-neutral-200 rounded-md overflow-hidden">
            <img 
              src={business.imageUrl || defaultImageUrl} 
              alt={business.name} 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-neutral-900">{business.name}</h3>
              <Badge variant="secondary" className={`
                ${business.category === 'Restaurant' && 'bg-green-100 text-green-800'}
                ${business.category === 'Retail' && 'bg-amber-100 text-amber-800'}
                ${business.category === 'Coffee Shop' && 'bg-blue-100 text-blue-800'}
                ${business.category === 'Bookstore' && 'bg-purple-100 text-purple-800'}
              `}>
                {business.category}
              </Badge>
            </div>
            <div className="mt-1 flex items-center text-sm text-neutral-500">
              <Star className="h-4 w-4 text-amber-400" />
              <Star className="h-4 w-4 text-amber-400" />
              <Star className="h-4 w-4 text-amber-400" />
              <Star className="h-4 w-4 text-amber-400" />
              <Star className="h-4 w-4 text-amber-400" />
              <span className="ml-1">4.5 (42 reviews)</span>
            </div>
            <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
              {business.description}
            </p>
            <div className="mt-2 flex items-center text-xs text-neutral-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{distance} miles away • {business.address}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BusinessCard;
