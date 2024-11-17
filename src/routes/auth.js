const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * @swagger
 * path:
 *  /api/signup:
 *    post:
 *      summary: Register a new user
 *      description: Creates a new user and returns the user data along with a JWT token.
 *      tags: [Auth]
 *      requestBody:
 *        description: User data to register
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                firstName:
 *                  type: string
 *                  example: "Mohd"
 *                lastName:
 *                  type: string
 *                  example: "Faiz"
 *                emailId:
 *                  type: string
 *                  example: "mohdfaiz@example.com"
 *                password:
 *                  type: string
 *                  example: "Faiz.7860"
 *                role:
 *                  type: string
 *                  example: "admin"
 *                gender:
 *                  type: string
 *                  example: "male"
 *      responses:
 *        200:
 *          description: User successfully registered
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "User Added successfully!"
 *                  data:
 *                    $ref: '#/components/schemas/User'
 *        400:
 *          description: Invalid input or validation error
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    example: "ERROR: <error message>"
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
 * path:
 *  /api/login:
 *    post:
 *      summary: Login user
 *      description: Authenticates a user and returns a JWT token.
 *      tags: [Auth]
 *      requestBody:
 *        description: User login credentials
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                emailId:
 *                  type: string
 *                  example: "mohdfaiz@example.com"
 *                password:
 *                  type: string
 *                  example: "Faiz.7860"
 *      responses:
 *        200:
 *          description: User successfully logged in
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Login successful"
 *                  data:
 *                    $ref: '#/components/schemas/User'
 *        400:
 *          description: Invalid credentials or login failure
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    example: "ERROR: Invalid credentials"
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
 * path:
 *  /api/logout:
 *    post:
 *      summary: Logout user
 *      description: Logs the user out by clearing the JWT token.
 *      tags: [Auth]
 *      responses:
 *        200:
 *          description: User successfully logged out
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Logout is successful!!"
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
 */

module.exports = authRouter;