import express from "express";
import pg from "pg";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
const { Pool } = pg;
const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
})

app.get("/categories", async (req, res) =>{
    try{
    const promise = await connection.query(`SELECT * FROM categories;`)
    res.status(200).send(promise.rows)
    }
    catch{
        res.sendStatus(500)
    }
})

app.post("/categories", async (req, res)=>{
    const {name} = req.body;
    try{
        if(name === "") return res.sendStatus(400)
        const prom = await connection.query(`SELECT * FROM categories WHERE name=$1;`, [name])
        if(prom.rows.length) return res.sendStatus(409)
        const promise = await connection.query(`INSERT INTO categories (name) VALUES ($1);`, [name])
        return res.sendStatus(201)
    }
    catch{
        res.sendStatus(500)
    }
})

app.get("/games", async (req, res) =>{
    try{
        const promise = await connection.query(`SELECT games.id, games.name, games.image, games."stockTotal", games."categoryId", games."pricePerDay", categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId"=categories.id;`)
        res.status(200).send(promise.rows)
        }
        catch{
            res.sendStatus(500)
        }
})
app.post("/games", async (req, res) =>{
    const {
        name,
        image,
        stockTotal,
        categoryId,
        pricePerDay
    } = req.body;
    try{
        const check = await connection.query(`SELECT * FROM categories WHERE id=$1;`,[categoryId])
        if(name === "" || stockTotal <=0 || pricePerDay <= 0 || check.rows.length === 0) return res.sendStatus(400);
        const prom = await connection.query(`SELECT * FROM games WHERE name=$1;`, [name])
        if(prom.rows.length) return res.sendStatus(409)
        const promise = await connection.query(`INSERT INTO games (name,image,"stockTotal","categoryId","pricePerDay") VALUES ($1, $2, $3, $4, $5);`, [name,image,stockTotal,categoryId,pricePerDay]) 
        return res.sendStatus(201)
    }
    catch{
        res.sendStatus(500);
    }
})

app.get("/customers", async (req,res)=>{
    try{
        const promise = await connection.query(`SELECT * FROM customers;`)
        res.status(200).send(promise.rows)
    }
    catch{
        res.sendStatus(500);
    }
})

app.get("/customers/:id", async (req,res)=>{
    const {id}= req.params;
    console.log(req.params.id)
    try{
        const promise = await connection.query(`SELECT * FROM customers WHERE id=$1;`, [id])
        if(promise.rows.length) return res.status(200).send(promise.rows)
        return res.sendStatus(404)
        
    }
    catch{
        res.sendStatus(500);
    }
})

app.post("/customers" , async (req, res) =>{
    const {
        name,
        phone,
        cpf,
        birthday
    }= req.body;
    if(cpf.length !== 11 || phone.length < 10 || phone.length > 11 || !name || !birthday) return res.sendStatus(400);
    try{
        const prom = await connection.query(`SELECT * FROM customers WHERE cpf=$1;`, [cpf])
        if(prom.rows.length) return res.sendStatus(409);
        const promise = await connection.query(`INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1, $2, $3, $4);`, [name,phone,cpf,birthday])
        res.sendStatus(201);
    }
    catch{
        res.sendStatus(500)
    }
})

