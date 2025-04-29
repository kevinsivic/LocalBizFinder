import { ArrowLeft, Store, Coffee, Book, MapPin, Heart, ShoppingBag, MessageSquare, LocateFixed, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/layout/Header";

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-background pt-10 pb-16 md:pt-16 md:pb-24">
          <div className="container px-4 md:px-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-block p-2 bg-primary/10 rounded-full mb-2">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                About LocalSpot
              </h1>
              <p className="text-lg text-muted-foreground max-w-[700px] mx-auto">
                Discover and support the local businesses that make our community unique.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mission Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Our Mission</h2>
                <p className="text-lg text-muted-foreground">
                  LocalSpot was created to improve visibility and accessibility of locally owned businesses 
                  and help people figure out where to buy things locally rather than from Amazon or big box stores.
                </p>
                <p className="text-muted-foreground">
                  In a world dominated by online marketplaces and chain retailers, it's becoming harder to discover 
                  the unique local businesses in our communities. We believe that supporting local businesses creates 
                  stronger communities, more diverse economies, and a more sustainable future.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary-50 p-6 rounded-lg flex flex-col items-center text-center">
                  <Coffee className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-medium">Local Cafés</h3>
                </div>
                <div className="bg-primary-50 p-6 rounded-lg flex flex-col items-center text-center">
                  <Book className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-medium">Bookstores</h3>
                </div>
                <div className="bg-primary-50 p-6 rounded-lg flex flex-col items-center text-center">
                  <ShoppingBag className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-medium">Retailers</h3>
                </div>
                <div className="bg-primary-50 p-6 rounded-lg flex flex-col items-center text-center">
                  <Heart className="h-10 w-10 text-primary mb-3" />
                  <h3 className="font-medium">Community</h3>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How LocalSpot Works</h2>
              <p className="text-muted-foreground mt-4 max-w-[700px] mx-auto">
                We're making it easier than ever to discover local businesses around you.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium">Interactive Map</h3>
                <p className="text-muted-foreground">
                  Explore businesses on our map interface to find what's near you or in areas you're visiting.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <LocateFixed className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium">Location-Based</h3>
                <p className="text-muted-foreground">
                  Find local businesses based on your current location or search in specific neighborhoods.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Compass className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium">Category Filters</h3>
                <p className="text-muted-foreground">
                  Filter businesses by category to find exactly what you're looking for, from cafés to bookstores.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Join the Community Section */}
        <section className="py-12 md:py-16 bg-primary-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Join Our Community</h2>
              <p className="text-muted-foreground max-w-[700px]">
                LocalSpot is more than just a directory—it's a community of people who believe in supporting local businesses.
                Whether you're a business owner or a conscious consumer, we welcome you to join us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/auth">
                  <Button className="w-full sm:w-auto">
                    Sign Up Now
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Explore Businesses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container px-4 md:px-6 py-8 md:py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">LocalSpot</div>
              <p className="text-muted-foreground mt-2">
                Connecting communities to local businesses.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/">
                    <a className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <a className="text-muted-foreground hover:text-foreground transition-colors">About</a>
                  </Link>
                </li>
                <li>
                  <Link href="/auth">
                    <a className="text-muted-foreground hover:text-foreground transition-colors">Sign In / Sign Up</a>
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact</h3>
              <p className="text-muted-foreground">
                For any questions or feedback, please reach out to us.
              </p>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Contact Us
              </Button>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} LocalSpot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;