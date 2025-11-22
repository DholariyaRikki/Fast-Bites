import {
  Loader2,
  IndianRupee, 
  CalendarIcon, 
  PackageIcon,
  User,
  MapPin,
  Mail,
  Phone,
  Globe,
  Building,
  Edit
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useUserStore } from "@/store/useUserStore";
import { useOrderStore } from "@/store/useOrderStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Order } from "@/types/orderType";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const Profile = () => {
  const { user, updateProfile } = useUserStore();
  const { orders, getOrderDetails } = useOrderStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
    profilePicture: user?.profilePicture || "",
  });
  const imageRef = useRef<HTMLInputElement | null>(null);
  const [selectedProfilePicture, setSelectedProfilePicture] =
    useState<string>(profileData.profilePicture || "");
  const [contact] = useState<string>(user?.contact || "");
  const [stats, setStats] = useState({
    totalOrders: 0,
    monthlyOrders: 0,
    totalSpending: 0
  });

  // Fetch user orders
  useEffect(() => {
    getOrderDetails();
  }, [getOrderDetails]);

  // Calculate statistics when orders change
  useEffect(() => {
    if (orders && orders.length > 0) {
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filter for orders from this month
      const thisMonthOrders = orders.filter((order: Order) => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : null;
        return orderDate && 
          orderDate.getMonth() === currentMonth && 
          orderDate.getFullYear() === currentYear;
      });
      
      // Calculate total spending
      const totalSpending = orders.reduce((sum, order) => {
        // Check if order has cart items to calculate from
        if (order.cartItems && order.cartItems.length > 0) {
          // Calculate directly from cart items if available
          const itemTotal = order.cartItems.reduce((subtotal, item) => 
            subtotal + (item.price * item.quantity), 0);
          
          // Calculate delivery charge as 20% of item total
          const deliveryCharge = Math.round(itemTotal * 0.20);
          
          return sum + itemTotal + deliveryCharge;
        } else {
          // Fall back to stored values, defaulting to 0 if not present
          const subtotal = order.subtotal || 0;
          const deliveryCharge = order.deliveryCharge || Math.round(subtotal * 0.20);
          const total = order.totalAmount || (subtotal + deliveryCharge);
          
          // Return at least some value even if all are zero
          return sum + (total > 0 ? total : 0);
        }
      }, 0);
      setStats({
        totalOrders: orders.length,
        monthlyOrders: thisMonthOrders.length,
        totalSpending
      });
    }
  }, [orders]);

  const fileChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedProfilePicture(result);
        setProfileData((prevData) => ({
          ...prevData,
          profilePicture: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const updateProfileHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (!user) {
        console.error("User is not logged in.");
        setIsLoading(false);
        return;
      }
      await updateProfile({
        id: user.id,
        isverified: user.isverified,
        ...profileData,
        contact,
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Get current month name
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  // Only show statistics for regular users (not admins or delivery persons)
  const showStats = user && !user.admin && !user.delivery;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
          </div>
          {isLoading && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating your profile...
            </div>
          )}
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-orange/10 data-[state=active]:text-orange">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            {showStats && (
              <TabsTrigger value="statistics" className="data-[state=active]:bg-orange/10 data-[state=active]:text-orange">
                <IndianRupee className="w-4 h-4 mr-2" />
                Statistics
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="overflow-hidden bg-white border-0 shadow-md">
              <div className="relative bg-gradient-to-r from-orange to-hoverOrange h-32"></div>
              <div className="px-6 pb-6">
                <div className="relative -mt-16 flex justify-center">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <AvatarImage src={selectedProfilePicture} />
                      <AvatarFallback className="bg-orange/20 text-orange text-xl font-bold">
                        {profileData.fullname ? profileData.fullname.charAt(0) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => imageRef.current?.click()}
                      className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-all border border-gray-200"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                      <input
                        ref={imageRef}
                        className="hidden"
                        type="file"
                        accept="image/*"
                        onChange={fileChangeHandler}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-900">{profileData.fullname || "Your Name"}</h2>
                  <p className="text-gray-500 mt-1">{profileData.email}</p>
                  {user?.isverified && (
                    <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified Account
                    </span>
                  )}
                </div>

                <Separator className="my-6" />

                <form onSubmit={updateProfileHandler}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullname" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-orange" />
                        Full Name
                      </Label>
                      <Input
                        id="fullname"
                        type="text"
                        name="fullname"
                        value={profileData.fullname}
                        onChange={changeHandler}
                        className="rounded-lg border-gray-300 focus:border-orange focus:ring-orange shadow-sm"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-orange" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        disabled
                        name="email"
                        value={profileData.email}
                        className="rounded-lg border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={changeHandler}
                        className="rounded-lg border-gray-300 focus:border-orange focus:ring-orange shadow-sm"
                        placeholder="Enter your address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange" />
                        City
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={changeHandler}
                        className="rounded-lg border-gray-300 focus:border-orange focus:ring-orange shadow-sm"
                        placeholder="Enter your city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-orange" />
                        Country
                      </Label>
                      <Input
                        id="country"
                        name="country"
                        value={profileData.country}
                        onChange={changeHandler}
                        className="rounded-lg border-gray-300 focus:border-orange focus:ring-orange shadow-sm"
                        placeholder="Enter your country"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-orange" />
                        Contact
                      </Label>
                      <Input
                        id="contact"
                        disabled
                        name="contact"
                        value={contact}
                        className="rounded-lg border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className={`bg-orange hover:bg-hoverOrange text-white px-8 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${isLoading ? 'opacity-80' : 'hover:scale-105'}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </TabsContent>

          {showStats && (
            <TabsContent value="statistics" className="space-y-6">
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="text-xl font-bold text-gray-800">Your Order Statistics</CardTitle>
                  <CardDescription>Summary of your order activity and spending</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <PackageIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
                        <p className="text-xs text-gray-500 mt-1">All time orders placed</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">{currentMonthName} Orders</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CalendarIcon className="h-4 w-4 text-green-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.monthlyOrders}</div>
                        <p className="text-xs text-gray-500 mt-1">Orders this month</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <IndianRupee className="h-4 w-4 text-orange" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline">
                          <div className="text-3xl font-bold text-gray-900">₹{stats.totalSpending.toFixed(0)}</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Including all delivery charges</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-8 p-4 bg-orange/5 border border-orange/10 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <IndianRupee className="inline mr-1 h-4 w-4 text-orange" />
                      Spending Insights
                    </h3>
                    <p className="text-sm text-gray-600">
                      {stats.totalOrders > 0 
                        ? `Your average order value is ₹${(stats.totalSpending / stats.totalOrders).toFixed(0)}.` 
                        : "Start ordering to see your spending insights."}
                      {stats.monthlyOrders > 0 && ` This month, you've placed ${stats.monthlyOrders} orders so far.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
