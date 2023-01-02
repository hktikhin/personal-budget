const express = require("express");
const envelopeRouter = express.Router();

// array to store envelope object 
const envelopes = [
    {
        id: 1,
        title: "Food",
        budget: 1500
    },
    {
        id: 2,
        title: "Game",
        budget: 500
    }
];

// Helper function
const assignId = (requestEnvelope) => {
    /*
     Assign id helper function 
    */
    const {id : maxEnvelopeId} = envelopes.reduce(
        (accumulator, currentValue) => (currentValue.id > accumulator.id) ? currentValue : accumulator
    );
    requestEnvelope.id = maxEnvelopeId + 1
    return requestEnvelope
};

const validateIdx = (id) => {
    /*
    Helper function to validate envelopID
    params:
        - id : envelopID
    return:
        - error: Error object 
        - [envelopeID, envelopeIdx, envelope]
    Hints:
        - obj instanceof constructor
        - throw error 
    */
    let invalidIdError;
    let notFoundError;
    const envelopeID = Number(id);
    if (!envelopeID) {
        invalidIdError = new Error("Invalid ID.");
        invalidIdError.status = 400;
        throw invalidIdError;
    }
    const envelopeIdx = envelopes.findIndex((envelope) => {
        return envelope.id === envelopeID;
    });
    const envelope = envelopes[envelopeIdx];
    if (! envelope) {
        notFoundError = new Error("Envelope not found.");
        notFoundError.status = 404;
        throw notFoundError;  
    }
    return [envelopeID, envelopeIdx, envelope]
}


const validateTransaction = (amount, budget) => {
    /*
    Helper function to validate transactionAmount
    params:
        - amount : transactionAmount; can be string
        - budget: budget of certain envelope
    return:
        - transactionAmount
    Hints:
        - obj instanceof constructor
        - throw error 

    */
    let invalidAmountError;
    const transactionAmount = Number(amount);
    if (!transactionAmount || transactionAmount <= 0) {
        invalidAmountError = new Error("Transaction Amount must be a postive number.");
        invalidAmountError.status = 400;
        throw invalidAmountError;
    }

    if (transactionAmount > budget) {
        invalidAmountError = new Error("Not enough money in the envelope.");
        invalidAmountError.status = 400;
        throw invalidAmountError;
    }

    return transactionAmount;
}

// Middleware
const isValidEnvelope = (req, res, next) => {
    /*
    Validate request body middleware
    */
    const envelope = req.body;
    let invalidBodyError;
    // title and budget must exist
    if (!envelope.title || !envelope.budget) {
        invalidBodyError = new Error("Title or budget field not existed.");
        invalidBodyError.status = 400;
        return next(invalidBodyError);
    }
    // Title must be string 
    if (typeof envelope.title !== "string") {
        invalidBodyError = new Error("Title must be string.");
        invalidBodyError.status = 400;
        return next(invalidBodyError);
    }
    // Budget must be number and > 0
    if (
        !isNaN(parseFloat(envelope.budget)) && 
        isFinite(envelope.budget) &&
        envelope.budget > 0
    ) {
        envelope.budget = Number(envelope.budget);
    } else {
        invalidBodyError = new Error("Budget must be positive number.");
        invalidBodyError.status = 400;
        return next(invalidBodyError);
    }
    req.newEnvelope = envelope;
    next();
};

const extractMoney = (req, res, next) => {
    /* 
    Middleware to extract money

    Expected body format:
    {
        "transactionAmount": 100
    }
    */

    // check for valid input given 
    try {
        const transactionAmount = validateTransaction(
            req.body.transactionAmount, req.envelope.budget
        )
        req.envelope.budget -= transactionAmount;
        next();
    } catch (err) {
        next(err)
    }
};

const transferMoney = (req, res, next) => {
    /* 
    Middleware to transfer money from one envelope to another

    Expected body format:
    {
        "transactionAmount": 100
    }
    */
    try {
        // check for valid input given 
        const transactionAmount = validateTransaction(
            req.body.transactionAmount, req.fromEnvelope.budget
        )
        // Update budget
        req.fromEnvelope.budget -= transactionAmount;
        req.toEnvelope.budget += transactionAmount;
        next();
    } catch (err) {
        next(err)
    }
};

// handle parameters
envelopeRouter.param("envelopeID", (req, res, next, id) => {
    // check for valid id 
    try {
        const [envelopeID, envelopeIdx, envelope] = validateIdx(id);
        req.envelopeID = envelopeID;
        req.envelopeIdx = envelopeIdx
        req.envelope = envelope;
        next();
    } catch (err) {
        next(err)
    }
});

envelopeRouter.param("from", (req, res, next, id) => {
    // check for valid id 
    try {
        const [envelopeID, envelopeIdx, envelope] = validateIdx(id);
        req.fromEnvelopeID = envelopeID;
        req.fromEnvelopeIdx = envelopeIdx
        req.fromEnvelope = envelope;
        next();
    } catch (err) {
        next(err)
    }
});

envelopeRouter.param("to", (req, res, next, id) => {
    // check for valid id 
    try {
        const [envelopeID, envelopeIdx, envelope] = validateIdx(id);
        req.toEnvelopeID = envelopeID;
        req.toEnvelopeIdx = envelopeIdx
        req.toEnvelope = envelope;
        next();
    } catch (err) {
        next(err)
    }
});

// Handle route 
// Get all 
envelopeRouter.get("/", (req, res, next) => {
    res.send(envelopes);
});

// Get by id 
envelopeRouter.get("/:envelopeID", (req, res, next) => {
    res.send(req.envelope);
});

// Add envelope 
envelopeRouter.post("/", isValidEnvelope, (req, res, next) => {
    const newEnvelope = assignId(req.newEnvelope);
    envelopes.push(newEnvelope);
    res.status(201).send(envelopes[envelopes.length-1]);
});


// Extract money from envelope
envelopeRouter.post("/extract/:envelopeID", extractMoney, (req, res, next) => {
    res.status(200).send(req.envelope);
});

// Transfer from one to envelope to another 
envelopeRouter.post("/transfer/:from/:to", transferMoney, (req, res, next) => {
    res.status(200).send({
        from: req.fromEnvelope,
        to: req.toEnvelope
    });
});

// Update envelope 
envelopeRouter.put("/:envelopeID", isValidEnvelope, (req, res, next) => {
    envelopes[req.envelopeIdx] = req.newEnvelope;
    res.send(envelopes[req.envelopeIdx]);
});

// Delete
envelopeRouter.delete("/:envelopeID", (req, res, next) => {
    envelopes.splice(req.envelopeIdx, 1);
    res.status(204).send();
});

module.exports = envelopeRouter;
