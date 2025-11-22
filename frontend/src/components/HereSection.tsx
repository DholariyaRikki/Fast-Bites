import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Search, MapPin, Timer, ExternalLink, Heart, ShoppingBag, IndianRupee, CalendarDays, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import Image1 from "@/assets/360_F_1261696006_MJNVDYC3YUHifyjeVDZqkerU9ktWH0JJ.jpg";
import Image2 from "@/assets/360_F_258916556_B6oirjJOKQkaxs39KPi9wjf9ePlT7zF8.jpg";
import Image3 from "@/assets/pexels-daniel-reche-718241-3616956.jpg"
import Image4 from "@/assets/pexels-edwardeyer-1049626.jpg"
import Image5 from "@/assets/pexels-quang-nguyen-vinh-222549-2144112.jpg"
import{ useNavigate } from "react-router-dom";

import axios from "axios";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useUserStore } from "@/store/useUserStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useCartStore } from "@/store/useCartStore";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Restaurant } from "@/types/restaurantType";
import { Badge } from "./ui/badge";
import { LikeButton } from "./ui/like-button";
import AnimatedCard from "./ui/AnimatedCard";

const images = [Image1, Image2, Image3, Image4, Image5];

// Helper function to format dates
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const HereSection = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [searchError, setSearchError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Array<{ restaurantname: string; city: string; country: string }>>([]);
  const [cuisineSuggestions, setCuisineSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { likedRestaurants, getUserLikedRestaurants, loading, toggleLike } = useRestaurantStore();
  const { orders, getOrderDetails, loading: ordersLoading } = useOrderStore();
  const { clearCart, addToCart } = useCartStore();
  const { user } = useUserStore();

  // Common cuisines for suggestions
  const commonCuisines = [
    "Italian", "Chinese", "Indian", "Mexican", "Japanese", 
    "Thai", "American", "Mediterranean", "French", "Korean"
  ];

  // Filter for completed orders
  const completedOrders = orders?.filter((order) => 
    order.status?.toLowerCase() === "delivered"
  ) || [];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchText.length >= 2) {
        setIsSearching(true);
        try {
          const response = await axios.get(`http://localhost:3350/api/restaurant/suggestions?query=${encodeURIComponent(searchText)}`);
          if (response.data.success) {
            setSuggestions(response.data.suggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  // Filter cuisine suggestions based on search text
  useEffect(() => {
    if (searchText.length >= 2) {
      const filteredCuisines = commonCuisines.filter(cuisine =>
        cuisine.toLowerCase().includes(searchText.toLowerCase())
      );
      setCuisineSuggestions(filteredCuisines);
    } else {
      setCuisineSuggestions([]);
    }
  }, [searchText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch liked restaurants and order history if the user is logged in
    if (user) {
      getUserLikedRestaurants();
      getOrderDetails();
    }
  }, [user, getUserLikedRestaurants, getOrderDetails]);

  const handleSuggestionClick = (suggestion: { restaurantname: string; city: string; country: string }) => {
    setSearchText(suggestion.restaurantname);
    setShowSuggestions(false);
    navigate(`/search/${encodeURIComponent(suggestion.restaurantname)}`);
  };

  const handleCuisineClick = (cuisine: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine);
      } else {
        return [...prev, cuisine];
      }
    });
    setSearchText("");
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    if (!searchText.trim() && selectedCuisines.length === 0) {
      setSearchError("Please enter a restaurant name or select cuisines");
      return;
    }
    setSearchError("");
    const searchParams = new URLSearchParams();
    if (searchText.trim()) {
      searchParams.set("searchQuery", searchText.trim());
    }
    if (selectedCuisines.length > 0) {
      searchParams.set("selectedCuisines", selectedCuisines.join(","));
    }
    navigate(`/search/all?${searchParams.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const navigateToRestaurant = (restaurantId: string) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  // Function to handle "Order Again"
  const handleOrderAgain = (items: any[]) => {
    // Clear existing cart items
    clearCart();
    
    // Add each item from the order to the cart
    items.forEach(item => {
      // Convert the item to the expected MenuItem format if needed
      const menuItem = {
        _id: item._id,
        name: item.name,
        description: item.description || "",
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        isAvailable: true
      };
      
      // Add the item to cart the required number of times
      for (let i = 0; i < item.quantity; i++) {
        addToCart(menuItem);
      }
    });
    
    // Navigate to cart page
    navigate("/cart");
  };

  return (
    <div className="flex flex-col items-center justify-center bg-background">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto py-12 px-6 md:py-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">
          <div className="flex flex-col gap-8 md:w-1/2">
            <div className="flex flex-col gap-4">
              <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight text-balance animate-fade-in">
                Order Food <span className="gradient-text">Anytime</span> <br className="hidden md:block"/>
                & <span className="gradient-text">Anywhere</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md animate-slide-up">
                Our delicious food is waiting for you. We're always near to you with fast delivery.
              </p>
            </div>
            <div className="relative w-full" ref={searchRef}>
              <div className="relative flex items-center gap-2 bg-background border border-input rounded-full shadow-smooth hover:shadow-floating transition-all duration-300 glass-effect">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={searchText}
                    placeholder="Search restaurants by name, cuisine, or location"
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setSearchError("");
                    }}
                    onKeyDown={handleKeyDown}
                    className="flex w-full border-0 px-3 py-2 ring-offset-0 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 h-14 text-lg pl-12 pr-4 bg-transparent outline-none shadow-none rounded-full"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                </div>
                <div className="pr-1.5">
                  <Button
                    onClick={handleSearch}
                    className="gradient-bg hover:opacity-90 text-white h-12 px-6 shadow-md hover:shadow-lg transition-all duration-200 rounded-full font-medium flex items-center justify-center"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {searchError && (
                <div className="absolute mt-2 text-destructive text-sm ml-4">
                  {searchError}
                </div>
              )}
              {showSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border/40 rounded-2xl shadow-floating overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-2">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        {suggestions.length > 0 && (
                          <>
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                              Restaurants matching "{searchText}"
                            </div>
                            {suggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-colors duration-200 rounded-xl"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <div className="font-medium text-foreground flex items-center gap-2">
                                  <Search className="w-4 h-4 text-primary" />
                                  {suggestion.restaurantname}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {suggestion.city}, {suggestion.country}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {cuisineSuggestions.length > 0 && (
                          <>
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                              Cuisines matching "{searchText}"
                            </div>
                            {cuisineSuggestions.map((cuisine, index) => (
                              <div
                                key={`cuisine-${index}`}
                                className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-colors duration-200 rounded-xl"
                                onClick={() => handleCuisineClick(cuisine)}
                              >
                                <div className="font-medium text-foreground flex items-center gap-2">
                                  <Search className="w-4 h-4 text-primary" />
                                  {cuisine}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {suggestions.length === 0 && cuisineSuggestions.length === 0 && searchText.length >= 2 && (
                          <div className="px-4 py-3 text-center text-muted-foreground">
                            No restaurants or cuisines found. Try a different search term.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedCuisines.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCuisines.map((cuisine, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {cuisine}
                    <button
                      onClick={() => handleCuisineClick(cuisine)}
                      className="ml-1 hover:text-primary/80"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-start gap-8 mt-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Timer className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Track Order</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative">
            <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-3xl shadow-floating hover-lift">
              <img
                src={images[currentImageIndex]}
                alt="Delicious food"
                className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute top-4 right-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liked Restaurants Section */}
      {user && (
        <section className="w-full max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              <span className="inline-block pb-2 border-b-2 border-primary">Your Liked Restaurants</span>
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : likedRestaurants?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {likedRestaurants.map((restaurant: Restaurant, index) => (
                <AnimatedCard
                  key={restaurant._id}
                  delay={index * 100}
                  hover={true}
                  gradient={false}
                  className="overflow-hidden group cursor-pointer"
                  onClick={() => navigateToRestaurant(restaurant._id)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.restaurantname}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                      <h3 className="text-white font-medium text-lg">{restaurant.restaurantname}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-white/20 hover:bg-white/20 text-white border-none backdrop-blur">
                          {restaurant.cuisines[0]}
                        </Badge>
                        {restaurant.cuisines.length > 1 && (
                          <Badge className="bg-white/20 hover:bg-white/20 text-white border-none backdrop-blur">
                            +{restaurant.cuisines.length - 1} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <LikeButton
                        isLiked={restaurant.userHasLiked || false}
                        count={restaurant.likeCount || 0}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (restaurant._id) toggleLike(restaurant._id);
                        }}
                        disabled={!user}
                        size="md"
                        showCount={false}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">{restaurant.deliverytime} mins</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5">
                      View Menu
                      <ExternalLink className="ml-1 w-3 h-3" />
                    </Button>
                  </CardContent>
                </AnimatedCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/40 rounded-xl border border-border/20">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No liked restaurants yet</h3>
              <p className="text-muted-foreground mb-6">Start exploring restaurants and like your favorites</p>
              <Button 
                onClick={() => navigate('/search/all')} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
              >
                Explore Restaurants
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Order History Section */}
      {user && (
        <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              <span className="inline-block pb-2 border-b-2 border-primary">Recent Orders</span>
            </h2>
            {completedOrders.length > 0 && (
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/5 flex items-center gap-2"
                onClick={() => navigate('/order/status')}
              >
                <ShoppingBag className="h-4 w-4" />
                View Order History
              </Button>
            )}
          </div>
          
          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : completedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Sort orders by date and take only the 3 most recent ones */}
              {completedOrders
                .sort((a, b) => new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime())
                .slice(0, 3)
                .map((order, index) => {
                // Get the right property - either cartItems or items
                const orderItems = order.cartItems || order.items || [];
                
                // Calculate amounts if not provided
                const subtotal = order.subtotal || orderItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
                const deliveryCharge = order.deliveryCharge || Math.round(subtotal * 0.20);
                const totalAmount = order.totalAmount || (subtotal + deliveryCharge);
                
                return (
                  <Card 
                    key={index}
                    className="overflow-hidden transition-all duration-300 hover:shadow-xl border border-border/40 h-full flex flex-col"
                  >
                    <div className="relative h-48">
                      {orderItems[0]?.image && (
                        <img
                          src={orderItems[0].image}
                          alt={orderItems[0].name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            // If image fails to load, use a random hero image
                            (e.target as HTMLImageElement).src = images[Math.floor(Math.random() * images.length)];
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>
                      <div className="absolute bottom-3 left-3">
                        {order.restaurant && (
                          <p className="text-sm text-white font-medium flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {order.restaurant.restaurantname}
                          </p>
                        )}
                        {order.updatedAt && (
                          <p className="text-sm text-white/80 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(order.updatedAt)}
                          </p>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 flex items-center gap-1 shadow-sm border-none">
                          <CheckCircle className="h-3 w-3" />
                          Delivered
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1 bg-card text-card-foreground">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          {!order.restaurant && (
                            <Badge variant="outline" className="text-muted-foreground border-border/60">
                              Unknown Restaurant
                            </Badge>
                          )}
                        </div>
                        <div className="font-bold text-lg flex items-center">
                          <IndianRupee className="h-4 w-4 text-primary" />
                          {totalAmount}
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4 mb-3">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3 text-primary" />
                          Order Items
                        </h4>
                        <div className="space-y-3">
                          {orderItems.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                  {item.image ? (
                                    <img 
                                      src={item.image} 
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-muted"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M9 20h6"/><path d="M12 4v16"/></svg></div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                              </div>
                              <p className="text-sm text-muted-foreground font-medium">×{item.quantity}</p>
                            </div>
                          ))}
                          {orderItems.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center border-t border-border/10 pt-2 mt-2">
                              +{orderItems.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 mt-auto">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 py-5"
                        onClick={() => handleOrderAgain(orderItems)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Order Again
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-muted/30 border border-border/30 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No order history yet</h3>
                <p className="text-muted-foreground mb-4">
                  When you place orders, they will appear here for quick reordering.
                </p>
                <Button
                  onClick={() => navigate('/search/all')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Find Restaurants
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HereSection;
