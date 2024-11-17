const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Menu = require("../models/Menu");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const OrderItems = require("../models/OrderItem");
const { userAuth } = require("../middlewares/auth");
const restaurantRouter = express.Router();

async function isAdminOrRestaurant (userId) {
    try {
        if (!userId) {
            throw new Error("User ID not found in the request");
        }
        const user = await User.findById(userId);
        if (!user || (user.role !== "admin" && user.role !== "restaurant")) {
            throw new Error("Invalid Authorization");
        }
    }
    catch (err) {
        throw new Error(err);
    }
}

/**
 * @swagger
 * /api/restaurant/register:
 *   post:
 *     tags: ["Restaurant"]
 *     summary: Register a new restaurant
 *     description: Registers a new restaurant with the provided data.
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
 *                 example: Faiz.7860
 *               role:
 *                 type: string
 *                 enum: [restaurant]
 *                 example: restaurant
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               restaurantName:
 *                 type: string
 *                 example: "Pizza Hub"
 *               address:
 *                 type: string
 *                 example: "Laxmi Nagar, Delhi - 110031"
 *               cuisineType:
 *                 type: string
 *                 example: "Italian"
 *               openingHours:
 *                 type: string
 *                 example: "10 AM - 10 PM"
 *               deliveryZone:
 *                 type: string
 *                 example: "North Delhi"
 *     responses:
 *       200:
 *         description: Restaurant successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Customer Data added successfully!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     restaurant:
 *                       $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Validation or data error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : <error message>"
 */
restaurantRouter.post("/register", async (req, res) => {
    try {
        // Validation of data
        validateSignUpData(req);
        const { firstName, lastName, emailId, password, role, gender, restaurantName, address, cuisineType, openingHours, deliveryZone } = req.body;
        if (role !== "restaurant") {
            throw new Error("Invalid role");
        }

        // Encrypt the password
        const passwordHash = await bcrypt.hash(password, 10);
        console.log(passwordHash);

        //   Creating a new instance of the User model
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            role,
            gender
        });
        const savedUser = await user.save();
        const restaurant = new Restaurant({
            owner: savedUser._id,
            restaurantName,
            address,
            cuisineType,
            openingHours,
            deliveryZone
        })
        const savedRestaurant = await restaurant.save()
        // const savedUser = await user.save();
        const token = await savedUser.getJWT();
        res.cookie("token", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const response = { user: savedUser, restaurant: savedRestaurant};
        res.json({ message: "Customer Data added successfully!", data: response});
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/register/{userId}:
 *   post:
 *     tags: ["Restaurant"]
 *     summary: Register a restaurant under an existing user
 *     description: Registers a restaurant for a user with the specified user ID.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the user creating the restaurant
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurantName:
 *                 type: string
 *                 example: "Pizza Hub"
 *               address:
 *                 type: string
 *                 example: "Laxmi Nagar, Delhi - 110031"
 *               cuisineType:
 *                 type: string
 *                 example: "Italian"
 *               openingHours:
 *                 type: string
 *                 example: "10 AM - 10 PM"
 *               deliveryZone:
 *                 type: string
 *                 example: "North Delhi"
 *     responses:
 *       200:
 *         description: Restaurant successfully registered under user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Restaurant added successfully!"
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Invalid Authorization or Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : <error message>"
 */
restaurantRouter.post("/register/:userId", async (req, res) => {
    try {
        // Validation of data\
        const { restaurantName, address, cuisineType, openingHours, deliveryZone } = req.body;
        isAdminOrRestaurant(req.params.userId);

        const restaurant = new Restaurant({
            owner: req.params.userId,
            restaurantName,
            address,
            cuisineType,
            openingHours,
            deliveryZone
        })
        const savedRestaurant = await restaurant.save()

        res.json({ message: "Restaurant added successfully!", data: savedRestaurant});
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/login:
 *   post:
 *     tags: ["Restaurant"]
 *     summary: Restaurant login
 *     description: Login for restaurant users with their credentials.
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
 *                 example: Faiz.7860
 *     responses:
 *       200:
 *         description: Successful login
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
 *         description: Invalid credentials or inactive account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : Invalid credentials"
 */
restaurantRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("Invalid credentials");
        }
        if (user.role !== "restaurant") {
            throw new Error("Invalid role");
        }
        if (user.status !== "active") {
            throw new Error("Customer account is not active");
        }
        const isPasswordValid = await user.validatePassword(password);

        if (isPasswordValid) {
            const token = await user.getJWT();

            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000),
            });
            
            res.send(user);
        } else {
            throw new Error("Invalid credentials");
        }
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/{userId}:
 *   get:
 *     tags: ["Restaurant"]
 *     summary: Get restaurant details by user ID
 *     description: Fetch restaurant details based on the owner’s user ID.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User ID of the restaurant owner
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Restaurant Found!!!"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Unauthorized or Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR : <error message>"
 */
restaurantRouter.get("/:userId", userAuth, async (req, res) => {
    try {
        isAdminOrRestaurant(req.params.userId);
        const restaurant = await Restaurant.find( {owner: req.params.userId} );
        res.json({ message: "Restaurant Found !!!", data: restaurant });
    }
    catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/{restaurantId}:
 *   patch:
 *     tags: ["Restaurant"]
 *     summary: Update restaurant details
 *     description: Updates specific details of an existing restaurant.
 *     parameters:
 *       - name: restaurantId
 *         in: path
 *         required: true
 *         description: The ID of the restaurant to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "605c72ef1532075ab5c7dbd"
 *               restaurantName:
 *                 type: string
 *                 example: "New Pizza Hub"
 *               address:
 *                 type: string
 *                 example: "Sector 15, Noida"
 *               cuisineType:
 *                 type: string
 *                 example: "Mexican"
 *               openingHours:
 *                 type: string
 *                 example: "9 AM - 11 PM"
 *               deliveryZone:
 *                 type: string
 *                 example: "South Noida"
 *     responses:
 *       200:
 *         description: Restaurant details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Validation error or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error updating restaurant details"
 */
restaurantRouter.patch("/:restaurantId", userAuth, async (req, res) => {
    try {
        // Extract only the allowed fields from the request body
        const { userId, restaurantName, address, cuisineType, openingHours, deliveryZone } = req.body;
        isAdminOrRestaurant(userId);
        // Prepare an update object with only the permitted fields
        const updateData = {};
        if (restaurantName) updateData['restaurantName'] = restaurantName;
        if (address) updateData['address'] = address;
        if (cuisineType) updateData['cuisineType'] = cuisineType;
        if (openingHours) updateData['openingHours'] = openingHours;
        if (deliveryZone) updateData['deliveryZone'] = deliveryZone;

        // Update the user with the filtered data
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.restaurantId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedRestaurant) {
            return res.status(404).json({ message: 'Restaurent Details not found' });
        }

        res.json(updatedRestaurant);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error });
    }
});


