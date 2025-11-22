import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useUserStore } from "@/store/useUserStore";
import { CheckoutSessionRequest } from "@/types/orderType";
import { useCartStore } from "@/store/useCartStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useOrderStore } from "@/store/useOrderStore";
import { Loader2 } from "lucide-react";
import { CartItem } from "@/types/cartType";

const CheckoutConfirmPage = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { user } = useUserStore();
  const [input, setInput] = useState({
    name: user?.fullname || "",
    email: user?.email || "",
    contact: user?.contact.toString() || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cod">("stripe");
  const [offerCode, setOfferCode] = useState("");
  const [offerValidation, setOfferValidation] = useState<{
    success: boolean;
    message: string;
    discountAmount?: number;
  } | null>(null);
  const { cart, clearCart } = useCartStore();
  const { singleRestaurant } = useRestaurantStore();
  const { createCheckoutSession, loading } = useOrderStore();

  // Calculate order summary
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cashondeliveryCharge = paymentMethod === "cod" ? subtotal * 0.1 : 0;// 10% extra for COD
  const deliveryCharge = subtotal * 0.2; 
  const discountAmount = offerValidation?.discountAmount || 0;
  const totalAmount = subtotal + cashondeliveryCharge + deliveryCharge - discountAmount;
  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
  };

  const validateOfferCode = async () => {
    if (!offerCode.trim()) {
      setOfferValidation({ success: false, message: "Please enter an offer code" });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3350/api/offer/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: offerCode.trim().toUpperCase(),
          subtotal: subtotal,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOfferValidation({
          success: true,
          message: `Offer applied! You save ₹${data.offer.discountAmount}`,
          discountAmount: data.offer.discountAmount,
        });
      } else {
        setOfferValidation({ success: false, message: data.message || "Invalid offer code" });
      }
    } catch (error: any) {
      console.error("Error validating offer code:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        setOfferValidation({ success: false, message: error.response.data?.message || "Error validating offer code" });
      } else if (error.request) {
        console.error("No response from server. Please make sure the backend is running.");
        setOfferValidation({ success: false, message: "No response from server. Please make sure the backend is running." });
      } else {
        setOfferValidation({ success: false, message: error.message || "Error validating offer code" });
      }
    }
  };
  const checkoutHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Form validation
    if (!input.name.trim() || !input.address.trim() || !input.city.trim() || !input.contact.trim()) {
      alert("Please fill in all required delivery details");
      return;
    }

    // api implementation start from here
    try {
      const checkoutData: CheckoutSessionRequest = {
        cartItems: cart.map((cartItem: CartItem) => ({
          menuId: cartItem._id,
          name: cartItem.name,
          image: cartItem.image,
          price: cartItem.price.toString(),
          quantity: cartItem.quantity.toString(),
        })),
        deliveryDetails: input,
        restaurantId: singleRestaurant?._id as string,
        paymentMethod: paymentMethod,
        offerCode: offerValidation?.success ? offerCode.trim().toUpperCase() : undefined,
      };
      
      await createCheckoutSession(checkoutData);
      clearCart();
      setOfferCode("");
      setOfferValidation(null);
    } catch (error: any) {
      console.error("Checkout error:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        alert(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error("No response from server. Please make sure the backend is running.");
        alert("No response from server. Please make sure the backend is running.");
      } else {
        alert(error.message || "Error during checkout");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle className="font-semibold">Review Your Order</DialogTitle>
        <DialogDescription className="text-xs">
          Double-check your delivery details and ensure everything is in order.
          When you are ready, hit confirm button to finalize your order
        </DialogDescription>
        <form
          onSubmit={checkoutHandler}
          className="md:grid grid-cols-2 gap-2 space-y-1 md:space-y-0"
        >
          <div>
            <Label>Fullname</Label>
            <Input
              type="text"
              name="name"
              value={input.name}
              onChange={changeEventHandler}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              disabled
              type="email"
              name="email"
              value={input.email}
              onChange={changeEventHandler}
            />
          </div>
          <div>
            <Label>Contact</Label>
            <Input
              type="text"
              name="contact"
              value={input.contact}
              onChange={changeEventHandler}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              type="text"
              name="address"
              value={input.address}
              onChange={changeEventHandler}
            />
          </div>
          <div>
            <Label>City</Label>
            <Input
              type="text"
              name="city"
              value={input.city}
              onChange={changeEventHandler}
            />
          </div>
          <div>
            <Label>Country</Label>
            <Input
              type="text"
              name="country"
              value={input.country}
              onChange={changeEventHandler}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="col-span-2">
            <Label>Payment Method</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === "stripe"}
                  onChange={(e) => setPaymentMethod(e.target.value as "stripe" | "cod")}
                  className="text-orange-500"
                />
                <span>Credit/Debit Card</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value as "stripe" | "cod")}
                  className="text-orange-500"
                />
                <span>Cash on Delivery (+10% extra)</span>
              </label>
            </div>
          </div>

          {/* Offer Code Section */}
          <div className="col-span-2">
            <Label>Offer Code (Optional)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="text"
                placeholder="Enter offer code"
                value={offerCode}
                onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={validateOfferCode}>
                Apply
              </Button>
            </div>
            {offerValidation && (
              <div className={`mt-2 text-sm ${offerValidation.success ? "text-green-600" : "text-red-600"}`}>
                {offerValidation.message}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="col-span-2 border-t pt-4">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              {paymentMethod === "cod" && (
                <div className="flex justify-between text-orange-600">
                  <span>Cash on Delivery Charge (10%):</span>
                  <span>₹{cashondeliveryCharge.toFixed(2)}</span>
                </div>
              )}
              {offerValidation?.success && (
                <div className="flex justify-between text-green-600">
                  <span>Discount Applied:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="col-span-2 pt-5">
            {loading ? (
              <Button disabled className="bg-orange hover:bg-hoverOrange">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button className="bg-orange hover:bg-hoverOrange">
                {paymentMethod === "cod" ? `Confirm Order (Cash on Delivery) - ₹${totalAmount.toFixed(2)}` : "Continue To Payment"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutConfirmPage;
