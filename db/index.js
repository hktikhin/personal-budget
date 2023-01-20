const {Pool} = require("pg");

const pool = new Pool();
console.log(
    `connect to ${process.env.PGDATABASE} database ` +
    `on host ${process.env.PGHOST} with port ${process.env.PGPORT} ` +
    `as user ${process.env.PGUSER}`
)

module.exports = {
    async query(text, params) {
        const res = await pool.query(text, params);
        return res;
    },

    async getClient() {
        const client = await pool.connect();
        return client;
    }
}