/**
 * @swagger
 * /api/restaurant/menu/{userId}/{restaurantId}:
 *   get:
 *     tags: ["Restaurant"]
 *     summary: Get menu items for a specific restaurant
 *     description: Retrieves all menu items for a restaurant based on the restaurant ID.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The user ID of the restaurant owner
 *         schema:
 *           type: string
 *       - name: restaurantId
 *         in: path
 *         required: true
 *         description: The ID of the restaurant whose menu is to be fetched
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of menu items for the restaurant
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Invalid user or restaurant ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ERROR : Menu not found"
 */
restaurantRouter.get("/menu/:userId/:restaurantId", userAuth, async (req, res) => {
    try {
        isAdminOrRestaurant(req.params.userId);
        const menu = await Menu.find( {restaurant: req.params.restaurantId} );
        res.json({ message: "List of all items in Menu", data: menu });
    }
    catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/item/{userId}:
 *   post:
 *     tags: ["Restaurant"]
 *     summary: Add a new item to the restaurant's menu
 *     description: Allows restaurant owners to add new items to their menu.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The ID of the restaurant owner
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurant:
 *                 type: string
 *                 example: "605c72ef1532075ab5c7dbd"
 *               itemName:
 *                 type: string
 *                 example: "Vegetarian Pizza"
 *               description:
 *                 type: string
 *                 example: "A delicious pizza with fresh vegetables"
 *               price:
 *                 type: number
 *                 example: 15.99
 *               availability:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Item added to the menu successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ERROR : Invalid data"
 */
restaurantRouter.post("/item/:userId", userAuth, async (req, res) => {
    try {
        const { restaurant ,itemName, description, price, availability } = req.body;
        isAdminOrRestaurant(req.params.userId);
        const menu = new Menu({
            restaurant,
            itemName,
            description,
            price,
            availability
        });
        await menu.save();
        res.status(201).json({ message: 'Item added Successfully!!!', data: menu });

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/item/{itemId}:
 *   patch:
 *     tags: ["Restaurant"]
 *     summary: Update a menu item
 *     description: Updates the details of a specific menu item.
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         description: The ID of the menu item to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "605c72ef1532075ab5c7dbd"
 *               itemName:
 *                 type: string
 *                 example: "New Vegetarian Pizza"
 *               description:
 *                 type: string
 *                 example: "A healthier version of vegetarian pizza"
 *               price:
 *                 type: number
 *                 example: 17.99
 *               availability:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Invalid or missing data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ERROR : Item not found"
 */
restaurantRouter.patch("/item/:itemId", userAuth, async (req, res) => {
    try {
        // Extract only the allowed fields from the request body
        const { userId, itemName, description, price, availability  } = req.body;
        isAdminOrRestaurant(userId);
        // Prepare an update object with only the permitted fields
        const updateData = {};
        if (itemName) updateData['itemName'] = itemName;
        if (description) updateData['description'] = description;
        if (price) updateData['price'] = price;
        if (availability) updateData['availability'] = availability;

        
        // Update the user with the filtered data
        const updatedMenuItem = await Menu.findByIdAndUpdate(
            req.params.itemId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedMenuItem) {
            return res.status(404).json({ message: 'MenuItem not found' });
        }

        res.json(updatedMenuItem);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error });
    }
});

/**
 * @swagger
 * /api/restaurant/item/{userId}/{menuItemId}:
 *   delete:
 *     tags: ["Restaurant"]
 *     summary: Delete a menu item
 *     description: Removes a specific item from the restaurant's menu.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The user ID of the restaurant owner
 *         schema:
 *           type: string
 *       - name: menuItemId
 *         in: path
 *         required: true
 *         description: The ID of the menu item to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Menu Item Deleted Successfully"
 *       400:
 *         description: Invalid request or item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ERROR : Menu Item not found"
 */
restaurantRouter.delete("/item/:userId/:menuItemId", userAuth, async (req, res) => {

    try {
        isAdminOrRestaurant(req.params.userId);
        const menuItem = await Menu.findById(req.params.menuItemId);
        if (!menuItem) {
            throw new Error("Menu Item not found to Delete!!!");
        }
        Menu.deleteOne(menuItem);
        res.status(201).json({ message: 'Menu Item Deleted Successfully!!!'});
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/orders/{userId}/{restaurantId}/{status}:
 *   get:
 *     tags: ["Restaurant"]
 *     summary: Get orders by status for a restaurant
 *     description: Retrieves orders with a specific status for a restaurant.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: The user ID of the restaurant owner
 *         schema:
 *           type: string
 *       - name: restaurantId
 *         in: path
 *         required: true
 *         description: The restaurant ID
 *         schema:
 *           type: string
 *       - name: status
 *         in: path
 *         required: true
 *         description: The status of the orders (e.g., "pending", "completed")
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request or no orders found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ERROR : No orders found"
 */
restaurantRouter.get("/orders/:userId/:restaurantId/:status", userAuth, async (req, res) => {
    try {
        isAdminOrRestaurant(req.params.userId);
        const order = await Order.find( {restaurant: req.params.restaurantId, orderStatus: req.params.status} );
        res.json({ message: "List of all Orders with status - " + req.params.status, data: order });
    }
    catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/restaurant/order/{orderId}:
 *   patch:
 *     tags: ["Restaurant"]
 *     summary: Update an order status
 *     description: Updates the status of a specific order.
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: The ID of the order to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "605c72ef1532075ab5c7dbd"
 *               orderStatus:
 *                 type: string
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request or order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ERROR : Order not found"
 */
restaurantRouter.patch("/order/:orderId", async (req, res) => {
    try {
        // Extract only the allowed fields from the request body
        const { userId, orderStatus } = req.body;
        isAdminOrRestaurant(userId);
        // Prepare an update object with only the permitted fields
        const updateData = {};
        if (orderStatus) updateData['orderStatus'] = orderStatus;

        // Update the user with the filtered data
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order Details not found' });
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error });
    }
});

module.exports = restaurantRouter;
