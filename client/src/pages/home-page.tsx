import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Business, categories } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import Map from "@/components/ui/Map";
import BusinessList from "@/components/businesses/BusinessList";
import BusinessDetails from "@/components/businesses/BusinessDetails";
import BusinessForm from "@/components/businesses/BusinessForm";
import AdminPanel from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, List, Plus } from "lucide-react";

const HomePage = () => {
  const { user } = useAuth();
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  
  // Get all businesses from the API
  const { data: businesses = [], isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses", mapBounds],
    queryFn: async ({ queryKey }) => {
      const [_, bounds] = queryKey;
      let url = "/api/businesses";
      if (bounds) {
        url += `?bounds=${bounds.join(",")}`;
      }
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch businesses");
      }
      return response.json();
    },
  });

  // Filter businesses based on search query and category
  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleMapBoundsChange = (bounds: [number, number, number, number]) => {
    setMapBounds(bounds);
  };

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedBusiness(null);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-grow flex flex-col lg:flex-row">
        <div className="flex-grow flex flex-col h-[calc(100vh-4rem)]">
          {/* Search and Filter Bar */}
          <div className="bg-white border-b border-neutral-200 p-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="relative rounded-md shadow-sm flex-grow max-w-2xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <Input
                    type="text"
                    className="pl-10 pr-12 py-2"
                    placeholder="Search for local businesses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <Select 
                      defaultValue="Current Location"
                      onValueChange={(value) => console.log(value)}
                    >
                      <SelectTrigger className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-neutral-500 sm:text-sm rounded-md w-[150px]">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Current Location">Current Location</SelectItem>
                        <SelectItem value="Downtown">Downtown</SelectItem>
                        <SelectItem value="Near Me">Near Me</SelectItem>
                        <SelectItem value="Custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  
                  {/* View Toggle */}
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <Button 
                      variant={viewMode === "map" ? "default" : "outline"} 
                      className={`rounded-l-md rounded-r-none ${viewMode === "map" ? "text-white" : "text-neutral-700"}`}
                      onClick={() => setViewMode("map")}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Map
                    </Button>
                    <Button 
                      variant={viewMode === "list" ? "default" : "outline"} 
                      className={`rounded-r-md rounded-l-none ${viewMode === "list" ? "text-white" : "text-neutral-700"}`}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="mr-2 h-4 w-4" />
                      List
                    </Button>
                  </div>
                </div>
              </div>

              {/* Category filter chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge 
                  variant={selectedCategory === "All" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory("All")}
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge 
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Split View Container */}
          <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
            {/* Map View */}
            <div 
              className={`${
                viewMode === "map" || (viewMode === "list" && window.innerWidth >= 1024)
                  ? "w-full lg:w-3/5 h-[400px] lg:h-full"
                  : "hidden"
              }`}
            >
              <Map 
                businesses={filteredBusinesses}
                onBoundsChange={handleMapBoundsChange}
                onBusinessSelect={handleBusinessSelect}
              />
              
              {user && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                  <Button
                    onClick={() => setIsAddBusinessOpen(true)}
                    className="items-center shadow-md"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Business
                  </Button>
                </div>
              )}
            </div>
            
            {/* Business Listings */}
            <div 
              className={`${
                viewMode === "list" || (viewMode === "map" && window.innerWidth >= 1024)
                  ? "w-full lg:w-2/5"
                  : "hidden"
              }`}
            >
              <BusinessList 
                businesses={filteredBusinesses}
                isLoading={isLoading}
                onSelectBusiness={handleBusinessSelect}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Business Details Sheet */}
      <BusinessDetails 
        business={selectedBusiness} 
        isOpen={isDetailsOpen} 
        onClose={handleCloseDetails} 
      />

      {/* Add Business Modal */}
      <BusinessForm 
        isOpen={isAddBusinessOpen} 
        onClose={() => setIsAddBusinessOpen(false)} 
      />

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
      />
    </div>
  );
};

export default HomePage;
