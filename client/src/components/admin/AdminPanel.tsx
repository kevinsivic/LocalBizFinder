import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Business } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@shared/schema";
import { Edit, Trash2, Search, ArrowLeft, ArrowRight } from "lucide-react";

type AdminPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const { data: businesses = [], isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
    enabled: isOpen && !!user?.isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/businesses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Business deleted",
        description: "The business has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete business: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this business?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginatedBusinesses = filteredBusinesses.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const totalPages = Math.ceil(filteredBusinesses.length / perPage);

  if (!user?.isAdmin) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="px-4 sm:px-6 py-6 bg-primary">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-medium text-white">Admin Panel</SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:text-white hover:bg-primary/80 focus:ring-white"
            >
              <ArrowRight className="h-5 w-5" />
              <span className="sr-only">Close panel</span>
            </Button>
          </div>
        </SheetHeader>
        
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <h3 className="text-lg font-medium text-neutral-900">Manage Businesses</h3>
            <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <Input
                  type="text"
                  className="pl-10"
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No businesses found matching your criteria.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-y-auto flex-grow">
            {paginatedBusinesses.map((business) => (
              <li key={business.id} className="px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex">
                    <div className="flex-shrink-0 h-16 w-16 bg-neutral-200 rounded-md overflow-hidden">
                      <img 
                        src={business.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"} 
                        alt={business.name} 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-neutral-900">{business.name}</h4>
                      <p className="text-sm text-neutral-500">{business.category} • ID: {business.id}</p>
                      <p className="text-sm text-neutral-500">{business.address}</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex sm:ml-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-neutral-700 border-neutral-300"
                      onClick={() => toast({
                        title: "Edit feature",
                        description: "This feature is coming soon!"
                      })}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(business.id)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === business.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {filteredBusinesses.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-700">
                  Showing <span className="font-medium">{(page - 1) * perPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(page * perPage, filteredBusinesses.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredBusinesses.length}</span> results
                </p>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  // Show first page, last page, current page, and pages around current
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => setPage(pageNum)}
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AdminPanel;
