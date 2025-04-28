import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [location, navigate] = useLocation();
  const { user, loginMutation } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left column - Login form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center mb-6">
                <MapPin className="text-primary h-8 w-8 mr-2" />
                <span className="text-2xl font-bold text-neutral-800">LocalSpot</span>
              </div>
              <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Login to your account to continue
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            onChange={e => field.onChange(e.target.value)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            onChange={e => field.onChange(e.target.value)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me
                      </label>
                    </div>
                    
                    <a href="#" className="text-sm font-medium text-primary hover:text-blue-700">
                      Forgot password?
                    </a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                        Logging in...
                      </span>
                    ) : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <Link href="/register">
                <Button variant="link">Don't have an account? Sign up</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - Hero section */}
        <div className="hidden md:flex flex-1 bg-primary items-center justify-center p-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 opacity-90" />
          <div className="max-w-xl relative z-10 text-white text-center">
            <h1 className="text-3xl font-bold mb-4">Discover Local Businesses in Your Community</h1>
            <p className="text-xl mb-8">
              LocalSpot helps you find and support locally owned retailers and restaurants.
            </p>
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Interactive Maps</h3>
                  <p className="text-sm text-blue-100">Explore businesses on our easy-to-use map</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Verified Businesses</h3>
                  <p className="text-sm text-blue-100">All listings are locally owned and operated</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Detailed Information</h3>
                  <p className="text-sm text-blue-100">View hours, menus, services and more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;