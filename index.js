require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
    res.send("Laptob Details server is running");
});

// MongoDb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4bvpsnf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        const allLaptops = client.db("LaptopDetailsDB").collection("laptops");

        // All Laptops

        app.get("/laptops", async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const category = req.query.category;
            const brand = req.query.brand;
            const priceSort = req.query.priceSort;
            const minPrice = parseFloat(req.query.minPrice);
            const maxPrice = parseFloat(req.query.maxPrice);
            const byDate = req.query.ByDate;
            const search = req.query.search;

            let query = {};
            let sort = {};
            // console.log(category);

            if (category) {
                query.category = category;
            }
            if (brand) {
                query.brand = brand;
            }

            if (priceSort === "lowtohigh") {
                sort.price = 1;
            } else if (priceSort === "hightolow") {
                sort.price = -1;
            }

            if (byDate === "newest") {
                sort.createdAt = -1;
            } else if (byDate === "oldest") {
                sort.createdAt = 1;
            }

            if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                query.price = { $gte: minPrice, $lte: maxPrice };
            } else if (!isNaN(minPrice)) {
                query.price = { $gte: minPrice };
            } else if (!isNaN(maxPrice)) {
                query.price = { $lte: maxPrice };
            }

            if (search) {
                query.productName = { $regex: search, $options: "i" }; // Case-insensitive search
            }

            const result = await allLaptops
                .find(query)
                .sort(sort)
                .skip(page * size)
                .limit(size)
                .toArray();
            res.send(result);
        });

        app.get("/LaptopsCount", async (req, res) => {
            const category = req.query.category;
            const brand = req.query.brand;
            const minPrice = parseFloat(req.query.minPrice);
            const maxPrice = parseFloat(req.query.maxPrice);
            const search = req.query.search;

            let query = {};

            if (category) {
                query.category = category;
            }
            if (brand) {
                query.brand = brand;
            }

            if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                query.price = { $gte: minPrice, $lte: maxPrice };
            } else if (!isNaN(minPrice)) {
                query.price = { $gte: minPrice };
            } else if (!isNaN(maxPrice)) {
                query.price = { $lte: maxPrice };
            }

            if (search) {
                query.productName = { $regex: search, $options: "i" }; // Case-insensitive search
            }

            const count = await allLaptops.countDocuments(query);
            res.send({ count });
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Port is running on ${port}`);
});
