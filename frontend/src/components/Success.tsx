import { IndianRupee, CheckCircle, Clock, ShoppingBag, ArrowRight, CalendarDays, History, MapPin } from "lucide-react";
import { Separator } from "./ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useOrderStore } from "@/store/useOrderStore";
import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import Textarea from "./ui/textarea";

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

// Component for confetti effect
const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => {
        const size = Math.random() * 8 + 5;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 0.5;
        const initialRotation = Math.random() * 360;
        const color = [
          'bg-red-500', 'bg-blue-500', 'bg-green-500', 
          'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 
          'bg-orange-500'
        ][Math.floor(Math.random() * 7)];

        return (
          <div
            key={i}
            className={`absolute ${color} opacity-70 rounded-sm`}
            style={{
              width: `${size}px`,
              height: `${size * 0.4}px`,
              left: `${left}%`,
              top: '-20px',
              transform: `rotate(${initialRotation}deg)`,
              animation: `confetti ${animationDuration}s ease-in-out ${delay}s forwards`
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 20px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const Success = () => {
  const { orders, getOrderDetails, cancelOrder } = useOrderStore();
  const { clearCart, addToCart } = useCartStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [, setActiveTab] = useState("current");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

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
        quantity: item.quantity
      };
      
      // Add the item to cart the required number of times
      for (let i = 0; i < item.quantity; i++) {
        addToCart(menuItem);
      }
    });
    
    // Navigate to cart page
    navigate("/cart");
  };

  useEffect(() => {
    getOrderDetails();
    
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!orders || orders.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="font-bold text-2xl text-gray-700 dark:text-gray-300">
          Order not found!
        </h1>
      </div>
    );

  // Filter active and history orders
  const activeOrders = orders?.filter((order: { status: string; }) => 
    !["delivered", "cancelled"].includes(order.status?.toLowerCase())
  ) || [];
  
  const historyOrders = orders?.filter((order: { status: string; }) => 
    ["delivered", "cancelled"].includes(order.status?.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-7">
      {showConfetti && <Confetti />}
      
      {/* Success Header */}
      <div className="w-full max-w-5xl mb-6 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          Thank you for your order. We've received your request and will start preparing your delicious food shortly.
        </p>
      </div>
      
      {/* Main Tabs */}
      <div className="w-full max-w-5xl">
        <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger 
                value="current" 
                className="flex items-center gap-2 data-[state=active]:bg-orange/20 data-[state=active]:text-orange"
              >
                <Clock className="h-4 w-4" />
                Current Orders
                {activeOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-orange/10 text-orange border border-orange/20">
                    {activeOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-600"
              >
                <History className="h-4 w-4" />
                Order History
                {historyOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 border border-gray-200">
                    {historyOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Current Orders Tab */}
          <TabsContent value="current" className="w-full">
            <Card className="w-full border-gray-200 shadow-md mb-6">
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange" />
                    <CardTitle>Current Orders</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-orange border-orange bg-orange/10">
                    {activeOrders.length} Active
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No Active Orders</h3>
                    <p className="text-gray-500 dark:text-gray-400">You don't have any active orders at the moment.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("history")}
                    >
                      View Order History
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeOrders.map((order, index) => {
                      // Calculate amounts if not provided
                      const subtotal = order.subtotal || order.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                      const deliveryCharge = order.deliveryCharge || Math.round(subtotal * 0.20);
                      const totalAmount = order.totalAmount || (subtotal + deliveryCharge);
                      
                      return (
                        <div key={index} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 md:p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  {order.status?.toUpperCase()}
                                </Badge>
                                {(order.status === "pending" || order.status === "confirmed") && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    className="ml-2 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700"
                                    onClick={() => {
                                      setSelectedOrderId(order._id);
                                      setShowCancelDialog(true);
                                    }}
                                  >
                                    Cancel Order
                                  </Button>
                                )}

                                {/* Cancel Order Dialog */}
                                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Cancel Order</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <label htmlFor="cancelReason" className="text-sm font-medium text-gray-700 mb-2 block">
                                        Please provide a reason for cancellation:
                                      </label>
                                      <Textarea
                                        id="cancelReason"
                                        placeholder="Enter your reason for cancelling the order..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                    <DialogFooter className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setShowCancelDialog(false);
                                          setCancelReason("");
                                          setSelectedOrderId(null);
                                        }}
                                      >
                                        Keep Order
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          if (selectedOrderId) {
                                            cancelOrder(selectedOrderId, cancelReason);
                                            setShowCancelDialog(false);
                                            setCancelReason("");
                                            setSelectedOrderId(null);
                                          }
                                        }}
                                        disabled={!cancelReason.trim()}
                                      >
                                        Cancel Order
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              {order.createdAt && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  Ordered: {formatDate(order.createdAt)}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                              <div className="flex items-center text-lg font-bold text-gray-800 dark:text-gray-200">
                                <IndianRupee className="h-4 w-4" />
                                <span>{totalAmount}</span>
                              </div>
                            </div>
                          </div>
                          
                          {order.status === "outfordelivery" && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md p-3 text-blue-700 dark:text-blue-300 mb-4 text-sm">
                              {order.acceptedBy 
                                ? (
                                  <div className="flex flex-col">
                                    <p>Your order has been accepted by a delivery person and is on its way to you.</p>
                                    {/* Check if acceptedBy is populated with user details */}
                                    {typeof order.acceptedBy === 'object' && order.acceptedBy !== null && (
                                      <div className="mt-2 flex items-center gap-2 bg-white/50 p-2 rounded-md">
                                        <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-blue-600 font-bold">
                                          {(order.acceptedBy as any).fullname?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                          <p className="font-medium">{(order.acceptedBy as any).fullname || 'Delivery Person'}</p>
                                          <p className="text-xs">{(order.acceptedBy as any).contact || 'Contact information unavailable'}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) 
                                : "Your order is out for delivery and waiting to be accepted by a delivery person."}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {order.cartItems.map((item) => (
                              <div key={item._id} className="flex items-center bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-16 h-16 rounded-md object-cover"
                                />
                                <div className="ml-3 flex-1">
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200">{item.name}</h4>
                                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <span>₹{item.price} × {item.quantity}</span>
                                    <span className="font-medium">₹{item.price * item.quantity}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                              <div className="flex items-center text-gray-800 dark:text-gray-200">
                                <IndianRupee className="h-4 w-4" />
                                <span>{subtotal}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Delivery Charge (20%):</span>
                              <div className="flex items-center text-gray-800 dark:text-gray-200">
                                <IndianRupee className="h-4 w-4" />
                                <span>{deliveryCharge}</span>
                              </div>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-gray-800 dark:text-gray-200">Total:</span>
                              <div className="flex items-center text-gray-800 dark:text-gray-200">
                                <IndianRupee className="h-4 w-4" />
                                <span>{totalAmount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="mt-6">
                  <Link to="/search/all">
                    <Button className="bg-orange hover:bg-hoverOrange w-full py-6 rounded-md shadow-md flex items-center justify-center gap-2 text-lg">
                      Continue Shopping
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Order History Tab */}
          <TabsContent value="history" className="w-full">
            <Card className="w-full border-gray-200 shadow-md mb-6">
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle>Order History</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                    {historyOrders.length} Orders
                  </Badge>
                </div>
                <CardDescription className="text-gray-500 pt-2">
                  View your order history including delivered and cancelled orders
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {historyOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                      <History className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No Order History</h3>
                    <p className="text-gray-500 dark:text-gray-400">You don't have any completed orders yet.</p>
                    
                    <Link to="/search/all">
                      <Button className="mt-4 bg-orange hover:bg-hoverOrange">
                        Browse Restaurants
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {historyOrders.map((order, index) => {
                      // Calculate amounts if not provided
                      const subtotal = order.subtotal || order.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                      const deliveryCharge = order.deliveryCharge || Math.round(subtotal * 0.20);
                      const totalAmount = order.totalAmount || (subtotal + deliveryCharge);
                      
                      const isDelivered = order.status?.toLowerCase() === "delivered";
                      const isCancelled = order.status?.toLowerCase() === "cancelled";
                      
                      return (
                        <div key={index} className={`bg-white dark:bg-gray-800 border ${
                          isDelivered ? "border-green-100 dark:border-green-900/30" : 
                          isCancelled ? "border-red-100 dark:border-red-900/30" : ""
                        } rounded-lg p-4 md:p-6`}>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {order.restaurant && (
                                  <p className="text-sm text-black font-medium flex items-center gap-1 mb-1">
                                    <MapPin className="h-3 w-3 text-orange" />
                                    {order.restaurant.restaurantname}
                                  </p>
                                )}
                                {isDelivered ? (
                                  <Badge className="bg-green-100 text-green-800 border border-green-200">
                                    DELIVERED
                                  </Badge>
                                ) : isCancelled ? (
                                  <Badge className="bg-red-100 text-red-800 border border-red-200">
                                    CANCELLED
                                  </Badge>
                                ) : null}
                              </div>
                              {isCancelled && order.cancellationReason && (
                                <div className="mt-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 rounded-md p-3">
                                  <p className="text-sm text-red-700 dark:text-red-300">
                                    <strong>Cancellation Reason:</strong> {order.cancellationReason}
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center gap-4">
                                {order.updatedAt && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    Delivered: {formatDate(order.updatedAt)}
                                  </p>
                                )}
                                {order.restaurant && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Restaurant: {order.restaurant.restaurantname}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                              <div className="flex items-center text-lg font-bold text-gray-800 dark:text-gray-200">
                                <IndianRupee className="h-4 w-4" />
                                <span>{totalAmount}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {order.cartItems.map((item) => (
                              <div key={item._id} className="flex items-center bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-16 h-16 rounded-md object-cover"
                                />
                                <div className="ml-3 flex-1">
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200">{item.name}</h4>
                                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <span>₹{item.price} × {item.quantity}</span>
                                    <span className="font-medium">₹{item.price * item.quantity}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Order Again Button - Only show for delivered orders */}
                          {isDelivered && (
                            <Button 
                              className="w-full bg-orange hover:bg-hoverOrange text-white mt-4 flex items-center justify-center gap-2"
                              onClick={() => handleOrderAgain(order.cartItems)}
                            >
                              <ShoppingBag className="h-4 w-4" />
                              Order This Again
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Success;
