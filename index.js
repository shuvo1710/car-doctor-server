const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
require("dotenv").config();

// middle ware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1mrcu36.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req,res, next){
const authHeader = req.headers.authorization;
if(!authHeader){
  return res.status(401).send({message: 'unauthorized access'})
}
const token = authHeader.split(' ')[1]
jwt.verify(token,process.env.JWT_Token, function(err,decoded){
  if(err){
    return res.status(401).send({message: 'unauthorized access'})
  }
  req.decoded = decoded
  next()
})

}

async function run() {
  try {
    const serviceCollection = client.db("carDoctor").collection("services");
    const orderCollection = client.db("carDoctor").collection('Orders')

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });


    app.post('/jwt', (req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.JWT_Token, {expiresIn: '10h'})
      res.send({token})
    })
    // order post

    app.get('/orders',verifyJWT, async (req,res)=>{
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        res.status(403).send({message: 'unauthorized access'})
      }
      console.log('inside orders api',decoded)
      let query = {}
      if(req.query.email){
        query = {
          email: req.query.email
        }
      }
      const cursor = orderCollection.find(query)
      const orders = await cursor.toArray();
      res.send(orders)
    })

    app.post('/orders', async(req,res)=>{
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      res.send(result)
    })

    // update

    app.patch('/orders/:id', async(req,res)=>{
      const id = req.params.id;
      const status = req.body.status;
      const query = {_id: ObjectId(id)}
      const updateDoc = {
      $set:{
        status:status
      }
      }
      const result = await orderCollection.updateOne(query,updateDoc)
      res.send(result)

    })

    // order delete
    app.delete('/orders/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)}
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })

  } finally {
  }
}
run().catch((err) => {
  console.log(err);
});
app.get("/", (req, res) => {
  res.send("car doctor server is running");
});

app.listen(port, () => {
  console.log(`car doctor server running on ${port}`);
});
