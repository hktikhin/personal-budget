const express = require("express");
const apiRouter = express.Router();

apiRouter.get("/", (req, res, next) => {
    res.send("Hello");
})

// Mount the router 
const envelopeRouter = require("./envelope");
apiRouter.use("/envelopes", envelopeRouter);

module.exports = apiRouter;
