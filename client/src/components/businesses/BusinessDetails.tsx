import { useState } from "react";
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
import {
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  
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

  // Function to handle the "Get Directions" button click
  const handleGetDirections = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
    toast({
      title: "Opening Directions",
      description: "Opening Google Maps with directions to " + business.name,
    });
  };

  // Function to handle the "Share" button click
  const handleShare = () => {
    // Create a shareable URL (you might want to create a dedicated page for businesses)
    const shareableUrl = `${window.location.origin}?business=${business.id}`;
    setShareUrl(shareableUrl);
    setIsShareDialogOpen(true);
  };

  // Function to copy share URL to clipboard
  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "URL Copied",
        description: "Link has been copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Function to handle the "Edit" button click
  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  // Function to handle the delete button click
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this business?")) {
      deleteMutation.mutate(business.id);
    }
  };
  
  const isOwnerOrAdmin = user && (user.isAdmin || user.id === business.createdBy);

  return (
    <>
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
                  onClick={handleEdit}
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
              <Button className="justify-center items-center" onClick={handleGetDirections}>
                <Navigation className="mr-2 h-4 w-4" />
                Get Directions
              </Button>
              <div className="flex space-x-3">
                <Button variant="outline" className="items-center" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="items-center" onClick={() => {
                  toast({
                    title: "Saved",
                    description: `${business.name} saved to your favorites.`,
                  });
                }}>
                  <Heart className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {business.name}</DialogTitle>
            <DialogDescription>
              Anyone with this link will be able to view this business
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="shareLink" className="sr-only">
                Share link
              </Label>
              <Input
                id="shareLink"
                defaultValue={shareUrl}
                readOnly
                className="h-10"
              />
            </div>
            <Button type="submit" size="sm" className="px-3" onClick={copyShareUrl}>
              <span>Copy</span>
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Business Information</DialogTitle>
            <DialogDescription>
              Update the details for {business.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input 
                id="edit-name" 
                defaultValue={business.name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input 
                id="edit-description" 
                defaultValue={business.description}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input 
                id="edit-address" 
                defaultValue={business.address}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({
                title: "Business Updated",
                description: "This feature will be fully implemented soon!",
              });
              setIsEditDialogOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BusinessDetails;
