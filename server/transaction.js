const express = require("express");
const transactionRouter = express.Router();
const {validateId: validateEnvelopeId} = require("./envelope");
const db = require("../db");

// array to store transaction object 
const transactions = [
    {
        id: 1,
        title: "Food is really expensive; Give more budget on food from travel.",
        from_envelope: 3,
        to_enevelope: 1,
        amount: 500
    },
    {
        id: 2,
        title: "Extract money from game envelope",
        from_envelope: 3,
        amount: 500
    }
];

const getEnvelopById = async (envelopId) => {
    const {rows} = await db.query(`
        SELECT *
        FROM envelope
        WHERE id = $1
        ;
    `, [envelopId]);
    const envelope = rows[0];
    return [envelopId, envelope];
};

const validateId = async (id) => {
    /*
    Helper function to validate transactionID
    params:
        - id : transactionID
    return:
        - error: Error object 
        - [transactionID, transaction]
    Hints:
        - obj instanceof constructor
        - throw error 
    */
    let invalidIdError;
    let notFoundError;
    const transactionID = Number(id);
    if (!transactionID) {
        invalidIdError = new Error("Invalid ID.");
        invalidIdError.status = 400;
        throw invalidIdError;
    }
    
    const {rows} = await db.query(`
        SELECT *
        FROM transaction
        WHERE id = $1
        ;
    `, [transactionID]);

    const transaction = rows[0];

    if (! transaction) {
        notFoundError = new Error("Transaction not found.");
        notFoundError.status = 404;
        throw notFoundError;  
    }
    
    return [transactionID, transaction];
}


