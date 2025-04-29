import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBusinessSchema, categories } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

type BusinessFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Extend the schema with custom validation
const extendedBusinessSchema = insertBusinessSchema.extend({
  name: z.string().min(3, "Business name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  // Manually setting lat/lng for demo - in production would use geocoding
  latitude: z.number().or(z.string().transform(val => parseFloat(val))),
  longitude: z.number().or(z.string().transform(val => parseFloat(val))),
  imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof extendedBusinessSchema>;

// Import geocoding function from client library
import { geocodeAddress } from "@/lib/geocoding-client";

const BusinessForm = ({ isOpen, onClose }: BusinessFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const defaultValues: Partial<FormValues> = {
    name: "",
    category: categories[0],
    description: "",
    address: "",
    phone: "",
    website: "",
    latitude: 37.7749, // Default to San Francisco
    longitude: -122.4194,
    imageUrl: ""
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(extendedBusinessSchema),
    defaultValues,
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/businesses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Business Added",
        description: "Your business has been added successfully!",
      });
      form.reset(defaultValues);
      setStep(1);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add business: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted with data:", data);
    console.log("Current step:", step);
    
    if (step === 1) {
      console.log("Moving to step 2");
      setStep(2);
    } else {
      console.log("Submitting business data");
      // Ensure latitude and longitude are numbers
      const formattedData = {
        ...data,
        latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude,
        longitude: typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude,
      };
      
      // Handle optional fields: remove empty strings instead of setting to null
      const finalData = Object.fromEntries(
        Object.entries(formattedData).filter(([key, value]) => {
          // Keep required fields even if they're empty (although they shouldn't be due to validation)
          if (['name', 'description', 'category', 'address', 'latitude', 'longitude'].includes(key)) {
            return true;
          }
          // Filter out empty optional fields
          return value !== "" && value !== null && value !== undefined;
        })
      );
      
      console.log("Submitting final data:", finalData);
      createBusinessMutation.mutate(finalData as FormValues);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add a New Business</DialogTitle>
          <DialogDescription>
            Fill out the details to add a locally owned business to our platform.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Location Coordinates</h3>
                    <div className="text-xs text-muted-foreground">
                      Automatically determined from address
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md mb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Latitude:</span>{" "}
                        <span className="font-medium">{form.getValues().latitude}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Longitude:</span>{" "}
                        <span className="font-medium">{form.getValues().longitude}</span>
                      </div>
                    </div>
                  </div>
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary hover:text-primary/90 font-medium">
                      Need to adjust coordinates?
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  </details>
                </div>
              </>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={goBack}
              >
                {step === 1 ? "Cancel" : "Back"}
              </Button>
              {step === 1 ? (
                <Button 
                  type="button" 
                  disabled={isGeocoding}
                  onClick={async () => {
                    // Validate only the fields from step 1
                    const currentData = form.getValues();
                    console.log("Current form data:", currentData);
                    
                    // Manually validate required fields
                    const errors = [];
                    if (!currentData.name || currentData.name.length < 3) {
                      errors.push("Business name is required and must be at least 3 characters");
                    }
                    if (!currentData.category) {
                      errors.push("Category is required");
                    }
                    if (!currentData.description || currentData.description.length < 10) {
                      errors.push("Description is required and must be at least 10 characters");
                    }
                    if (!currentData.address || currentData.address.length < 5) {
                      errors.push("Address is required and must be at least 5 characters");
                    }
                    
                    if (errors.length > 0) {
                      console.error("Validation errors:", errors);
                      // Trigger form validation
                      form.trigger(["name", "category", "description", "address"]);
                    } else {
                      // If validation passes, try to geocode the address
                      setIsGeocoding(true);
                      
                      try {
                        const geocodedLocation = await geocodeAddress(currentData.address);
                        
                        if (geocodedLocation) {
                          console.log("Geocoded coordinates:", geocodedLocation);
                          form.setValue("latitude", geocodedLocation.lat);
                          form.setValue("longitude", geocodedLocation.lon);
                          toast({
                            title: "Address Geocoded",
                            description: "Location coordinates have been automatically determined from the address.",
                          });
                        } else {
                          toast({
                            title: "Geocoding Failed",
                            description: "Could not determine coordinates from address. Please enter them manually.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error("Error during geocoding:", error);
                        toast({
                          title: "Geocoding Error",
                          description: "An error occurred while determining coordinates. Please enter them manually.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsGeocoding(false);
                        // Proceed to next step regardless of geocoding result
                        console.log("Moving to step 2 (button click)");
                        setStep(2);
                      }
                    }
                  }}
                >
                  {isGeocoding ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Location...
                    </span>
                  ) : (
                    "Next"
                  )}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  disabled={createBusinessMutation.isPending}
                  onClick={() => {
                    // Get form data
                    const data = form.getValues();
                    console.log("Submitting business data:", data);
                    
                    // Ensure latitude and longitude are numbers
                    const formattedData = {
                      ...data,
                      latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude,
                      longitude: typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude,
                    };
                    
                    // Validate location fields
                    const errors = [];
                    if (isNaN(formattedData.latitude)) {
                      errors.push("Latitude must be a valid number");
                    }
                    if (isNaN(formattedData.longitude)) {
                      errors.push("Longitude must be a valid number");
                    }
                    
                    if (errors.length > 0) {
                      console.error("Validation errors:", errors);
                      form.trigger(["latitude", "longitude"]);
                      return;
                    }
                    
                    // Handle optional fields: remove empty strings instead of setting to null
                    const finalData = Object.fromEntries(
                      Object.entries(formattedData).filter(([key, value]) => {
                        // Keep required fields even if they're empty (although they shouldn't be due to validation)
                        if (['name', 'description', 'category', 'address', 'latitude', 'longitude'].includes(key)) {
                          return true;
                        }
                        // Filter out empty optional fields
                        return value !== "" && value !== null && value !== undefined;
                      })
                    );
                    
                    console.log("Submitting final data:", finalData);
                    createBusinessMutation.mutate(finalData as FormValues);
                  }}
                >
                  {createBusinessMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Saving...
                    </span>
                  ) : "Add Business"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessForm;
