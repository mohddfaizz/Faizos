const express = require("express");
const customerRouter = express.Router();

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const DeliveryAddress = require("../models/DeliveryAddress");
const bcrypt = require("bcrypt");
const { userAuth } = require("../middlewares/auth");

// Customer Registration
/**
 * @swagger
 * /api/customer/register:
 *   post:
 *     summary: Register a new customer
 *     description: This endpoint is used to register a new customer to the system.
 *     tags: ["Customer"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Mohd
 *               lastName:
 *                 type: string
 *                 example: Faiz
 *               emailId:
 *                 type: string
 *                 format: email
 *                 example: mohdfaiz@example.com
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *               role:
 *                 type: string
 *                 enum: [customer]
 *                 example: customer
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *     responses:
 *       200:
 *         description: Customer successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Customer registered successfully!"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Invalid data or missing required fields"
 */
customerRouter.post("/register", async (req, res) => {
    try {
        validateSignUpData(req);

        const { firstName, lastName, emailId, password, role, gender } = req.body;
        if (role !== "customer") {
            throw new Error("Invalid role");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            role,
            gender
        });
        const savedUser = await user.save();
        const token = await savedUser.getJWT();
        res.cookie("token", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        res.json({ message: "Customer registered successfully!", data: savedUser });
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

// Customer Login
/**
 * @swagger
 * /api/customer/login:
 *   post:
 *     summary: Customer login
 *     description: This endpoint is used for customer login and returns a JWT token.
 *     tags: ["Customer"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *                 example: mohdfaiz@example.com
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *     responses:
 *       200:
 *         description: Customer logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials or account status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Invalid credentials"
 */
customerRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId });
        if (!user || user.role !== "customer" || user.status !== "active") {
            throw new Error("Invalid credentials or inactive account");
        }

        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        const token = await user.getJWT();
        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000),
        });

        res.json(user);
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

// Add Delivery Address
// customerRouter.post('/users/:userId/delivery-addresses', userAuth, async (req, res) => {
//     try {
//         const user = await User.findById(req.params.userId);
//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const newAddress = new DeliveryAddress({
//             userId: user._id,
//             ...req.body
//         });

//         if (!newAddress.firstName || !newAddress.lastName || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.country || !newAddress.postalCode) {
//             return res.status(400).json({ error: 'Missing required fields' });
//         }

//         await newAddress.save();
//         res.status(201).json({ message: 'Delivery address added successfully', address: newAddress });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// Add Delivery Address
/**
 * @swagger
 * /api/customer/users/{userId}/delivery-addresses:
 *   post:
 *     summary: Add a new delivery address
 *     description: This endpoint is used to add a new delivery address for a customer.
 *     tags: ["Customer"]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The unique identifier of the customer
 *         schema:
 *           type: string
 *           example: 60d5ecf441f3c7a27f4f4d45
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Mohd
 *               lastName:
 *                 type: string
 *                 example: Faiz
 *               addressLine1:
 *                 type: string
 *                 example: "Laxmi Nagar"
 *               addressLine2:
 *                 type: string
 *                 example: "Block D, Flat 3"
 *               city:
 *                 type: string
 *                 example: "Delhi"
 *               state:
 *                 type: string
 *                 example: "Delhi"
 *               country:
 *                 type: string
 *                 example: "India"
 *               postalCode:
 *                 type: string
 *                 example: "110031"
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Delivery address added successfully"
 *                 address:
 *                   $ref: '#/components/schemas/DeliveryAddress'
 *       400:
 *         description: Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Missing required field: city"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Failed to save address"
 */
