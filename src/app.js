const express = require('express');
const app = express();
const swaggerSetup = require('./swagger');  
require('dotenv').config();
const cookieParser = require("cookie-parser");
const cors = require('cors');


app.use(express.json());
app.use(cookieParser());
app.use(cors());

swaggerSetup(app); 

const authRouter = require("./routes/authRouter");
const adminRouter = require("./routes/adminRouter");
const customerRouter = require("./routes/customerRouter");
const deliveryRouter = require("./routes/deliveryRouter");
const restaurantRouter = require("./routes/restaurantRouter");
const connectDatabase = require('./configuration/databaseConnect');

app.use("/api", authRouter)
app.use("/api/admin", adminRouter);
app.use("/api/customer", customerRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/restaurant", restaurantRouter);
app.get('/', (req, res) => {
    res.send('Welcome to Faizos API Project !');
  });


connectDatabase()
    .then(() => {
        console.log(`Database connected `);
        app.listen(process.env.PORT, () => {
            console.log(`Server is running at the port ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log(`Unable to connect to database ${err}`)
    })

module.exports = app;