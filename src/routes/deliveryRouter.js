const express = require('express');
const {
  registerPersonnel,
  loginPersonnel,
  getAvailableOrders,
  acceptOrder,
  updateDeliveryStatus,
  setAvailability,
  createOrder,
  getAllDeliveryPersonnel,
} = require('../controllers/deliveryController');
const { protect } = require('../middlewares/authMiddleware');

const deliveryRouter = express.Router();

/**
 * @swagger
 * /api/delivery/register:
 *   post:
 *     tags: ["Delivery Personnel"]
 *     summary: Register a new delivery personnel
 *     description: Registers a new delivery personnel into the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "1234567890"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Personnel registered successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
deliveryRouter.post('/register', registerPersonnel);

/**
 * @swagger
 * /api/delivery/login:
 *   post:
 *     tags: ["Delivery Personnel"]
 *     summary: Login for delivery personnel
 *     description: Allows a delivery personnel to log in to the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "jwt-token-here"
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
deliveryRouter.post('/login', loginPersonnel);

/**
 * @swagger
 * /api/delivery/orders:
 *   get:
 *     tags: ["Delivery Personnel"]
 *     summary: Get available orders for delivery personnel
 *     description: Fetches a list of available orders that can be accepted by delivery personnel.
 *     responses:
 *       200:
 *         description: List of available orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
deliveryRouter.get('/orders', protect, getAvailableOrders);

/**
 * @swagger
 * /api/delivery/orders/{id}/accept:
 *   put:
 *     tags: ["Delivery Personnel"]
 *     summary: Accept an order for delivery
 *     description: Allows a delivery personnel to accept a specific order.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order to accept
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *       400:
 *         description: Invalid order ID or order already accepted
 *       500:
 *         description: Internal server error
 */
deliveryRouter.put('/orders/:id/accept', protect, acceptOrder);

/**
 * @swagger
 * /api/delivery/orders/{id}/status:
 *   put:
 *     tags: ["Delivery Personnel"]
 *     summary: Update the status of an order
 *     description: Allows a delivery personnel to update the status of an order (e.g., "in progress", "delivered").
 *     parameters:
 *       - name: id
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
 *               status:
 *                 type: string
 *                 example: "delivered"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status or order not found
 *       500:
 *         description: Internal server error
 */
deliveryRouter.put('/orders/:id/status', protect, updateDeliveryStatus);

/**
 * @swagger
 * /api/delivery/availability:
 *   put:
 *     tags: ["Delivery Personnel"]
 *     summary: Set delivery personnel availability
 *     description: Allows a delivery personnel to set their availability status for taking orders.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               available:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability status updated successfully
 *       400:
 *         description: Invalid availability status
 *       500:
 *         description: Internal server error
 */
deliveryRouter.put('/availability', protect, setAvailability);

/**
 * @swagger
 * /api/delivery/place-order:
 *   post:
 *     tags: ["Delivery Personnel"]
 *     summary: Create a new order
 *     description: Allows a customer to create a new order, which will be assigned to a delivery personnel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: "605c72ef1532075ab5c7dbd"
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "item1, item2"
 *               totalPrice:
 *                 type: number
 *                 example: 29.99
 *               address:
 *                 type: string
 *                 example: "123 Main St, Anytown, USA"
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order details
 *       500:
 *         description: Internal server error
 */
deliveryRouter.post('/place-order', createOrder);

/**
 * @swagger
 * /api/delivery/delivery-personnel:
 *   get:
 *     tags: ["Delivery Personnel"]
 *     summary: Get all delivery personnel
 *     description: Retrieves a list of all registered delivery personnel.
 *     responses:
 *       200:
 *         description: List of all delivery personnel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryPersonnel'
 *       500:
 *         description: Internal server error
 */
deliveryRouter.get('/delivery-personnel', getAllDeliveryPersonnel);


module.exports = deliveryRouter;
