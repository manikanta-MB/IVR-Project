const { Client } = require("pg");

const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "ivr_project"
});

client.on("connect", () => {
    console.log("Database connected.");
});

client.on("end", () => {
    console.log("Database Disconnected.");
});

client.connect();

module.exports = client;

// client.connect();

// const a = 'CON-b7e8a70b-7946-4458-be22-011fa5a7d7aa'
// const b = '919959635362'
// const c = '2022-01-27T09:02:42.459Z'
// const d = '2022-01-27T09:02:42.459Z'

// client.query(`select * from conversation where uuid = $1`,
// ['CON-b7e8a70b-7946-4458-be22-011fa5a7d7aa'], 
// (err,result) => {
//     if(err){
//         console.log(err);
//     }
//     else{
//         console.log(result.rowCount);
//         console.log(result.rows);
//     }
//     // client.end();
// });

// client.on("on")