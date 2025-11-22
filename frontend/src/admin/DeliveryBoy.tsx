import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useOrderStore } from "@/store/useOrderStore";
import { useUserStore } from "@/store/useUserStore";
import { Order } from "@/types/orderType";
import { IndianRupee, CalendarIcon, PackageIcon, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DeliveryBoy = () => {
  const { deliveryOrders, getDeliveryOrders, acceptOrderForDelivery, markOrderAsDelivered } = useOrderStore();
  const { user } = useUserStore();
  const [refreshData, setRefreshData] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalOrders: 0,
    monthlyEarnings: 0,
    monthlyOrders: 0
  });

  useEffect(() => {
    if (user) {
      getDeliveryOrders();
    }
  }, [getDeliveryOrders, user, refreshData]);

  // Calculate statistics when delivery orders change
  useEffect(() => {
    if (deliveryOrders.length > 0 && user) {
      let userIdValue = user.id || (user as any)._id;
      if (!userIdValue) return;
      
      const userIdString = String(userIdValue);
      
      // Filter completed deliveries by this user
      const completedDeliveries = deliveryOrders.filter(order => 
        order.status === "delivered" && 
        order.acceptedBy && 
        String(order.acceptedBy) === userIdString
      );
      
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate total earnings (sum of all delivery charges)
      const totalEarnings = completedDeliveries.reduce((sum, order) => {
        // Calculate delivery charge as 20% of subtotal
        let subtotal = order.subtotal || 0;
        if (subtotal === 0 && order.cartItems) {
          subtotal = order.cartItems.reduce((acc: number, item: any) => {
            return acc + (item.price * item.quantity);
          }, 0);
        }
        
        const deliveryCharge = order.deliveryCharge || Math.round(subtotal * 0.20);
        return sum + deliveryCharge;
      }, 0);
      
      // Filter for orders completed this month
      const thisMonthDeliveries = completedDeliveries.filter(order => {
        const deliveryDate = order.createdAt ? new Date(order.createdAt) : null;
        return deliveryDate && 
          deliveryDate.getMonth() === currentMonth && 
          deliveryDate.getFullYear() === currentYear;
      });
      
      // Calculate this month's earnings
      const monthlyEarnings = thisMonthDeliveries.reduce((sum, order) => {
        // Calculate delivery charge as 20% of subtotal
        let subtotal: number = order.subtotal || 0;
        if (subtotal === 0 && order.cartItems) {
          subtotal = order.cartItems.reduce((acc: number, item: any) => {
            return acc + (item.price * item.quantity);
          }, 0);
        }
        
        const deliveryCharge = order.deliveryCharge || Math.round(subtotal * 0.20);
        return sum + deliveryCharge;
      }, 0);
      
      setStats({
        totalEarnings,
        totalOrders: completedDeliveries.length,
        monthlyEarnings,
        monthlyOrders: thisMonthDeliveries.length
      });
    }
  }, [deliveryOrders, user]);

  const handleStatusChange = async (orderId: string) => {
    try {
      await markOrderAsDelivered(orderId);
      setRefreshData(prev => !prev); // Refresh the order list
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrderForDelivery(orderId);
      // Force a refresh of all orders after accepting
      setTimeout(() => {
        getDeliveryOrders();
      }, 500);
    } catch (error) {
      console.error("Failed to accept order:", error);
    }
  };

  // Filter orders for the available tab (not accepted by anyone)
  const availableOrders = deliveryOrders.filter(order => 
    // Only show outfordelivery orders that are not yet accepted
    order.status === "outfordelivery" && !order.acceptedBy
  );
  
  // Filter orders for the my deliveries tab (accepted by current user but not delivered)
  const myDeliveries = deliveryOrders.filter(order => {
    if (!user) return false;
    
    // Try to find user ID - backend may use different property names
    let userIdValue = null;
    
    // Check various possible id properties
    if (user.id) userIdValue = user.id;
    if ((user as any)._id) userIdValue = (user as any)._id;
    
    if (!userIdValue) {
      console.error("Could not find any ID property on user object:", user);
      return false;
    }
    
    // Only show orders that:
    // 1. Have been accepted by the current user
    // 2. Are not in "delivered" status
    
    // If order has no acceptedBy, it's not accepted by anyone
    if (!order.acceptedBy) return false;
    
    // If order is delivered, don't show it
    if (order.status === "delivered") return false;
    
    // Convert both to strings for comparison
    const acceptedByString = String(order.acceptedBy);
    const userIdString = String(userIdValue);    
    return acceptedByString === userIdString;
  });

  // Filter orders for delivery history tab (delivered orders by current user)
  const deliveryHistory = deliveryOrders.filter(order => {
    if (!user) return false;
    
    // Try to find user ID - backend may use different property names
    let userIdValue = null;
    
    // Check various possible id properties
    if (user.id) userIdValue = user.id;
    if ((user as any)._id) userIdValue = (user as any)._id;
    
    if (!userIdValue) return false;
    
    // Only show orders that:
    // 1. Have been accepted by the current user
    // 2. Are in "delivered" status
    
    // If order has no acceptedBy, it's not accepted by anyone
    if (!order.acceptedBy) return false;
    
    // Only show delivered orders
    if (order.status !== "delivered") return false;
    
    // Convert both to strings for comparison
    const acceptedByString = String(order.acceptedBy);
    const userIdString = String(userIdValue);
    
    return acceptedByString === userIdString;
  });
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-5">Delivery Dashboard</h1>
      
      {user ? (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <Wallet className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <IndianRupee className="mr-1 h-4 w-4 text-green-500" />
                  <div className="text-2xl font-bold">{stats.totalEarnings}</div>
                </div>
                <p className="text-xs text-gray-500">From {stats.totalOrders} delivered orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{currentMonthName} Earnings</CardTitle>
                <CalendarIcon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <IndianRupee className="mr-1 h-4 w-4 text-green-500" />
                  <div className="text-2xl font-bold">{stats.monthlyEarnings}</div>
                </div>
                <p className="text-xs text-gray-500">From {stats.monthlyOrders} orders this month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                <PackageIcon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-gray-500">Completed deliveries</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Available Orders</CardTitle>
                <PackageIcon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableOrders.length}</div>
                <p className="text-xs text-gray-500">Ready for pickup</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Custom Tabs */}
          <div className="mb-8">
            <div className="flex border-b border-gray-200">
              <button
                className={`py-2 px-4 font-medium text-lg ${activeTab === 'available' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('available')}
              >
                Available Orders {availableOrders.length > 0 && `(${availableOrders.length})`}
              </button>
              <button
                className={`py-2 px-4 font-medium text-lg ${activeTab === 'mydeliveries' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('mydeliveries')}
              >
                My Deliveries {myDeliveries.length > 0 && `(${myDeliveries.length})`}
              </button>
              <button
                className={`py-2 px-4 font-medium text-lg ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('history')}
              >
                Delivery History {deliveryHistory.length > 0 && `(${deliveryHistory.length})`}
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div>
            {activeTab === 'available' && (
              <OrdersTable 
                orders={availableOrders}
                showAvailable={true}
                handleAcceptOrder={handleAcceptOrder}
              />
            )}
            
            {activeTab === 'mydeliveries' && (
              <OrdersTable 
                orders={myDeliveries}
                showAvailable={false}
                handleStatusChange={handleStatusChange}
              />
            )}
            
            {activeTab === 'history' && (
              <OrdersTable 
                orders={deliveryHistory}
                showAvailable={false}
                showHistory={true}
              />
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-10">
          <p className="text-xl text-red-500">Please login to access the delivery dashboard</p>
        </div>
      )}
    </div>
  );
};

// Component for displaying orders in a table
const OrdersTable = ({ 
  orders, 
  showAvailable,
  showHistory = false,
  handleAcceptOrder,
  handleStatusChange
}: { 
  orders: Order[], 
  showAvailable: boolean,
  showHistory?: boolean,
  handleAcceptOrder?: (orderId: string) => Promise<void>,
  handleStatusChange?: (orderId: string) => Promise<void>
}) => {
  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    // Format as "MMM dd, yyyy HH:mm"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  };

  // Calculate totals for the summary
  const totalSubtotal = orders.reduce((total, order) => {
    const subtotal = order.subtotal || order.cartItems.reduce((acc: number, item: any) => {
      return acc + (item.price * item.quantity);
    }, 0);
    return total + subtotal;
  }, 0);
  
  const totalDeliveryCharge = orders.reduce((total, order) => {
    let subtotal = order.subtotal || 0;
    if (subtotal === 0 && order.cartItems) {
      subtotal = order.cartItems.reduce((acc: number, item: any) => {
        return acc + (item.price * item.quantity);
      }, 0);
    }
    const deliveryCharge = order.deliveryCharge || Math.round(subtotal * 0.20);
    return total + deliveryCharge;
  }, 0);
  
  const grandTotal = totalSubtotal + totalDeliveryCharge;

  if (orders.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-lg text-gray-600">
          {showAvailable 
            ? "No orders available for delivery at the moment" 
            : showHistory
              ? "You haven't completed any deliveries yet"
              : "You haven't accepted any orders yet"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Menu Image</TableCell>
            <TableCell>Customer Name</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>City</TableCell>
            <TableCell>Restaurant Name</TableCell>
            <TableCell>Restaurant City</TableCell>
            <TableCell>Subtotal</TableCell>
            <TableCell>Delivery (20%)</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            {showHistory && <TableCell>Delivery Date</TableCell>}
            {!showHistory && (
              <TableCell>Action</TableCell>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: Order) => {
            // Calculate the subtotal, delivery charge and total
            const calculatedSubtotal = order.subtotal || order.cartItems.reduce((acc: number, item: any) => {
              return acc + (item.price * item.quantity);
            }, 0);
            
            const calculatedDeliveryCharge = order.deliveryCharge || Math.round(calculatedSubtotal * 0.20);
            
            const calculatedTotal = order.totalAmount || (calculatedSubtotal + calculatedDeliveryCharge);
            
            // Find the delivery timestamp for delivered orders
            let deliveryDate = order.createdAt;
            if (showHistory && order.deliveryHistory && order.deliveryHistory.length > 0) {
              // Look for the 'delivered' entry in history
              const deliveredEntry = order.deliveryHistory.find(entry => 
                entry.status && entry.status.toLowerCase() === 'delivered');
              
              if (deliveredEntry && deliveredEntry.timestamp) {
                // Convert to string if it's a Date object
                deliveryDate = deliveredEntry.timestamp instanceof Date 
                  ? deliveredEntry.timestamp.toISOString() 
                  : deliveredEntry.timestamp as string;
              }
            }
            
            return (
              <TableRow key={order._id}>
                <TableCell>
                  <img 
                    src={order.cartItems[0]?.image}
                    alt={order.cartItems[0]?.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </TableCell>
                <TableCell>{order.deliveryDetails.name}</TableCell>
                <TableCell>{order.deliveryDetails.address}</TableCell>
                <TableCell>{order.deliveryDetails.city}</TableCell>
                <TableCell>{order.restaurant?.restaurantname || "N/A"}</TableCell>
                <TableCell>{order.restaurant?.city || "N/A"}</TableCell>
                <TableCell>₹{calculatedSubtotal}</TableCell>
                <TableCell>₹{calculatedDeliveryCharge}</TableCell>
                <TableCell className="font-bold">₹{calculatedTotal}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    order.status === "delivered" 
                      ? "bg-green-100 text-green-800" 
                      : order.status === "outfordelivery" 
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                  }`}>
                    {order.status === "outfordelivery" ? "Out For Delivery" : 
                     order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </TableCell>
                {showHistory && (
                  <TableCell>{formatDate(deliveryDate as string)}</TableCell>
                )}
                {!showHistory && (
                  <TableCell>
                    {showAvailable ? (
                      <button 
                        onClick={() => handleAcceptOrder && handleAcceptOrder(order._id)} 
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Accept Order
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange && handleStatusChange(order._id)} 
                        className="bg-green-500 text-white px-4 py-2 rounded"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Summary Section - Only show this for the history tab */}
      {showHistory && orders.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Earnings Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Total Food Value</p>
              <p className="text-2xl font-bold flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {totalSubtotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Your Earnings (20%)</p>
              <p className="text-2xl font-bold text-green-600 flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {totalDeliveryCharge.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Total Order Value</p>
              <p className="text-2xl font-bold flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {grandTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryBoy; 