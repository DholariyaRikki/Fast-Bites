import { Link, useParams } from "react-router-dom";
import { Input } from "./ui/input";
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, X, Search, RotateCcw} from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { Restaurant } from "@/types/restaurantType";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import { LikeButton } from "./ui/like-button";

const SearchPage = () => {
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Array<{ restaurantname: string; city: string; country: string }>>([]);
  const [cuisineSuggestions, setCuisineSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  const {
    loading,
    searchedRestaurant,
    searchRestaurant,
    setAppliedFilter,
    appliedFilter,
    resetAppliedFilter,
    toggleLike,
  } = useRestaurantStore();
  const navigate = useNavigate();
  useEffect(() => {
    // Special handling for "all" route - fetch all restaurants
    if (params.text === "all") {
      searchRestaurant("all", searchQuery, appliedFilter);
    } else {
      searchRestaurant(params.text!, searchQuery, appliedFilter);
    }
  }, [params.text!, appliedFilter]);

  // Add debugging when search data is received
  useEffect(() => {
    if (searchedRestaurant?.data) {

      // Check if images exist
      const missingImages = searchedRestaurant.data.filter((r: any) => !r.imageUrl);
      if (missingImages.length > 0) {
        console.warn(`${missingImages.length} restaurants have missing images`);
      }
    }
  }, [searchedRestaurant]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await axios.get(`http://localhost:3350/api/restaurant/suggestions?query=${encodeURIComponent(searchQuery)}`);
          if (response.data.success) {
            setSuggestions(response.data.suggestions || []);
            setCuisineSuggestions(response.data.cuisineSuggestions || []);
            setLocationSuggestions(response.data.locationSuggestions || []);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setCuisineSuggestions([]);
            setLocationSuggestions([]);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
          setCuisineSuggestions([]);
          setLocationSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setCuisineSuggestions([]);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: { restaurantname: string; city: string; country: string }) => {
    setSearchQuery(suggestion.restaurantname);
    setShowSuggestions(false);
    searchRestaurant(params.text!, suggestion.restaurantname, appliedFilter);
  };

  const handleCuisineClick = (cuisine: string) => {
    setSelectedCuisines(prev => {
      // If cuisine is already selected, remove it, otherwise add it
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine);
      } else {
        return [...prev, cuisine];
      }
    });
  };

  const handleLocationClick = (location: string) => {
    setSelectedLocations(prev => {
      // If location is already selected, remove it, otherwise add it
      if (prev.includes(location)) {
        return prev.filter(l => l !== location);
      } else {
        return [...prev, location];
      }
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    setSuggestions([]);
    setCuisineSuggestions([]);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setSelectedCuisines([]);
    setSelectedLocations([]);
    resetAppliedFilter();
    searchRestaurant("all", "", []);
    navigate("/search/all");
  };

  const handleLike = async (e: React.MouseEvent, restaurantId: string) => {
    e.preventDefault(); // Prevent navigation when clicking the like button
    e.stopPropagation(); // Stop event bubbling
    
    if (!user) return; // Don't allow liking if not logged in
    await toggleLike(restaurantId);
    
    // Refresh search results to update like status
    if (params.text === "all") {
      searchRestaurant("all", searchQuery, appliedFilter);
    } else {
      searchRestaurant(params.text!, searchQuery, appliedFilter);
    }
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    // Combine search filters - query, cuisines and locations
    if (params.text === "all") {
      const combinedFilters = [...appliedFilter, ...selectedCuisines, ...selectedLocations];
      searchRestaurant("all", searchQuery, combinedFilters);
    } else {
      const combinedFilters = [...appliedFilter, ...selectedCuisines, ...selectedLocations];
      searchRestaurant(params.text!, searchQuery, combinedFilters);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto my-10 px-4">
      <div className="flex flex-col md:flex-row justify-between gap-10">
        <div className="flex-1">
          {/* Search Input Field  */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex-1" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                value={searchQuery}
                placeholder="Search by restaurant name, cuisine, or location..."
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-lg shadow-sm border-2 focus:border-primary transition-all duration-200 pl-10 rounded-full"
              />
              {showSuggestions && (
                <div className="absolute z-50 w-full mt-2 bg-background border border-border/40 rounded-xl shadow-floating overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                              Restaurants matching "{searchQuery}"
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
                              Cuisines matching "{searchQuery}"
                            </div>
                            {cuisineSuggestions.map((cuisine, index) => (
                              <div
                                key={`cuisine-${index}`}
                                className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-colors duration-200 rounded-xl"
                                onClick={() => handleCuisineClick(cuisine)}
                              >
                                <div className="font-medium text-foreground flex items-center gap-2">
                                  <Search className="w-4 h-4 text-primary" />
                                  {cuisine} <span className="text-xs text-muted-foreground">(Cuisine)</span>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {locationSuggestions.length > 0 && (
                          <>
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                              Locations matching "{searchQuery}"
                            </div>
                            {locationSuggestions.map((location, index) => (
                              <div
                                key={`location-${index}`}
                                className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-colors duration-200 rounded-xl"
                                onClick={() => handleLocationClick(location)}
                              >
                                <div className="font-medium text-foreground flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  {location} <span className="text-xs text-muted-foreground">(Location)</span>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {suggestions.length === 0 && cuisineSuggestions.length === 0 && locationSuggestions.length === 0 && searchQuery.length >= 2 && (
                          <div className="px-4 py-3 text-center text-muted-foreground">
                            No restaurants, cuisines or locations found. Try a different search term.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  "Search"
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="h-12 px-4 shadow-md hover:shadow-lg transition-all duration-200 border-2 rounded-full hover:bg-primary/5"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {/* Selected Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCuisines.map((cuisine, index) => (
              <div
                key={`cuisine-tag-${index}`}
                className="relative inline-flex items-center max-w-full group animate-in fade-in slide-in-from-left-2"
              >
                <Badge
                  className="text-primary rounded-full hover:cursor-pointer pr-8 py-2 px-4 bg-primary/10 border-2 border-primary/20 hover:bg-primary/20 transition-all duration-200"
                  variant="outline"
                >
                  <Search className="w-3 h-3 mr-1" /> {cuisine}
                </Badge>
                <X
                  onClick={() => handleCuisineClick(cuisine)}
                  size={16}
                  className="absolute text-primary right-2 hover:cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            ))}
            
            {selectedLocations.map((location, index) => (
              <div
                key={`location-tag-${index}`}
                className="relative inline-flex items-center max-w-full group animate-in fade-in slide-in-from-left-2"
              >
                <Badge
                  className="text-primary rounded-full hover:cursor-pointer pr-8 py-2 px-4 bg-primary/10 border-2 border-primary/20 hover:bg-primary/20 transition-all duration-200"
                  variant="outline"
                >
                  <MapPin className="w-3 h-3 mr-1" /> {location}
                </Badge>
                <X
                  onClick={() => handleLocationClick(location)}
                  size={16}
                  className="absolute text-primary right-2 hover:cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            ))}
            
            {appliedFilter.map((selectedFilter: string, idx: number) => (
              <div
                key={idx}
                className="relative inline-flex items-center max-w-full group animate-in fade-in slide-in-from-left-2"
              >
                <Badge
                  className="text-orange rounded-full hover:cursor-pointer pr-8 py-2 px-4 bg-orange/10 border-2 border-orange/20 hover:bg-orange/20 transition-all duration-200"
                  variant="outline"
                >
                  {selectedFilter}
                </Badge>
                <X
                  onClick={() => setAppliedFilter(selectedFilter)}
                  size={16}
                  className="absolute text-orange right-2 hover:cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            ))}
          </div>
          {/* Searched Items display here  */}
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-2xl text-gray-800 dark:text-gray-200">
                  Found <span className="text-orange font-bold">{searchedRestaurant?.data.length}</span> restaurants
                </h1>
                {appliedFilter.length > 0 && (
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    className="text-orange hover:text-orange hover:bg-orange/10 rounded-full"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
            {/* Restaurant Cards  */}
            <div className="grid md:grid-cols-3 gap-6">
              {loading ? (
                <SearchPageSkeleton />
              ) : !searchedRestaurant?.data ? (
                <div className="col-span-3 text-center p-8">
                  <p>No data available. Please try another search.</p>
                </div>
              ) : searchedRestaurant.data.length === 0 ? (
                <NoResultFound searchText={params.text === "all" ? "all available restaurants" : params.text!} />
              ) : (
                searchedRestaurant.data.map((restaurant: Restaurant, index: number) => (
                  <Card
                    key={restaurant._id}
                    className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fade-in hover-lift"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative w-full h-48 md:h-56 group">
                      <img
                        src={restaurant.imageUrl || "https://placehold.co/600x400/orange/white?text=Restaurant+Image"}
                        alt={restaurant.restaurantname}
                        className="w-full h-full object-cover object-center rounded-t-2xl transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/600x400/orange/white?text=Image+Error";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          Featured
                        </span>
                      </div>
                      
                      {/* Add Like Button */}
                      <div className="absolute top-3 right-3">
                        <LikeButton
                          isLiked={!!restaurant.userHasLiked}
                          count={restaurant.likeCount || 0}
                          onClick={(e) => handleLike(e, restaurant._id)}
                          disabled={!user}
                          size="sm"
                          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 gradient-text">
                        {restaurant.restaurantname}
                      </h1>
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <MapPin size={18} className="mr-2 text-orange" />
                          <p className="text-sm">
                            <span className="font-medium">{restaurant.city}</span>, {restaurant.country}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {restaurant.cuisines.map(
                            (cuisine: string, idx: number) => (
                              <Badge
                                key={idx}
                                className="font-medium px-3 py-1 rounded-full bg-orange/10 text-orange border border-orange/20 hover:bg-orange/20 transition-all duration-200 hover:scale-105"
                              >
                                {cuisine}
                              </Badge>
                            )
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Status: <span className="font-medium">{restaurant.status}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 border-t dark:border-t-gray-700 border-t-gray-100 flex justify-end">
                      {restaurant.status === "closed" ? (
                        <span className="text-red-500 font-medium">Menu not available (Closed)</span>
                      ) : (
                        <Link to={`/restaurant/${restaurant._id}`}>
                          <Button className="gradient-bg hover:opacity-90 text-white font-semibold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200">
                            View Menus
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

const SearchPageSkeleton = () => {
  return (
    <div className="col-span-3 grid md:grid-cols-3 gap-6 w-full">
      {[...Array(3)].map((_, index) => (
        <Card
          key={index}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden"
        >
          <div className="relative w-full h-48 md:h-56">
            <Skeleton className="w-full h-full rounded-t-2xl" />
          </div>
          <CardContent className="p-4">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <div className="mt-2 gap-1 flex items-center text-gray-600 dark:text-gray-400">
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="mt-2 flex gap-1 items-center text-gray-600 dark:text-gray-400">
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
          <CardFooter className="p-4 dark:bg-gray-900 flex justify-end">
            <Skeleton className="h-10 w-24 rounded-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const NoResultFound = ({ searchText }: { searchText: string }) => {
  const navigate = useNavigate();
  
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        No restaurants found
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        We couldn't find any restaurants matching "{searchText}". Try a different search term or explore our full selection.
      </p>
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="rounded-full px-6 py-2 border-2 border-orange text-orange hover:bg-orange hover:text-white transition-all duration-200"
          onClick={() => navigate("/")}
        >
          Go Home
        </Button>
        <Button
          className="rounded-full px-6 py-2 bg-orange hover:bg-hoverOrange text-white transition-all duration-200"
          onClick={() => navigate("/search/all")}
        >
          Browse All Restaurants
        </Button>
      </div>
    </div>
  );
};
