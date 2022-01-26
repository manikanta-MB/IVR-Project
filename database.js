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

module.exports = client;

// client.connect();
// var a = "your_name_text";
// var b = 'suresh';

// client.query(`update user_info set ${a} = $1 RETURNING *`,[b], (err,result) => {
//     if(err){
//         console.log(err);
//     }
//     else{
//         console.log(result.rowCount);
//         console.log(result.rows);
//     }
//     client.end();
// });

// client.on("on")