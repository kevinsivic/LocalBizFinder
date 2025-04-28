import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MapPin, Menu, LogIn, LogOut, User, ShieldCheck } from "lucide-react";

const Header = () => {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center">
                  <MapPin className="text-primary h-6 w-6 mr-2" />
                  <span className="text-xl font-semibold text-neutral-800">LocalSpot</span>
                </div>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <div className={`${
                  location === "/" ? "border-primary text-neutral-800" : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                } border-b-2 px-1 pt-1 inline-flex items-center text-sm font-medium`}>
                  Discover
                </div>
              </Link>
              <a href="#about" className="border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 border-b-2 px-1 pt-1 inline-flex items-center text-sm font-medium">
                About
              </a>
              <a href="#contact" className="border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 border-b-2 px-1 pt-1 inline-flex items-center text-sm font-medium">
                Contact
              </a>
            </nav>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  className="border-neutral-300 text-neutral-700"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </Button>
                <Button 
                  className="bg-primary text-white"
                  onClick={() => navigate("/register")}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-sm">
                <nav className="flex flex-col space-y-4 mt-6">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <div className={`${
                      location === "/" ? "bg-neutral-50 border-primary text-primary" : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700"
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
                      Discover
                    </div>
                  </Link>
                  <a href="#about" className="border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                    About
                  </a>
                  <a href="#contact" className="border-transparent text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                    Contact
                  </a>
                </nav>
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center px-4">
                        <div className="flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-white">
                              {getInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-neutral-800">{user.username}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <a href="#" className="block px-4 py-2 text-base font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100">
                          Profile
                        </a>
                        {user.isAdmin && (
                          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                            <div className="block px-4 py-2 text-base font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100">
                              Admin Panel
                            </div>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-base font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          navigate("/login");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Log in
                      </Button>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          navigate("/register");
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign up
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
