import { Business } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Phone, 
  Globe, 
  Star, 
  Navigation, 
  Share2, 
  Heart, 
  Edit, 
  Trash2,
  X 
} from "lucide-react";

type BusinessDetailsProps = {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
};

const BusinessDetails = ({ business, isOpen, onClose }: BusinessDetailsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const defaultImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/businesses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Business Deleted",
        description: "The business has been successfully deleted.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete business: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (!business) return null;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this business?")) {
      deleteMutation.mutate(business.id);
    }
  };
  
  const isOwnerOrAdmin = user && (user.isAdmin || user.id === business.createdBy);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 overflow-y-auto">
        <div className="relative">
          <img 
            src={business.imageUrl || defaultImage} 
            alt={business.name} 
            className="w-full h-64 object-cover"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-md text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-4">
            <Badge className={`
              ${business.category === 'Restaurant' && 'bg-green-600'}
              ${business.category === 'Retail' && 'bg-amber-600'}
              ${business.category === 'Coffee Shop' && 'bg-blue-600'}
              ${business.category === 'Bookstore' && 'bg-purple-600'}
              text-white font-medium
            `}>
              {business.category}
            </Badge>
          </div>
        </div>
        
        <div className="px-6 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-neutral-900">{business.name}</h2>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <Star className="h-4 w-4 text-amber-400" />
              <span className="ml-1 text-sm text-neutral-600">4.5 (42)</span>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center text-sm text-neutral-600">
            <span className="flex items-center mr-4 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {business.address}
            </span>
            {business.phone && (
              <span className="flex items-center mr-4 mb-2">
                <Phone className="h-4 w-4 mr-1" />
                {business.phone}
              </span>
            )}
            {business.website && (
              <span className="flex items-center mb-2">
                <Globe className="h-4 w-4 mr-1" />
                <a 
                  href={business.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:text-blue-700"
                >
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </span>
            )}
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium text-neutral-900">About</h3>
            <p className="mt-2 text-sm text-neutral-600">
              {business.description}
            </p>
          </div>
          
          {/* Admin/Owner actions */}
          {isOwnerOrAdmin && (
            <div className="mt-6 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-neutral-700 border-neutral-300"
                onClick={() => toast({
                  title: "Edit feature",
                  description: "This feature is coming soon!"
                })}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    Deleting...
                  </span>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-auto border-t border-neutral-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
            <Button className="justify-center items-center">
              <Navigation className="mr-2 h-4 w-4" />
              Get Directions
            </Button>
            <div className="flex space-x-3">
              <Button variant="outline" className="items-center">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" className="items-center">
                <Heart className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BusinessDetails;
