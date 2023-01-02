// import 
const express = require("express");
const bodyParser = require('body-parser')
const cors = require("cors")

// app 
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for cors
app.use(cors())

// Middleware for parsing request body 
app.use(bodyParser.json())

// Mount the api router 
const apiRouter = require("./server/api");
app.use("/", apiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    const errorStatusCode = err.status || 500;
    res.status(errorStatusCode).send({error: err.message});
})

// Can only run directly 
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server listing to port ${PORT}`)
    });
}

