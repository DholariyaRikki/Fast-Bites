import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Order, CartItem } from "@/types/orderType";
import {
  IndianRupee,
  CalendarIcon,
  PackageIcon,
  Wallet,
  Clock,
  TrendingUp,
  CheckCircle,
  Timer,
  Package2,
  Search,
  ShoppingBag,
  ArrowUpRight,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Textarea from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useOrderStore } from "@/store/useOrderStore";

// Helper function to format dates
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Helper function to get status badge properties
const getStatusBadge = (status: string) => {
  switch(status.toLowerCase()) {
    case 'pending':
      return { 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
        icon: <Clock className="h-3 w-3 mr-1" /> 
      };
    case 'confirmed':
      return { 
        color: "bg-blue-100 text-blue-800 border-blue-200", 
        icon: <CheckCircle className="h-3 w-3 mr-1" /> 
      };
    case 'preparing':
      return { 
        color: "bg-purple-100 text-purple-800 border-purple-200", 
        icon: <Timer className="h-3 w-3 mr-1" /> 
      };
    case 'outfordelivery':
      return { 
        color: "bg-orange-100 text-orange-800 border-orange-200", 
        icon: <Package2 className="h-3 w-3 mr-1" /> 
      };
    case 'cancelled':
      return { 
        color: "bg-red-100 text-red-800 border-red-200", 
        icon: <XCircle className="h-3 w-3 mr-1" /> 
      };
    default:
      return { 
        color: "bg-gray-100 text-gray-800 border-gray-200", 
        icon: <Clock className="h-3 w-3 mr-1" /> 
      };
  }
};

