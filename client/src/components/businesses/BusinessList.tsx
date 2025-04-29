import { Business } from "@shared/schema";
import BusinessCard from "./BusinessCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type BusinessListProps = {
  businesses: Business[];
  isLoading: boolean;
  onSelectBusiness: (business: Business) => void;
};

const BusinessList = ({ businesses, isLoading, onSelectBusiness }: BusinessListProps) => {
  const [displayLimit, setDisplayLimit] = useState(5);
  
  const loadMore = () => {
    setDisplayLimit(prev => prev + 5);
  };

  // These functions prevent events from propagating to parent elements
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Stop propagation of scroll events
    e.stopPropagation();
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Don't stop propagation here, as it would prevent normal touch behavior
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // This prevents the map from panning when scrolling the list on touchscreens
    e.stopPropagation();
  };

  return (
    <div 
      className="w-full h-full bg-white overflow-y-auto border-t lg:border-t-0 lg:border-l border-neutral-200 overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-neutral-800">
          {businesses.length} Local Businesses
        </h2>
        <p className="text-sm text-neutral-500">in current map area</p>
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading businesses...</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-neutral-600">No businesses found in this area.</p>
          <p className="text-sm text-neutral-500 mt-2">Try zooming out or searching in a different location.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-neutral-200">
            {businesses.slice(0, displayLimit).map((business) => (
              <BusinessCard 
                key={business.id} 
                business={business} 
                onClick={() => onSelectBusiness(business)}
              />
            ))}
          </div>
          
          {displayLimit < businesses.length && (
            <div className="p-4 text-center">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                className="border border-neutral-300 text-neutral-700"
              >
                Load more businesses
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BusinessList;