customerRouter.post('/users/:userId/delivery-addresses', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const requiredFields = ["firstName", "lastName", "addressLine1", "city", "state", "country", "postalCode"];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        const { isDefault } = req.body;

        if (isDefault) {
            // Ensure only one default address per user
            await DeliveryAddress.updateMany(
                { userId: user._id, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = new DeliveryAddress({
            userId: user._id,
            ...req.body,
        });

        await newAddress.save();
        res.status(201).json({ message: 'Delivery address added successfully', address: newAddress });
    } catch (error) {
        console.error("Error saving delivery address:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Delivery Address

/**
 * @swagger
 * /api/customer/users/{userId}/delivery-addresses/{addressId}:
 *   put:
 *     summary: Update an existing delivery address
 *     description: This endpoint is used to update an existing delivery address for a customer.
 *     tags: ["Customer"]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The unique identifier of the customer
 *         schema:
 *           type: string
 *           example: 60d5ecf441f3c7a27f4f4d45
 *       - name: addressId
 *         in: path
 *         required: true
 *         description: The unique identifier of the address
 *         schema:
 *           type: string
 *           example: 60d7c87b7393f7d6d0a56d97
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Mohd
 *               lastName:
 *                 type: string
 *                 example: Faiz
 *               addressLine1:
 *                 type: string
 *                 example: "Laxmi Nagar"
 *               addressLine2:
 *                 type: string
 *                 example: "Flat 3, Block C"
 *               city:
 *                 type: string
 *                 example: "Delhi"
 *               state:
 *                 type: string
 *                 example: "Delhi"
 *               country:
 *                 type: string
 *                 example: "India"
 *               postalCode:
 *                 type: string
 *                 example: "110031"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Address updated successfully"
 *                 address:
 *                   $ref: '#/components/schemas/DeliveryAddress'
 *       404:
 *         description: User or address not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Address not found"
 *       500:
 *         description: Failed to update address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Internal server error"
 */
customerRouter.put('/users/:userId/delivery-addresses/:addressId', userAuth, async (req, res) => {
    try {
        const { userId, addressId } = req.params;
        const updatedData = { ...req.body };

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const address = await DeliveryAddress.findOne({ _id: addressId, userId: user._id });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Reset other default addresses if needed
        if (updatedData.isDefault) {
            await DeliveryAddress.updateMany(
                { userId: user._id, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        // Update the address
        Object.assign(address, updatedData);
        const savedAddress = await address.save();

        res.status(200).json({ message: 'Address updated successfully', address: savedAddress });
    } catch (error) {
        console.error('Error updating delivery address:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Delete Delivery Address
/**
 * @swagger
 * /api/customer/users/{userId}/delivery-addresses/{addressId}:
 *   delete:
 *     summary: Delete a delivery address
 *     description: This endpoint is used to delete an existing delivery address for a customer.
 *     tags: ["Customer"]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The unique identifier of the customer
 *         schema:
 *           type: string
 *           example: 60d5ecf441f3c7a27f4f4d45
 *       - name: addressId
 *         in: path
 *         required: true
 *         description: The unique identifier of the address to be deleted
 *         schema:
 *           type: string
 *           example: 60d7c87b7393f7d6d0a56d97
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Delivery address deleted successfully"
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Address not found"
 */
customerRouter.delete('/users/:userId/delivery-addresses/:addressId', userAuth, async (req, res) => {
    try {
        const { userId, addressId } = req.params;

        const address = await DeliveryAddress.findOneAndDelete({ _id: addressId, userId });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json({ message: 'Delivery address deleted successfully' });
    } catch (error) {
        console.error("Error deleting delivery address:", error);
        res.status(500).json({ error: 'Failed to delete delivery address' });
    }
});


// Logout
/**
 * @swagger
 * /api/customer/logout:
 *   post:
 *     summary: Logout customer
 *     description: This endpoint is used for logging out a customer and clearing the authentication token.
 *     tags: ["Customer"]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful!"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Failed to log out"
 */
customerRouter.post("/logout", userAuth, (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
    });
    res.send("Logout successful!");
});

// Browse Restaurants
/**
 * @swagger
 * /api/customer/restaurants:
 *   get:
 *     summary: List all restaurants
 *     description: This endpoint retrieves all available restaurants.
 *     tags: ["Customer"]
 *     responses:
 *       200:
 *         description: List of restaurants successfully fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Failed to fetch restaurants"
 */
customerRouter.get("/restaurants", userAuth, async (req, res) => {
    try {
        const restaurants = await Restaurant.find({});
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});

// Search Menus
/**
 * @swagger
 * /api/customer/restaurants/search:
 *   get:
 *     summary: Search restaurants by menu or type
 *     description: This endpoint searches restaurants based on menu item name or restaurant type.
 *     tags: ["Customer"]
 *     parameters:
 *       - name: query
 *         in: query
 *         required: false
 *         description: Search query for menu item name or restaurant type
 *         schema:
 *           type: string
 *           example: "Pizza"
 *       - name: filter
 *         in: query
 *         required: false
 *         description: Filter restaurants based on type (e.g., fast food, fine dining)
 *         schema:
 *           type: string
 *           example: "Italian"
 *     responses:
 *       200:
 *         description: List of restaurants based on search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Failed to search restaurants"
 */
customerRouter.get("/restaurants/search", userAuth, async (req, res) => {
    try {
        const { query, filter } = req.query;
        const searchCriteria = { 
            $or: [
                { "menuItems.name": { $regex: query, $options: "i" } },
                { type: { $regex: filter, $options: "i" } }
            ]
        };

        const restaurants = await Restaurant.find(searchCriteria);
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: "Failed to search menus" });
    }
});

// Place an Order
// customerRouter.post("/orders", userAuth, async (req, res) => {
//     try {
//         const { restaurantId, items, deliveryAddressId } = req.body;

//         const newOrder = new Order({
//             userId: req.user._id,
//             restaurantId,
//             items,
//             deliveryAddressId,
//             status: "preparing"
//         });

//         const savedOrder = await newOrder.save();
//         res.status(201).json({ message: "Order placed successfully", order: savedOrder });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to place order" });
        
        
        
//     }
// });

/**
 * @swagger
 * /api/customer/orders:
 *   post:
 *     summary: Place a new order
 *     description: This endpoint allows customers to place a new order.
 *     tags: ["Customer"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 example: "60d7c87b7393f7d6d0a56d88"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       example: "60d7c87b7393f7d6d0a56d89"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               deliveryAddressId:
 *                 type: string
 *                 example: "60d7c87b7393f7d6d0a56d97"
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order placed successfully"
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Missing or invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Missing required fields"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Failed to place order"
 */
customerRouter.post("/orders", userAuth, async (req, res) => {
    try {
        console.log(req.body); // Check the received request body
        const { restaurantId, items, deliveryAddressId } = req.body;

        const newOrder = new Order({
            userId: req.user._id,
            restaurantId,
            items,
            deliveryAddressId,
            status: "preparing"
        });

        const savedOrder = await newOrder.save();
        res.status(201).json({ message: "Order placed successfully", order: savedOrder });
    } catch (error) {
        console.error(error); // Log the detailed error
        res.status(500).json({ error: "Failed to place order", details: error.message });
    }
});


// Track Orders
/**
 * @swagger
 * /api/customer/orders/{orderId}/track:
 *   get:
 *     summary: Track an order's status
 *     description: This endpoint tracks the status of an order.
 *     tags: ["Customer"]
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: The unique identifier of the order to track
 *         schema:
 *           type: string
 *           example: "60d7c87b7393f7d6d0a56d97"
 *     responses:
 *       200:
 *         description: Successfully fetched the order's status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Preparing"
 *       404:
 *         description: Order not found or unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Order not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Failed to fetch order status"
 */
customerRouter.get("/orders/:orderId/track", userAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order || order.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json({ status: order.status });
    } catch (error) {
        res.status(500).json({ error: "Failed to track order" });
    }
});

// View Order History
/**
 * @swagger
 * /api/customer/orders/history:
 *   get:
 *     summary: View order history
 *     description: This endpoint retrieves the order history for the customer.
 *     tags: ["Customer"]
 *     responses:
 *       200:
 *         description: Successfully fetched order history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Failed to fetch order history"
 */
customerRouter.get("/orders/history", userAuth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch order history" });
    }
});

module.exports = customerRouter;
