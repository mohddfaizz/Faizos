const express = require('express');
const app = express();
const swaggerSetup = require('./swagger');  
require('dotenv').config();
const cookieParser = require("cookie-parser");


app.use(express.json());
app.use(cookieParser());

swaggerSetup(app); 

const authRouter = require("./routes/auth");
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