const Orders = () => {
  const { restaurantOrder, getRestaurantOrders, updateRestaurantOrder } =
    useRestaurantStore();
  const { adminCancelOrder, loading } = useOrderStore();
    
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalOrders: 0,
    monthlyEarnings: 0,
    monthlyOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Filter active, completed and cancelled orders
  const activeOrders = restaurantOrder?.filter((order: Order) => 
    !['delivered', 'cancelled'].includes(order.status.toLowerCase())
  ) || [];
  
  const completedOrders = restaurantOrder?.filter((order: Order) => 
    order.status.toLowerCase() === 'delivered'
  ) || [];

  const cancelledOrders = restaurantOrder?.filter((order: Order) => 
    order.status.toLowerCase() === 'cancelled'
  ) || [];

  // Filter orders based on search query
  const filteredActiveOrders = activeOrders.filter((order: Order) => 
    order.deliveryDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.deliveryDetails.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompletedOrders = completedOrders.filter((order: Order) => 
    order.deliveryDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.deliveryDetails.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCancelledOrders = cancelledOrders.filter((order: Order) => 
    order.deliveryDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.deliveryDetails.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (id: string, status: string) => {
    await updateRestaurantOrder(id, status);
    // Refresh orders after status update
    await getRestaurantOrders();
  };

  const handleCancelOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrderId || !cancelReason.trim()) return;
    
    try {
      await adminCancelOrder(selectedOrderId, cancelReason.trim());
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedOrderId(null);
      await getRestaurantOrders(); // Refresh orders
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const closeCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancelReason("");
    setSelectedOrderId(null);
  };

  // Calculate statistics when restaurant orders change
  useEffect(() => {
    if (restaurantOrder && restaurantOrder.length > 0) {
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate total earnings (excluding cancelled orders)
      const totalEarnings = restaurantOrder.reduce((sum, order) => {
        // Skip cancelled orders
        if (order.status.toLowerCase() === 'cancelled') {
          return sum;
        }

        // Calculate subtotal for this order (excluding delivery charge)
        let subtotal = order.subtotal || 0;
        if (subtotal === 0 && order.cartItems) {
          subtotal = order.cartItems.reduce((acc: number, item: any) => {
            return acc + (item.price * item.quantity);
          }, 0);
        }
        
        // Restaurant gets full subtotal
        return sum + subtotal;
      }, 0);
      
      // Filter for non-cancelled orders from this month
      const thisMonthOrders = restaurantOrder.filter((order: Order) => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : null;
        return orderDate && 
          orderDate.getMonth() === currentMonth && 
          orderDate.getFullYear() === currentYear &&
          order.status.toLowerCase() !== 'cancelled';
      });
      
      // Calculate this month's earnings (excluding cancelled orders)
      const monthlyEarnings = thisMonthOrders.reduce((sum, order) => {
        // Skip cancelled orders (although they should already be filtered out in thisMonthOrders)
        if (order.status.toLowerCase() === 'cancelled') {
          return sum;
        }

        // Calculate subtotal for this order (excluding delivery charge)
        let subtotal = order.subtotal || 0;
        if (subtotal === 0 && order.cartItems) {
          subtotal = order.cartItems.reduce((acc: number, item: any) => {
            return acc + (item.price * item.quantity);
          }, 0);
        }
        
        // Restaurant gets full subtotal
        return sum + subtotal;
      }, 0);

      // Count orders excluding cancelled ones
      const cancelledOrders = restaurantOrder.filter((order: Order) => 
        order.status.toLowerCase() === 'cancelled'
      ).length;

      const activeOrders = restaurantOrder.filter((order: Order) => 
        !['delivered', 'cancelled'].includes(order.status.toLowerCase())
      ).length;
      
      const deliveredOrders = restaurantOrder.filter((order: Order) => 
        order.status.toLowerCase() === 'delivered'
      ).length;

      // Calculate total non-cancelled orders
      const totalNonCancelledOrders = activeOrders + deliveredOrders;

      // Calculate average order value (excluding cancelled orders)
      const averageOrderValue = totalNonCancelledOrders > 0 ? 
        totalEarnings / totalNonCancelledOrders : 0;
      
      setStats({
        totalEarnings,
        totalOrders: totalNonCancelledOrders,
        monthlyEarnings,
        monthlyOrders: thisMonthOrders.length,
        pendingOrders: activeOrders,
        deliveredOrders,
        cancelledOrders,
        averageOrderValue
      });
    }
  }, [restaurantOrder]);

  useEffect(() => {
    getRestaurantOrders(); 
  }, []);

  // Get current month name
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
          <ShoppingBag className="mr-2 text-orange h-8 w-8" />
          Order Management
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Track, manage, and fulfill customer orders from one central dashboard.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="bg-green-500/10 p-2 rounded-full">
                <Wallet className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="mr-1 h-4 w-4 text-green-500" />
              <div className="text-2xl font-bold">{stats.totalEarnings.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              <span>From {stats.totalOrders} orders</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{currentMonthName} Revenue</CardTitle>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="mr-1 h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold">{stats.monthlyEarnings.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <CalendarIcon className="h-3 w-3 mr-1 text-blue-500" />
              <span>This month ({stats.monthlyOrders} orders)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <div className="bg-purple-500/10 p-2 rounded-full">
                <IndianRupee className="h-4 w-4 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="mr-1 h-4 w-4 text-purple-500" />
              <div className="text-2xl font-bold">{stats.averageOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <PackageIcon className="h-3 w-3 mr-1 text-purple-500" />
              <span>Per order value</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange/5 to-orange/10 border border-orange/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Order Status</CardTitle>
              <div className="bg-orange/10 p-2 rounded-full">
                <Package2 className="h-4 w-4 text-orange" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders} / {stats.totalOrders}</div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                <span>Active orders</span>
              </div>
              <span className="text-green-500">{stats.deliveredOrders} completed</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Search orders by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full md:w-1/2 lg:w-1/3 border-gray-200"
        />
      </div>
      
      {/* Orders Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Active Orders
            {activeOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 border border-yellow-200">
                {activeOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Order History
            {completedOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 border border-green-200">
                {completedOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cancelled Orders
            {cancelledOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800 border border-red-200">
                {cancelledOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Active Orders */}
        <TabsContent value="active">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Active Orders</h2>
          
          {filteredActiveOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="bg-yellow-50 p-3 rounded-full mb-4">
                  <PackageIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <CardTitle className="text-lg mb-2">No Active Orders</CardTitle>
                <CardDescription>
                  {searchQuery ? "No active orders match your search criteria." : "You don't have any active orders at the moment."}
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredActiveOrders.map((order: Order) => {
                const cartItems: CartItem[] = order.cartItems || [];
                const totalAmount = cartItems.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 0), 0);
                const { color, icon } = getStatusBadge(order.status);

                return (
                  <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="bg-gray-50 border-b pb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">
                              Order #{order._id.substring(order._id.length - 6)}
                            </h3>
                            <Badge className={`${color} border flex items-center`}>
                              {icon}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">Total Amount</p>
                            <p className="text-lg font-bold flex items-center justify-end">
                              <IndianRupee className="h-4 w-4" />
                              {totalAmount.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            <Select
                              onValueChange={(newStatus) => handleStatusChange(order._id, newStatus)}
                              defaultValue={order.status.toLowerCase()}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="preparing">Preparing</SelectItem>
                                  <SelectItem value="outfordelivery">Out For Delivery</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOrder(order._id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 mb-2">Customer Details</h4>
                          <div className="flex items-center gap-3 mb-1">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {order.deliveryDetails.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.deliveryDetails.name}</p>
                              <p className="text-sm text-gray-500">{order.deliveryDetails.address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {cartItems.map((item: any) => (
                              <div key={item._id} className="flex items-center bg-gray-50 p-2 rounded-lg">
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-3" />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium truncate">{item.name}</h5>
                                  <div className="flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <div className="text-xs text-gray-500">
                                        <p>₹{item.price} × {item.quantity}</p>
                                        <p className="font-medium">₹{(item.price || 0) * (item.quantity || 0)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        {/* Order History */}
        <TabsContent value="completed">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order History</h2>
          
          {filteredCompletedOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="bg-green-50 p-3 rounded-full mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-lg mb-2">No Completed Orders</CardTitle>
                <CardDescription>
                  {searchQuery ? "No completed orders match your search criteria." : "You don't have any completed orders in your history yet."}
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredCompletedOrders.map((order: Order) => {
                const cartItems: CartItem[] = order.cartItems || [];
                const totalAmount = cartItems.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 0), 0);
                const { color, icon } = getStatusBadge(order.status);

                return (
                  <Card key={order._id} className="overflow-hidden border-green-100">
                    <CardHeader className="bg-green-50/40 border-b pb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">
                              Order #{order._id.substring(order._id.length - 6)}
                            </h3>
                            <Badge className={`${color} border flex items-center`}>
                              {icon}
                              Delivered
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Completed on: {order.updatedAt ? formatDate(order.updatedAt) : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Total Amount</p>
                          <p className="text-lg font-bold flex items-center justify-end">
                            <IndianRupee className="h-4 w-4" />
                            {totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 mb-2">Customer Details</h4>
                          <div className="flex items-center gap-3 mb-1">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-green-100 text-green-600">
                                {order.deliveryDetails.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.deliveryDetails.name}</p>
                              <p className="text-sm text-gray-500">{order.deliveryDetails.address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {cartItems.map((item: any) => (
                              <div key={item._id} className="flex items-center bg-gray-50 p-2 rounded-lg">
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-3" />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium truncate">{item.name}</h5>
                                  <div className="flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <div className="text-xs text-gray-500">
                                        <p>₹{item.price} × {item.quantity}</p>
                                        <p className="font-medium">₹{(item.price || 0) * (item.quantity || 0)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Cancelled Orders */}
        <TabsContent value="cancelled">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cancelled Orders</h2>
          
          {filteredCancelledOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="bg-red-50 p-3 rounded-full mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-lg mb-2">No Cancelled Orders</CardTitle>
                <CardDescription>
                  {searchQuery ? "No cancelled orders match your search criteria." : "You don't have any cancelled orders."}
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredCancelledOrders.map((order: Order) => {
                const cartItems: CartItem[] = order.cartItems || [];
                const totalAmount = cartItems.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 0), 0);
                const { color, icon } = getStatusBadge(order.status);

                return (
                  <Card key={order._id} className="overflow-hidden border-red-100">
                    <CardHeader className="bg-red-50/40 border-b pb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">
                              Order #{order._id.substring(order._id.length - 6)}
                            </h3>
                            <Badge className={`${color} border flex items-center`}>
                              {icon}
                              Cancelled
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                          </p>
                          {order.cancellationReason && (
                            <div className="mt-2 bg-red-50 p-3 rounded-md">
                              <p className="text-sm text-red-700">
                                <strong>Cancellation Reason:</strong> {order.cancellationReason}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Total Amount</p>
                          <p className="text-lg font-bold flex items-center justify-end">
                            <IndianRupee className="h-4 w-4" />
                            {totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 mb-2">Customer Details</h4>
                          <div className="flex items-center gap-3 mb-1">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-red-100 text-red-600">
                                {order.deliveryDetails.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.deliveryDetails.name}</p>
                              <p className="text-sm text-gray-500">{order.deliveryDetails.address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {cartItems.map((item: any) => (
                              <div key={item._id} className="flex items-center bg-gray-50 p-2 rounded-lg">
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md mr-3" />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium truncate">{item.name}</h5>
                                  <div className="flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center">
                                      <div className="text-xs text-gray-500">
                                        <p>₹{item.price} × {item.quantity}</p>
                                        <p className="font-medium">₹{(item.price || 0) * (item.quantity || 0)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={closeCancelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This will be shown to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cancellation Reason
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Item unavailable, Kitchen closed, Delivery issues..."
                className="min-h-[100px] resize-none border-gray-300"
              />
              {!cancelReason.trim() && (
                <p className="text-xs text-red-600 mt-1">
                  Reason is required to cancel the order
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={closeCancelDialog}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCancelOrder}
              disabled={!cancelReason.trim() || loading}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
