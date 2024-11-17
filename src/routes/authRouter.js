const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * @swagger
 * /api/signup:
 *   post:
 *     summary: Register a user
 *     description: Allows an admin to register a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Mohd"
 *               lastName:
 *                 type: string
 *                 example: "Faiz"
 *               emailId:
 *                 type: string
 *                 example: "mohdfaiz7862@gmail.com"
 *               password:
 *                 type: string
 *                 example: "Faiz.123"
 *               role:
 *                 type: string
 *                 example: "admin"
 *               gender:
 *                 type: string
 *                 example: "male"
 *     responses:
 *       200:
 *         description: User Data added successfully
 *       400:
 *         description: Error message
 */
authRouter.post("/signup", async (req, res) => {
    try {
        // Validation of data
        validateSignUpData(req);

        const { firstName, lastName, emailId, password, role, gender } = req.body;

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
        const token = await savedUser.getJWT();
        res.cookie("token", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        res.json({ message: "User Added successfully!", data: savedUser });
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT token.
 *     tags: [Authentication]
 *     requestBody:
 *       description: User login credentials
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailId:
 *                 type: string
 *                 example: "mohdfaiz@example.com"
 *               password:
 *                 type: string
 *                 example: "Faiz.7860"
 *     responses:
 *       200:
 *         description: User successfully logged in
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
 *         description: Invalid credentials or login failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ERROR: Invalid credentials"
 */
authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("Invalid credentials");
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
 * /api/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs the user out by clearing the JWT token.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout is successful!!"
 */
authRouter.post("/logout", async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
    });
    res.send("Logout is successfull!!");
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Mohd"
 *         lastName:
 *           type: string
 *           example: "Faiz"
 *         emailId:
 *           type: string
 *           example: "mohdfaiz@example.com"
 *         password:
 *           type: string
 *           example: "Faiz.7860"
 *         role:
 *           type: string
 *           example: "admin"
 *         gender:
 *           type: string
 *           example: "male"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-11-17T10:15:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-11-17T10:15:00Z"
 *         _id:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 * 
 *     Delivery:
 *       type: object
 *       properties:
 *         order:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 *         deliveryPersonnel:
 *           type: string
 *           example: "605c72ef153207001f0d0c4"
 *         pickupTime:
 *           type: string
 *           format: date-time
 *           example: "2024-11-17T10:30:00Z"
 *         deliveryTime:
 *           type: string
 *           format: date-time
 *           example: "2024-11-17T11:30:00Z"
 *         deliveryStatus:
 *           type: string
 *           enum:
 *             - Pending
 *             - PickedUp
 *             - EnRoute
 *             - Delivered
 *           example: "Pending"

 *     DeliveryAddress:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 *         firstName:
 *           type: string
 *           example: "Mohd"
 *         lastName:
 *           type: string
 *           example: "Faiz"
 *         addressLine1:
 *           type: string
 *           example: "123 Main Street"
 *         addressLine2:
 *           type: string
 *           example: "Apt 101"
 *         city:
 *           type: string
 *           example: "New York"
 *         state:
 *           type: string
 *           example: "NY"
 *         country:
 *           type: string
 *           example: "USA"
 *         postalCode:
 *           type: string
 *           example: "10001"
 *         isDefault:
 *           type: boolean
 *           example: false

 *     DeliveryPersonnel:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "johndoe@example.com"
 *         contactDetails:
 *           type: string
 *           example: "123-456-7890"
 *         vehicleType:
 *           type: string
 *           example: "Motorcycle"
 *         isAvailable:
 *           type: boolean
 *           example: true
 *         role:
 *           type: string
 *           enum:
 *             - Delivery
 *             - Admin
 *           example: "Delivery"
 *         tokenVersion:
 *           type: integer
 *           example: 0

 *     Menu:
 *       type: object
 *       properties:
 *         restaurant:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 *         itemName:
 *           type: string
 *           example: "Cheeseburger"
 *         description:
 *           type: string
 *           example: "A delicious cheeseburger with fresh ingredients."
 *         price:
 *           type: number
 *           example: 9.99
 *         availability:
 *           type: boolean
 *           example: true

 *     Order:
 *       type: object
 *       properties:
 *         customer:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 *         restaurant:
 *           type: string
 *           example: "605c72ef153207001f0d0c4"
 *         orderDate:
 *           type: string
 *           format: date-time
 *           example: "2024-11-17T10:15:00Z"
 *         orderStatus:
 *           type: string
 *           enum:
 *             - Pending
 *             - Accepted
 *             - Preparing
 *             - OutForDelivery
 *             - Delivered
 *             - Cancelled
 *             - Rescheduled
 *           example: "Pending"
 *         totalAmount:
 *           type: number
 *           example: 35.50
 *         deliveryTime:
 *           type: string
 *           format: date-time
 *           example: "2024-11-17T11:00:00Z"
 *         items:
 *           type: array
 *           items:
 *             type: string
 *             example: "605c72ef153207001f0d0c3"

 *     Restaurant:
 *       type: object
 *       properties:
 *         owner:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 *         restaurantName:
 *           type: string
 *           example: "Awesome Pizza Place"
 *         address:
 *           type: string
 *           example: "123 Pizza St, New York"
 *         cuisineType:
 *           type: string
 *           example: "Italian"
 *         openingHours:
 *           type: string
 *           example: "10:00 AM - 10:00 PM"
 *         deliveryZone:
 *           type: string
 *           example: "Manhattan"

 *     OrderItem:
 *       type: object
 *       properties:
 *         order:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 *         menuItem:
 *           type: string
 *           example: "605c72ef153207001f0d0c3"
 *         quantity:
 *           type: integer
 *           example: 2
 */

module.exports = authRouter;
