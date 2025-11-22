import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RestaurantFormSchema,
  restaurantFromSchema,
} from "@/schema/restaurantSchema";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { Loader2, UsersRound, Timer, Heart, UtensilsCrossed, Eye, BarChart3, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Restaurant = () => {
  const [input, setInput] = useState<RestaurantFormSchema>({
    restaurantName: "",
    city: "",
    country: "",
    deliveryTime: 0,
    cuisines: [],
    imageFile: undefined,
  });
  const [errors, setErrors] = useState<Partial<RestaurantFormSchema>>({});
  const {
    loading,
    restaurant,
    updateRestaurant,
    createRestaurant,
    getRestaurant,
    updateRestaurantStatus,
    likeStats,
    getRestaurantLikes
  } = useRestaurantStore();
  const [status, setStatus] = useState<'open' | 'closed'>(restaurant?.status || 'closed');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput({...input, imageFile: file});
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = restaurantFromSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      setErrors(fieldErrors as Partial<RestaurantFormSchema>);
      return;
    }
    // add restaurant api implementation start from here
    try {
      const formData = new FormData();
      formData.append("restaurantName", input.restaurantName);
      formData.append("city", input.city);
      formData.append("country", input.country);
      formData.append("deliveryTime", input.deliveryTime.toString());
      formData.append("cuisines", JSON.stringify(input.cuisines));

      if (input.imageFile) {
        formData.append("imageFile", input.imageFile);
      }

      if (restaurant) {
        // update
        await updateRestaurant(formData);
        toast.success("Restaurant updated successfully!");
      } else {
        // create
        await createRestaurant(formData);
        toast.success("Restaurant created successfully!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await getRestaurant();
      await getRestaurantLikes(); // Fetch likes statistics
      
      if (restaurant) {
        setInput({
          restaurantName: restaurant.restaurantname || "",
          city: restaurant.city || "",
          country: restaurant.country || "",
          deliveryTime: restaurant.deliverytime || 0,
          cuisines: restaurant.cuisines
            ? restaurant.cuisines.map((cuisine: string) => cuisine)
            : [],
          imageFile: undefined,
        });
        setStatus(restaurant.status);
        
        // Set preview image from existing restaurant image
        if (restaurant.imageUrl) {
          setPreviewImage(restaurant.imageUrl);
        }
      }
    };
    
    fetchData();
  }, []);

  const handleStatusChange = async () => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    const newStatus = status === 'open' ? 'closed' : 'open';
    try {
      await updateRestaurantStatus(restaurant._id, { status: newStatus });
      setStatus(newStatus);
      toast.success(`Restaurant is now ${newStatus === 'open' ? 'open' : 'closed'}!`);
    } catch (error) {
      console.error("Failed to update restaurant status:", error);
      toast.error("Failed to update restaurant status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Restaurant Dashboard</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>Restaurant Settings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {restaurant && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Restaurant Statistics</h2>
                <Button 
                  onClick={handleStatusChange} 
                  className={`${status === 'open' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white transition duration-300`}
                  disabled={isUpdatingStatus}
                >
                  {status === 'open' ? 'Restaurant is Open' : 'Restaurant is Closed'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Likes Card */}
                <Card className="p-4 flex items-center bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="mr-4 bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
                    <h3 className="text-2xl font-bold">{likeStats?.likesCount || restaurant.likesCount || 0}</h3>
                  </div>
                </Card>
                
                {/* Delivery Time Card */}
                <Card className="p-4 flex items-center bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="mr-4 bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                    <Timer className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Time</p>
                    <h3 className="text-2xl font-bold">{restaurant.deliverytime} mins</h3>
                  </div>
                </Card>
                
                {/* Cuisines Card */}
                <Card className="p-4 flex items-center bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="mr-4 bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                    <UtensilsCrossed className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cuisines</p>
                    <h3 className="text-2xl font-bold">{restaurant.cuisines?.length || 0}</h3>
                  </div>
                </Card>
                
                {/* Status Card */}
                <Card className={`p-4 flex items-center bg-gradient-to-br ${status === 'open' ? 'from-green-50 to-white dark:from-green-950 dark:to-gray-900' : 'from-gray-50 to-white dark:from-gray-800 dark:to-gray-900'} shadow-md hover:shadow-lg transition-all duration-300`}>
                  <div className={`mr-4 ${status === 'open' ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'} p-3 rounded-full`}>
                    <UsersRound className={`h-6 w-6 ${status === 'open' ? 'text-green-500' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <h3 className="text-2xl font-bold capitalize">{status}</h3>
                  </div>
                </Card>
              </div>
              
              {/* Restaurant Preview Card */}
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Restaurant Preview</h2>
                <Card className="overflow-hidden">
                  <div className="relative h-56">
                    <img 
                      src={restaurant.imageUrl} 
                      alt={restaurant.restaurantname}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold">{restaurant.restaurantname}</h3>
                      <p className="text-sm opacity-90">{restaurant.city}, {restaurant.country}</p>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'open' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {restaurant.cuisines?.map((cuisine: string, idx: number) => (
                        <span key={idx} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                          {cuisine}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Timer className="w-4 h-4 mr-2" />
                      <span>Delivery in {restaurant.deliverytime} mins</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="p-6 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-xl mb-5 pb-2 border-b dark:border-gray-700">
              {restaurant ? "Update Your Restaurant" : "Create Your Restaurant"}
            </h2>
            
            <form onSubmit={submitHandler} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Restaurant Name */}
                  <div>
                    <Label className="text-sm font-medium mb-1">Restaurant Name</Label>
                    <Input
                      type="text"
                      name="restaurantName"
                      value={input.restaurantName}
                      onChange={changeEventHandler}
                      placeholder="Enter your restaurant name"
                      className="mt-1 border dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    {errors.restaurantName && (
                      <span className="text-xs text-red-600 font-medium">
                        {errors.restaurantName}
                      </span>
                    )}
                  </div>
                  
                  {/* City */}
                  <div>
                    <Label className="text-sm font-medium mb-1">City</Label>
                    <Input
                      type="text"
                      name="city"
                      value={input.city}
                      onChange={changeEventHandler}
                      placeholder="Enter your city name"
                      className="mt-1 border dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    {errors.city && (
                      <span className="text-xs text-red-600 font-medium">
                        {errors.city}
                      </span>
                    )}
                  </div>
                  
                  {/* Country */}
                  <div>
                    <Label className="text-sm font-medium mb-1">Country</Label>
                    <Input
                      type="text"
                      name="country"
                      value={input.country}
                      onChange={changeEventHandler}
                      placeholder="Enter your country name"
                      className="mt-1 border dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    {errors.country && (
                      <span className="text-xs text-red-600 font-medium">
                        {errors.country}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Delivery Time */}
                  <div>
                    <Label className="text-sm font-medium mb-1">Delivery Time (mins)</Label>
                    <Input
                      type="number"
                      name="deliveryTime"
                      value={input.deliveryTime}
                      onChange={changeEventHandler}
                      placeholder="Enter your delivery time"
                      className="mt-1 border dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    {errors.deliveryTime && (
                      <span className="text-xs text-red-600 font-medium">
                        {errors.deliveryTime}
                      </span>
                    )}
                  </div>
                  
                  {/* Cuisines */}
                  <div>
                    <Label className="text-sm font-medium mb-1">Cuisines (comma separated)</Label>
                    <Input
                      type="text"
                      name="cuisines"
                      value={input.cuisines}
                      onChange={(e) =>
                        setInput({ ...input, cuisines: e.target.value.split(",") })
                      }
                      placeholder="e.g. Momos, Biryani, Pizza"
                      className="mt-1 border dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    {errors.cuisines && (
                      <span className="text-xs text-red-600 font-medium">
                        {errors.cuisines}
                      </span>
                    )}
                  </div>
                  
                  {/* Upload Restaurant Banner */}
                  <div>
                    <Label className="text-sm font-medium mb-1">Restaurant Banner Image</Label>
                    <div className="mt-1 flex items-center">
                      <Input
                        onChange={handleFileChange}
                        type="file"
                        accept="image/*"
                        name="imageFile"
                        className="border dark:border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>
                    {errors.imageFile && (
                      <span className="text-xs text-red-600 font-medium">
                        {errors.imageFile?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Preview Image */}
              {previewImage && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-1">Image Preview</Label>
                  <div className="mt-1 relative h-40 w-full overflow-hidden rounded-lg border dark:border-gray-700">
                    <img 
                      src={previewImage} 
                      alt="Restaurant Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t dark:border-gray-700">
                {loading ? (
                  <Button disabled className="bg-gray-400 hover:bg-gray-500 transition duration-300">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </Button>
                ) : (
                  <Button className="bg-orange hover:bg-hoverOrange transition duration-300 flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {restaurant ? "Update Restaurant" : "Create Restaurant"}
                  </Button>
                )}
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => window.open(`/restaurant/${restaurant?._id}`, '_blank')}
                  className="border-orange text-orange hover:bg-orange/10"
                  disabled={!restaurant}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Page
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Restaurant;
