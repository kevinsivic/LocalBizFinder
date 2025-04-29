import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Business } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@shared/schema";
import { 
  Edit, 
  Trash2, 
  Search, 
  PlusCircle, 
  ArrowLeft, 
  ArrowRight,
  ChevronLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const AdminPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: businesses = [], isLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
    enabled: !!user?.isAdmin,
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
    const matchesCategory = selectedCategory === "all" || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginatedBusinesses = filteredBusinesses.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const totalPages = Math.ceil(filteredBusinesses.length / perPage);

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Admin Access Required</h1>
          <p className="text-neutral-600 mb-6">You don't have permission to access this page.</p>
          <Link href="/">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
            <Link href="/">
              <Button variant="outline" className="items-center">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-medium text-neutral-900">Manage Businesses</h2>
                <div className="flex flex-col sm:flex-row gap-3">
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
                  <Button 
                    onClick={() => toast({
                      title: "Add business feature",
                      description: "This feature is available from the home page map view."
                    })}
                    className="items-center"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Business
                  </Button>
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
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBusinesses.map((business) => (
                        <TableRow key={business.id}>
                          <TableCell className="font-medium">{business.id}</TableCell>
                          <TableCell>{business.name}</TableCell>
                          <TableCell>
                            <Badge className={`
                              ${business.category === 'Restaurant' && 'bg-green-100 text-green-800'}
                              ${business.category === 'Retail' && 'bg-amber-100 text-amber-800'}
                              ${business.category === 'Coffee Shop' && 'bg-blue-100 text-blue-800'}
                              ${business.category === 'Bookstore' && 'bg-purple-100 text-purple-800'}
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            `}>
                              {business.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{business.address}</TableCell>
                          <TableCell>{business.createdBy}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-neutral-700 border-neutral-300"
                                onClick={() => toast({
                                  title: "Edit feature",
                                  description: "This feature is coming soon!"
                                })}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(business.id)}
                                disabled={deleteMutation.isPending && deleteMutation.variables === business.id}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="px-6 py-4 border-t border-neutral-200">
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
