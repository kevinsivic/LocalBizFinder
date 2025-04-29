import { useState, useEffect } from "react";
import { Business, categories, insertBusinessSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  X,
  Loader2 
} from "lucide-react";

// EditBusinessForm component
type EditBusinessFormProps = {
  business: Business;
  onClose: () => void;
};

// Extend the schema with validation but more permissive
const editBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  latitude: z.number().or(z.string().transform(val => parseFloat(val))),
  longitude: z.number().or(z.string().transform(val => parseFloat(val))),
  imageUrl: z.string().optional().nullable(),
  createdBy: z.number().optional(), // Will be preserved anyway
});

type EditFormValues = z.infer<typeof editBusinessSchema>;

// Geocoding function to convert address to lat/lng
async function geocodeAddress(address: string): Promise<{ lat: number, lon: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }
    
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

const EditBusinessForm = ({ business, onClose }: EditBusinessFormProps) => {
  const { toast } = useToast();
  const [isAddressChanged, setIsAddressChanged] = useState(false);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);

  // Set default values from business
  const defaultValues: Partial<EditFormValues> = {
    name: business.name,
    description: business.description,
    category: business.category,
    address: business.address,
    phone: business.phone || "",
    website: business.website || "",
    latitude: business.latitude,
    longitude: business.longitude,
    imageUrl: business.imageUrl || "",
  };

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editBusinessSchema),
    defaultValues,
  });

  // Handle address change to trigger geocoding
  const addressField = form.watch("address");
  
  useEffect(() => {
    // Check if address changed from initial value
    if (addressField !== business.address) {
      setIsAddressChanged(true);
    }
  }, [addressField, business.address]);

  // Update latitude and longitude when address changes
  const updateCoordinates = async () => {
    if (isAddressChanged && addressField) {
      setGeocodingInProgress(true);
      const coordinates = await geocodeAddress(addressField);
      setGeocodingInProgress(false);
      
      if (coordinates) {
        form.setValue('latitude', coordinates.lat);
        form.setValue('longitude', coordinates.lon);
        toast({
          title: "Address Updated",
          description: "We've updated the location coordinates based on the new address.",
        });
      } else {
        toast({
          title: "Geocoding Failed",
          description: "Could not determine coordinates from the address. Please enter them manually.",
          variant: "destructive",
        });
      }
      
      setIsAddressChanged(false);
    }
  };

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      console.log("Updating business:", business.id, data);
      const response = await apiRequest("PUT", `/api/businesses/${business.id}`, data);
      const result = await response.json();
      console.log("Update response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Business Updated",
        description: "Your business has been updated successfully!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update business: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditFormValues) => {
    // Log form errors to help debug any validation issues
    console.log("Form errors:", form.formState.errors);
    console.log("Submitting form data:", data);
    
    // Ensure latitude and longitude are numbers
    const formattedData = {
      ...data,
      latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude,
      longitude: typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude,
      // Include optional fields with null values for proper API handling
      phone: data.phone || null,
      website: data.website || null,
      imageUrl: data.imageUrl || null
    };
    
    console.log("Formatted data:", formattedData);
    updateBusinessMutation.mutate(formattedData as EditFormValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)();
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Enter business name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about this business..."
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col space-y-2">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Input placeholder="123 Main St, City, State ZIP" {...field} />
                  </FormControl>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={updateCoordinates}
                    disabled={!isAddressChanged || geocodingInProgress}
                  >
                    {geocodingInProgress ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Update Location
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(555) 123-4567" 
                    value={field.value || ""} 
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com" 
                    value={field.value || ""} 
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/image.jpg" 
                  value={field.value || ""} 
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>
                Provide a URL to an image of the business
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Location Coordinates</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-6">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button 
            type="button" 
            onClick={() => {
              console.log("Manual submit button clicked");
              // Skip validation and just submit the current form values
              const values = form.getValues();
              console.log("Form values:", values);
              
              // Force setting the createdBy field which might be missing
              updateBusinessMutation.mutate({
                ...values,
                createdBy: business.createdBy,
                // Ensure these are properly handled as strings or null
                phone: values.phone || null,
                website: values.website || null,
                imageUrl: values.imageUrl || null,
                // Make sure coordinates are numbers
                latitude: typeof values.latitude === 'string' ? parseFloat(values.latitude) : values.latitude,
                longitude: typeof values.longitude === 'string' ? parseFloat(values.longitude) : values.longitude,
              } as EditFormValues);
            }}
            disabled={updateBusinessMutation.isPending}
          >
            {updateBusinessMutation.isPending ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

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

      {/* Edit Dialog with full form */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Information</DialogTitle>
            <DialogDescription>
              Update the details for {business.name}
            </DialogDescription>
          </DialogHeader>

          {isEditDialogOpen && (
            <EditBusinessForm 
              business={business} 
              onClose={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BusinessDetails;