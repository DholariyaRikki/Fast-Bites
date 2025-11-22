import { Request, Response } from "express";
import { Restaurant } from "../models/restaurant.models";
import { Order } from "../models/order.models";
import { Offer } from "../models/offer.models";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CheckoutSessionRequest = {
    cartItems: {
        menuId: string;
        name: string;
        image: string;
        price: number;
        quantity: number
    }[],
    deliveryDetails: {
        name: string;
        email: string;
        address: string;
        city: string
    },
    restaurantId: string,
    paymentMethod: "stripe" | "cod",
    offerCode?: string
}

// Helper to parse month/year from query and build date range
const getMonthRange = (month?: string | string[], year?: string | string[]) => {
    const now = new Date();
    const m = month ? Number(Array.isArray(month) ? month[0] : month) : now.getMonth() + 1; // 1-12
    const y = year ? Number(Array.isArray(year) ? year[0] : year) : now.getFullYear();
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999); // last day of month
    return { start, end, month: m, year: y };
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        // Check if the populate parameter is true to include delivery person details
        const shouldPopulate = req.query.populate === 'true';
        
        // Use a more complete populate chain when requested
        let query = Order.find({ user: req.id }).populate('user').populate('restaurant');
        
        // If requested, also populate the acceptedBy field to get delivery person details
        if (shouldPopulate) {
            query = query.populate('acceptedBy');
        }
        
        const orders = await query;
        
        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const checkoutSessionRequest: CheckoutSessionRequest = req.body;
        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId).populate('menus');
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found."
            })
        };
        
        // Calculate subtotal from cart items
        const menuItems = restaurant.menus;
        const subtotal = checkoutSessionRequest.cartItems.reduce((total, item) => {
            const menuItem = menuItems.find((menu: any) => menu._id.toString() === item.menuId);
            if (!menuItem) return total;
            return total + ((menuItem as any).price * item.quantity);
        }, 0);
        
        // Calculate 20% delivery charge
        const deliveryCharge = Math.round(subtotal * 0.20); // 20% of subtotal, rounded
        
        // Calculate COD charge if payment method is COD
        const codCharge = checkoutSessionRequest.paymentMethod === "cod" ? Math.round(subtotal * 0.10) : 0;
        
        // Calculate discount if offer code is provided
        let discountAmount = 0;
        if (checkoutSessionRequest.offerCode) {
            // Validate offer code
            const offerValidation = await fetch(`${process.env.BACKEND_URL}/api/offer/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: checkoutSessionRequest.offerCode,
                    subtotal: subtotal
                })
            });
            
            const offerData = await offerValidation.json();
            if (offerData.success) {
                discountAmount = offerData.offer.discountAmount;
            }
        }
        
        // Calculate total amount
        const totalAmount = subtotal + deliveryCharge + codCharge - discountAmount;
        
        const order: any = new Order({
            restaurant: restaurant._id,
            user: req.id,
            deliveryDetails: checkoutSessionRequest.deliveryDetails,
            cartItems: checkoutSessionRequest.cartItems,
            subtotal: subtotal,
            deliveryCharge: deliveryCharge,
            codCharge: codCharge,
            paymentMethod: checkoutSessionRequest.paymentMethod,
            status: checkoutSessionRequest.paymentMethod === "cod" ? "confirmed" : "pending",
            offerCode: checkoutSessionRequest.offerCode,
            discountAmount: discountAmount,
            totalAmount: totalAmount,
            deliveryHistory: [{
                status: checkoutSessionRequest.paymentMethod === "cod" ? "confirmed" : "pending",
                timestamp: new Date(),
                updatedBy: req.id,
                notes: checkoutSessionRequest.paymentMethod === "cod" ? "Order confirmed with Cash on Delivery" : "Order created and pending payment"
            }]
        });

        // If payment method is Stripe, create checkout session
        if (checkoutSessionRequest.paymentMethod === "stripe") {
            // create line items including delivery charge and COD charge if applicable
            const lineItems = createLineItems(checkoutSessionRequest, menuItems, codCharge);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/order/status`,
                cancel_url: `${process.env.FRONTEND_URL}/cart`,
                metadata: {
                    orderId: order._id.toString(),
                    subtotal: subtotal.toString(),
                    deliveryCharge: deliveryCharge.toString(),
                    codCharge: codCharge.toString(),
                    discountAmount: discountAmount.toString(),
                    images: JSON.stringify(menuItems.map((item: any) => item.image))
                }
            });
            if (!session.url) {
                return res.status(400).json({ success: false, message: "Error while creating session" });
            }
            await order.save();
            return res.status(200).json({
                session
            });
        } else {
            // For COD, just save the order and return success
            await order.save();
            
            // Update offer usage count if applicable
            if (checkoutSessionRequest.offerCode) {
                await Offer.findOneAndUpdate(
                    { code: checkoutSessionRequest.offerCode.toUpperCase() },
                    { $inc: { usageCount: 1 } }
                );
            }
            
            return res.status(200).json({
                success: true,
                message: "Order confirmed with Cash on Delivery",
                orderId: order._id.toString()
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const stripeWebhook = async (req: Request, res: Response) => {
    let event;

    try {

        // Construct the payload string for verification
        const payloadString = JSON.stringify(req.body, null, 2);
        const secret = process.env.WEBHOOK_ENDPOINT_SECRET!;

        // Generate test header string for event construction
        const header = stripe.webhooks.generateTestHeaderString({
            payload: payloadString,
            secret,
        });

        // Construct the event using the payload string and header
        event = stripe.webhooks.constructEvent(payloadString, header, secret);
    } catch (error: any) {
        console.error('Webhook error:', error.message);
        return res.status(400).send(`Webhook error: ${error.message}`);
    }

    // Handle the checkout session completed event
    if (event.type === "checkout.session.completed") {
        try {
            const session = event.data.object as Stripe.Checkout.Session;
            const order = await Order.findById(session.metadata?.orderId);

            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }

            // Update the order with the amount and status
            if (session.amount_total) {
                order.totalAmount = session.amount_total / 100; // Convert from cents to actual amount
            } else {
                // If amount_total is not available, calculate from stored subtotal and delivery charge
                order.totalAmount = (order.subtotal || 0) + (order.deliveryCharge || 0);
            }
            
            order.status = "confirmed";
            
            // Add entry to delivery history with type assertion
            (order as any).deliveryHistory.push({
                status: "confirmed",
                timestamp: new Date(),
                notes: "Payment confirmed"
            });

            await order.save();
        } catch (error) {
            console.error('Error handling event:', error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    // Send a 200 response to acknowledge receipt of the event
    res.status(200).send();
};

// ================= SuperAdmin Payments: Monthly Income Aggregations =================

// GET /api/order/superadmin/payments/restaurant-monthly?month=MM&year=YYYY
// Restaurant income = sum(totalAmount) of orders with status in ["delivered","completed"(none in schema)] within month
export const superadminRestaurantMonthlyIncome = async (req: Request, res: Response) => {
    try {
        const { start, end, month, year } = getMonthRange(req.query.month as any, req.query.year as any);
        // statuses considered as paid revenue
        const statuses = ["delivered", "confirmed"]; // include confirmed due to Stripe capture, and delivered for completed orders

        const pipeline: any[] = [
            {
                $match: {
                    status: { $in: statuses },
                    createdAt: { $gte: start, $lte: end },
                }
            },
            {
                $group: {
                    _id: "$restaurant",
                    totalIncome: { $sum: { $ifNull: ["$totalAmount", { $add: [{ $ifNull: ["$subtotal", 0] }, { $ifNull: ["$deliveryCharge", 0] }] }] } },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "restaurants",
                    localField: "_id",
                    foreignField: "_id",
                    as: "restaurant"
                }
            },
            { $unwind: "$restaurant" },
            {
                $project: {
                    _id: 0,
                    restaurantId: "$restaurant._id",
                    restaurantname: "$restaurant.restaurantname",
                    city: "$restaurant.city",
                    totalIncome: { $round: ["$totalIncome", 2] },
                    orderCount: 1,
                    month,
                    year
                }
            },
            { $sort: { totalIncome: -1 } }
        ];

        const data = await Order.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            data,
            summary: {
                month,
                year,
                totalIncome: data.reduce((a: number, b: any) => a + (b.totalIncome || 0), 0),
                totalOrders: data.reduce((a: number, b: any) => a + (b.orderCount || 0), 0),
                restaurants: data.length
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /api/order/superadmin/payments/delivery-monthly?month=MM&year=YYYY
// Delivery income = deliveryCharge if present else 20% of totalAmount (or subtotal) for delivered/confirmed orders grouped by acceptedBy
export const superadminDeliveryMonthlyIncome = async (req: Request, res: Response) => {
    try {
        const { start, end, month, year } = getMonthRange(req.query.month as any, req.query.year as any);
        const statuses = ["delivered", "confirmed"];

        const pipeline: any[] = [
            {
                $match: {
                    status: { $in: statuses },
                    createdAt: { $gte: start, $lte: end },
                    acceptedBy: { $ne: null },
                }
            },
            // compute delivery earning field
            {
                $addFields: {
                    computedDeliveryIncome: {
                        $cond: [
                            { $gt: [{ $ifNull: ["$deliveryCharge", 0] }, 0] },
                            "$deliveryCharge",
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            0.20,
                                            {
                                                $ifNull: [
                                                    "$totalAmount",
                                                    { $add: [{ $ifNull: ["$subtotal", 0] }, { $ifNull: ["$deliveryCharge", 0] }] }
                                                ]
                                            }
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$acceptedBy",
                    totalIncome: { $sum: "$computedDeliveryIncome" },
                    deliveries: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    userId: "$user._id",
                    fullname: "$user.fullname",
                    email: "$user.email",
                    totalIncome: { $round: ["$totalIncome", 2] },
                    deliveries: 1,
                    month,
                    year
                }
            },
            { $sort: { totalIncome: -1 } }
        ];

        const data = await Order.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            data,
            summary: {
                month,
                year,
                totalIncome: data.reduce((a: number, b: any) => a + (b.totalIncome || 0), 0),
                totalDeliveries: data.reduce((a: number, b: any) => a + (b.deliveries || 0), 0),
                drivers: data.length
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const acceptOrderForDelivery = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        // Check if order is in "outfordelivery" status
        if (order.status !== "outfordelivery") {
            return res.status(400).json({
                success: false,
                message: "Order is not available for delivery"
            });
        }
        
        // Check if order is already accepted by someone else
        if (order.acceptedBy) {
            return res.status(400).json({
                success: false,
                message: "Order has already been accepted by another delivery person"
            });
        }
        
        // Accept the order
        order.acceptedBy = req.id as any;
        await order.save();
        return res.status(200).json({
            success: true,
            message: "Order accepted for delivery",
            order
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const createLineItems = (checkoutSessionRequest: CheckoutSessionRequest, menuItems: any, codCharge: number = 0) => {
    // 1. create line items from menu items
    const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
        const menuItem = menuItems.find((item: any) => item._id.toString() === cartItem.menuId);
        if (!menuItem) throw new Error(`Menu item id not found`);

        return {
            price_data: {
                currency: 'inr',
                product_data: {
                    name: menuItem.name,
                    images: [menuItem.image],
                },
                unit_amount: menuItem.price * 100
            },
            quantity: cartItem.quantity,
        }
    });

    // 2. calculate subtotal from all items
    const subtotal = checkoutSessionRequest.cartItems.reduce((total, item) => {
        const menuItem = menuItems.find((menu: any) => menu._id.toString() === item.menuId);
        if (!menuItem) return total;
        return total + ((menuItem as any).price * item.quantity);
    }, 0);

    // 3. calculate 20% delivery charge and add as a separate line item
    const deliveryCharge = Math.round(subtotal * 0.20); // 20% of subtotal, rounded
    
    // Add delivery charge as a separate line item
    lineItems.push({
        price_data: {
            currency: 'inr',
            product_data: {
                name: 'Delivery Charge (20%)',
                images: [],
            },
            unit_amount: deliveryCharge * 100 // Convert to cents
        },
        quantity: 1,
    });

    // 4. Add COD charge as a separate line item if applicable
    if (codCharge > 0) {
        lineItems.push({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: 'Cash on Delivery Charge (10%)',
                    images: [],
                },
                unit_amount: codCharge * 100 // Convert to cents
            },
            quantity: 1,
        });
    }
    
    // 5. return all lineItems including food items, delivery charge, and COD charge
    return lineItems;
}

export const getOrdersForDelivery = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ 
            status: { $ne: "delivered" } 
        }).populate('restaurant').populate('user');
        const filteredOrders = orders.filter(order => {
            const isOutForDelivery = order.status === "outfordelivery" && !order.acceptedBy;
            const isAcceptedByMe = order.acceptedBy && order.acceptedBy.toString() === req.id;            
            return isOutForDelivery || isAcceptedByMe;
        });
        return res.status(200).json({
            success: true,
            orders: filteredOrders
        });
    } catch (error) {
        console.error("Error in getOrdersForDelivery:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const markOrderAsDelivered = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        
        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        // Check if order is accepted by this delivery person
        if (order.acceptedBy?.toString() !== req.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to mark this order as delivered"
            });
        }
        
        // Update order status
        order.status = "delivered";
        await order.save();
        
        return res.status(200).json({
            success: true,
            message: "Order marked as delivered",
            order
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getDeliveryHistory = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ 
            status: "delivered",
            acceptedBy: req.id
        }).populate('restaurant').populate('user');
        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error("Error in getDeliveryHistory:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        
        if (!req.id) {
            console.error("User ID not found in request");
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            console.error(`Order not found with ID: ${orderId}`);
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Log the user ID and order user ID for debugging
        console.log('Request user ID:', req.id);
        console.log('Order user ID:', order.user.toString());

        // Check if the user is authorized to cancel this order
        if (order.user.toString() !== req.id) {
            console.error(`Unauthorized cancellation attempt. Request user: ${req.id}, Order user: ${order.user.toString()}`);
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this order"
            });
        }

        // Check if the order can be cancelled (only pending or confirmed orders)
        if (order.status !== "pending" && order.status !== "confirmed") {
            console.error(`Invalid order status for cancellation. Current status: ${order.status}`);
            return res.status(400).json({
                success: false,
                message: "Order cannot be cancelled at this stage"
            });
        }

        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason is required"
            });
        }

        // Update the order status to cancelled and save the reason
        order.status = "cancelled";
        order.cancellationReason = reason;
        await order.save();

        // Populate the order with related data before sending response
        const populatedOrder = await Order.findById(orderId)
            .populate('user')
            .populate('restaurant')
            .populate('acceptedBy');

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Error in cancelOrder:", error);
        console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const adminCancelOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason is required"
            });
        }
        
        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        // Check if the order can be cancelled (only pending, confirmed, or preparing orders)
        const cancellableStatuses = ["pending", "confirmed", "preparing"];
        if (!cancellableStatuses.includes(order.status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled at this stage. Current status: ${order.status}`
            });
        }
        
        // Update the order status to cancelled and save the reason
        order.status = "cancelled";
        order.cancellationReason = reason;
        await order.save();
        
        // Populate the order with related data before sending response
        const populatedOrder = await Order.findById(orderId)
            .populate('user')
            .populate('restaurant')
            .populate('acceptedBy');
        
        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully by admin",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Error in adminCancelOrder:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}