const express = require("express");
const envelopeRouter = express.Router();

const db = require("../db");

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
const validateId = async (id) => {
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
    
    const {rows} = await db.query(`
        SELECT *
        FROM envelope
        WHERE id = $1
        ;
    `, [envelopeID]);

    const envelope = rows[0];

    if (! envelope) {
        notFoundError = new Error("Envelope not found.");
        notFoundError.status = 404;
        throw notFoundError;  
    }
    
    return [envelopeID, envelope];
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

// handle parameters
envelopeRouter.param("envelopeID", async (req, res, next, id) => {
    // check for valid id 
    try {
        const [envelopeID, envelope] = await validateId(id);
        req.envelopeID = envelopeID;
        req.envelope = envelope;
        next();
    } catch (err) {
        next(err)
    }
});

envelopeRouter.param("from", (req, res, next, id) => {
    // check for valid id 
    try {
        const [envelopeID, envelope] = validateId(id);
        req.fromEnvelopeID = envelopeID;
        req.fromEnvelope = envelope;
        next();
    } catch (err) {
        next(err);
    }
});

envelopeRouter.param("to", (req, res, next, id) => {
    // check for valid id 
    try {
        const [envelopeID, envelope] = validateId(id);
        req.toEnvelopeID = envelopeID;
        req.toEnvelope = envelope;
        next();
    } catch (err) {
        next(err);
    }
});

// Handle route 
// Get all 
envelopeRouter.get("/", async (req, res, next) => {
    try {
        const {rows} = await db.query(`
            SELECT *
            FROM envelope
            ORDER BY id ASC;
        `);
        res.send(rows);
    } catch (err) {
        next(err);
    }
});

// Get by id 
envelopeRouter.get("/:envelopeID", async (req, res, next) => {
    res.send(req.envelope);
});

// Add envelope 
envelopeRouter.post("/", isValidEnvelope, async (req, res, next) => {
    try {
        const newEnvelope = req.newEnvelope;
        const {rows} = await db.query(`
            INSERT INTO envelope (title, budget)
            VALUES ($1, $2)
            RETURNING *
            ;
        `, [newEnvelope.title, newEnvelope.budget]);
        res.status(201).send(rows[0]);
    } catch (err) {
        next(err);
    }
    
});

// Update envelope 
envelopeRouter.put("/:envelopeID", isValidEnvelope, async (req, res, next) => {
    const newEnvelope = req.newEnvelope;
    try {
        const {rows} = await db.query(`
            UPDATE envelope 
            SET title = $2, budget = $3
            WHERE id = $1
            RETURNING *
            ;
        `, [req.envelopeID, newEnvelope.title, newEnvelope.budget]);
        res.send(rows[0]);
    } catch (err) {
        next(err);
    }
});

// Delete
envelopeRouter.delete("/:envelopeID", async (req, res, next) => {
    try {
        await db.query(`
            DELETE FROM envelope 
            WHERE id = $1
            ;
        `, [req.envelopeID]);
        res.status(204).send();
    } catch (err) {
        next(err);
    }

});

module.exports = {envelopeRouter, validateId};
