import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AboutPage from "@/pages/about-page";
import LoginPage from "@/pages/login-page";
import RegisterPage from "@/pages/register-page";
import AdminPage from "@/pages/admin-page";
import { AdminRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* Public route for the homepage - no authentication required */}
      <Route path="/" component={HomePage} />
      
      {/* About page */}
      <Route path="/about" component={AboutPage} />
      
      {/* Authentication routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Protected admin route */}
      <AdminRoute path="/admin" component={AdminPage} />
      
      {/* 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