const haveEnoughMoney = (amount, budget) => {
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
    if (transactionAmount === undefined || transactionAmount === null || transactionAmount < 0) {
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
const validateTransaction = async (req, res, next) => {
    /*
    Validate request body middleware
    */
    const transaction = req.body;
    let invalidBodyError;

    // from_envelope and budget must exist
    if (!transaction.amount || !transaction.from_envelope) {
        invalidBodyError = new Error("Amount or from envelope id field not existed.");
        invalidBodyError.status = 400;
        return next(invalidBodyError);
    }

    // from_envelope or to_envelope must be exist in database
    try {
        // scope bug: the following const aren't define outside the block
        const [fromEnvelopeID, fromEnvelope] = await validateEnvelopeId(transaction.from_envelope);
        req.fromEnvelopeID = fromEnvelopeID;
        req.fromEnvelope = fromEnvelope;

        if (transaction.to_envelope) {
            const [toEnvelopeID, toEnvelope] = await validateEnvelopeId(transaction.to_envelope);
            req.toEnvelopeID = toEnvelopeID;
            req.toEnvelope = toEnvelope;
        }
    } catch (err) {
        next(err);
    }

    // Title must be string 
    if (transaction.title) {
        if (typeof transaction.title !== "string") {
            invalidBodyError = new Error("Title must be string.");
            invalidBodyError.status = 400;
            return next(invalidBodyError);
        }
    }

    // Budget must be number and > 0
    if (
        !isNaN(parseFloat(transaction.amount)) && 
        isFinite(transaction.amount) &&
        transaction.amount > 0
    ) {
        transaction.amount = Number(transaction.amount);
    } else {
        invalidBodyError = new Error("Amount must be positive number.");
        invalidBodyError.status = 400;
        return next(invalidBodyError);
    }
    const reqMethod = req.method

        
    try {
        if (req.method === "POST") {
            // Check the envelope have enough money in the budget to perform the transaction
            haveEnoughMoney(transaction.amount, req.fromEnvelope.budget);
        }

    } catch (err) {
        return next(err)
    }

    req.newTransaction = transaction;
    next();
};

// handle parameters
transactionRouter.param("transactionID", async (req, res, next, id) => {
    // check for valid id 
    try {
        const [transactionID, transaction] = await validateId(id);
        req.transactionID = transactionID;
        req.transaction = transaction;
        next();
    } catch (err) {
        next(err)
    }
});


// Handle route 
// Get all 
transactionRouter.get("/", async (req, res, next) => {
    try {
        const {rows} = await db.query(`
            SELECT *
            FROM transaction
            ORDER BY id ASC;
        `);
        res.send(rows);
    } catch (err) {
        next(err);
    }
});

// Get by id 
transactionRouter.get("/:transactionID", async (req, res, next) => {
    res.send(req.transaction);
});

// Add transaction 
transactionRouter.post("/", validateTransaction, async (req, res, next) => {
    const client = await db.getClient();
    try {
        // Crate a sql transactions (graoup multiple sql statement together) 
        await client.query('BEGIN')

        // Insert transaction 
        const newTransaction = req.newTransaction;
        const keyNum = Object.keys(newTransaction).length
        const insertColsStr = Object.keys(newTransaction).join(", ");
        const {rows} = await client.query(`
            INSERT INTO transaction (${insertColsStr})
            VALUES (${Array.from(Array(keyNum), (_, i) => `\$${i+1}`)})
            RETURNING *
            ;
        `, Object.values(newTransaction));

        // Update fromEnvelope
        const fromEnvelopeID = req.fromEnvelopeID;
        await client.query(`
            UPDATE envelope 
            SET budget = budget - $2
            WHERE id = $1
            ;
        `, [fromEnvelopeID, newTransaction.amount])
        // Update toEnvelope
        if (req.toEnvelopeID) {
            const toEnvelopeID = req.toEnvelopeID;
            await client.query(`
                UPDATE envelope 
                SET budget = budget + $2
                WHERE id = $1
                ;
            `, [toEnvelopeID, newTransaction.amount])
        }
        await client.query('COMMIT')
        res.status(201).send(rows[0]);
    } catch (err) {
        await client.query('ROLLBACK')
        next(err);
    } finally {
        client.release()
    }
});


const comepareTransation = async (req, res, next) => {
    const newTransaction = req.newTransaction;
    const oldTransaction = req.transaction;
    const amountDiff = newTransaction.amount - oldTransaction.amount;

    const fromEnvelope = req.fromEnvelope;
    const toEnvelope = req.toEnvelope;
    
    try {
        // check whether two transaction have same recipient and receiver
        if (
            oldTransaction.fromEnvelopeID !== newTransaction.fromEnvelopeID ||
            oldTransaction.toEnvelopeID !== newTransaction.toEnvelopeID    
        ){
            const notSameStakeholderError = new Error("Your new transaction need to have same recipient and receiver as before.")
            throw notSameStakeholderError;
        }
        
        // check whether recipient or receiver have enough money to pay 
        const budget = (amountDiff > 0) ? fromEnvelope.budget : toEnvelope.budget;
        haveEnoughMoney(Math.abs(amountDiff),  budget);
        req.amountDiff = amountDiff;
        next()
    } catch (err) {
        next(err)
    }
}

// Update transaction 
transactionRouter.put("/:transactionID", validateTransaction, comepareTransation, async (req, res, next) => {
    const client = await db.getClient();
    try {
        // Crate a sql transactions (graoup multiple sql statement together) 
        await client.query('BEGIN')

        // Update transaction 
        const newTransaction = req.newTransaction;
        const transactionCols = Object.keys(newTransaction);
        const setColValStr = Array.from(transactionCols, (element, idx) => `${element} = \$${idx+2}`).join(", ")
        const {rows} = await client.query(`
            UPDATE transaction 
            SET ${setColValStr}
            WHERE id = $1
            RETURNING *
            ;
        `, [req.transactionID, ...Object.values(newTransaction)]);
        // Update fromEnvelope
        const fromEnvelopeID = req.fromEnvelopeID; 
        await client.query(`
            UPDATE envelope 
            SET budget = budget - ($2)
            WHERE id = $1
            ;
        `, [fromEnvelopeID, req.amountDiff])
        // Update toEnvelope
        if (req.toEnvelopeID) {
            const toEnvelopeID = req.toEnvelopeID;
            await client.query(`
                UPDATE envelope 
                SET budget = budget + ($2)
                WHERE id = $1
                ;
            `, [toEnvelopeID, req.amountDiff])
        }
        await client.query('COMMIT')
        res.status(200).send(rows[0]);
    } catch (err) {
        await client.query('ROLLBACK')
        next(err);
    } finally {
        client.release()
    }
});

// Delete
transactionRouter.delete("/:transactionID", async (req, res, next) => {

    const transaction = req.transaction;
    // how can nameing convention create problem and bugs...
    // you need await for any promise/ async function , waiting them to be resolved...
    const [fromEnvelopeID, fromEnvelope] = await getEnvelopById(transaction.from_envelope);
    const [toEnvelopeID, toEnvelope] = await getEnvelopById(transaction.to_envelope);

    const client = await db.getClient();

    try {
        // Crate a sql transactions (graoup multiple sql statement together) 
        await client.query('BEGIN')

        // check receiver have enought money in budget 
        haveEnoughMoney(transaction.amount, toEnvelope.budget)

        // Delete transaction
        const {rows} = await client.query(`
            DELETE FROM transaction
            WHERE id = $1
            ;
        `, [req.transactionID]);

        // Update fromEnvelope
        await client.query(`
            UPDATE envelope 
            SET budget = budget + $2
            WHERE id = $1
            ;
        `, [fromEnvelopeID, transaction.amount])
        // Update toEnvelope
        if (toEnvelopeID) {
            await client.query(`
                UPDATE envelope 
                SET budget = budget - $2
                WHERE id = $1
                ;
            `, [toEnvelopeID, transaction.amount])
        }
        await client.query('COMMIT')
        res.status(204).send(rows[0]);
    } catch (err) {
        await client.query('ROLLBACK')
        next(err);
    } finally {
        client.release()
    }
});

module.exports = transactionRouter;
