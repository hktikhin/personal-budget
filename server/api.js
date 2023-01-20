const express = require("express");
const apiRouter = express.Router();

apiRouter.get("/", (req, res, next) => {
    res.send("Hello");
})

// Mount the router 
const {envelopeRouter} = require("./envelope");
const transactionRouter = require("./transaction");
apiRouter.use("/envelopes", envelopeRouter);
apiRouter.use("/transactions", transactionRouter);

module.exports = apiRouter;