app.put("/customers/:id", async (req,res) =>{
    const {id}= req.params;
    const {
        name,
        phone,
        cpf,
        birthday
    }= req.body;
    if(cpf.length !== 11 || phone.length < 10 || phone.length > 11 || !name || !birthday) return res.sendStatus(400);
    try{
        const prom = await connection.query(`SELECT * FROM customers WHERE cpf=$1;`, [cpf])
        if(prom.rows.length) return res.sendStatus(409);
        const promise = await connection.query(`UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5`, [name,phone,cpf,birthday,id])
        res.sendStatus(201);
    }
    catch{
        res.sendStatus(500)
    }
})
app.get("/rentals", async (req,res) =>{
    const {customerId, gameId} = req.query;
    if(customerId){
        try{
            const promise = await connection.query(`
                SELECT
                    rentals.*,
                    jsonb_build_object(
                        'id', customers.id,
                        'name', customers.name
                    ) AS customer,
                    jsonb_build_object(
                        'id', games.id,
                        'name', games.name,
                        'categoryId', games."categoryId",
                        'categoryName', categories.name
                    ) AS game
                FROM rentals
                JOIN customers
                    ON rentals."customerId" = customers.id
                JOIN games
                    ON rentals."gameId" = games.id
                JOIN categories
                    ON games."categoryId" = categories.id;
                    WHERE
                    rentals."customerId" = $1;`, 
            [customerId]);
            res.send(promise.rows);
        }
        catch{
            res.sendStatus(500);
        }
    }

    else if(gameId){
        try{
            const promise = await connection.query(`
                SELECT
                    rentals.*,
                    jsonb_build_object(
                        'id', customers.id,
                        'name', customers.name
                    ) AS customer,
                    jsonb_build_object(
                        'id', games.id,
                        'name', games.name,
                        'categoryId', games."categoryId",
                        'categoryName', categories.name
                    ) AS game
                FROM rentals
                JOIN customers
                    ON rentals."customerId" = customers.id
                JOIN games
                    ON rentals."gameId" = games.id
                JOIN categories
                    ON games."categoryId" = categories.id;
                    WHERE
                    rentals."gameId" = $1;`, 
            [gameId]);
            res.send(promise.rows);
        }
        catch{
            res.sendStatus(500);
        }
    }

    else{
        try {
            const promise = await connection.query(`
                SELECT
                    rentals.*,
                    jsonb_build_object(
                        'id', customers.id,
                        'name', customers.name
                    ) AS customer,
                    jsonb_build_object(
                        'id', games.id,
                        'name', games.name,
                        'categoryId', games."categoryId",
                        'categoryName', categories.name
                    ) AS game
                FROM rentals
                JOIN customers
                    ON rentals."customerId" = customers.id
                JOIN games
                    ON rentals."gameId" = games.id
                JOIN categories
                    ON games."categoryId" = categories.id;
            `);
            res.send(promise.rows);
        }
        catch {
            res.sendStatus(500);
        }    
    }

})

app.post("/rentals", async (req, res) =>{
    const {customerId,gameId,daysRented}= req.body;
    const rentDate = new Date().toISOString().split("T")[0];
    const returnDate=null;
    const delayFee=null;
    try{
        const existClient = await connection.query(`SELECT * FROM customers WHERE id = $1;`, [customerId]);
        const existGame = await connection.query(`SELECT * FROM games WHERE id = $1;`, [gameId]);
        if(!existClient.rows.length || !existGame.rows.length || daysRented <= 0) return res.sendStatus(400)

        const originalPrice= existGame.rows[0].pricePerDay * daysRented;

        const promise = await connection.query(`INSERT INTO rentals (
            "customerId",
            "gameId",
            "rentDate",
            "daysRented",
            "returnDate",
            "originalPrice",
            "delayFee"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee])
        res.sendStatus(201)
    }
    catch{
        res.sendStatus(500)
    }
})
    
app.post("/rentals/:id/return", async (req,res) =>{
    const {id} = req.params;
    const returnDate= new Date().toISOString().split("T")[0];
    try{
        const check = await connection.query("SELECT * FROM rentals WHERE id=$1", [id]);
        if (!check.rows.length) return res.sendStatus(404)
        const delayFee= ((-(new Date(returnDate).getTime() - new Date(check.rows[0].rentDate).getTime())/(1000*60*60)) - check.rows[0].daysRented) * (check.rows[0].originalPrice/check.rows[0].daysRented);
        const promise = await connection.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id= $3;`, [returnDate ,delayFee, id]);
        res.sendStatus(200);
    }
    catch{
        res.sendStatus(500)
    }
})

app.delete("/rentals/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const prom = await connection.query(`SELECT * FROM rentals WHERE id = $1;`, [id]);
        if(!prom.rows.length) return res.sendStatus(404);
        if(prom.rows[0].returnDate) return res.sendStatus(400);

        const promise = await connection.query(`DELETE FROM rentals WHERE id = $1;`, [id]);
        res.sendStatus(200);
    }
    catch {
        res.sendStatus(500);
    }
})


app.listen(4000, ()=>{
    console.log("Server is listening on port 4000.");
})