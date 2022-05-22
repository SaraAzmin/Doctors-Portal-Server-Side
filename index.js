const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//midddlewere
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ecln5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');

        //all services loaded
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        //get only available slots
        app.get('/available', async (req, res) => {

            const date = req.query.date;

            //first get all services
            const services = await serviceCollection.find().toArray();

            //then get the booking of that day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            //for each service, find bookings
            services.forEach(service => {

                //find bookings for this service
                const bookingList = bookings.filter(b => b.treatment === service.name);

                //make an array of the booked slots
                const bookedSlots = bookingList.map(s => s.slot);

                //take only the slots that are not booked yet
                const available = service.slots.filter(s => !bookedSlots.includes(s));

                //set available ones to slot
                service.slots = available;

            })

            res.send(services);

        })

        //add a new booking
        app.post('/booking', async (req, res) => {
            const booking = req.body;

            const query = { treatment: booking.treatment, date: booking.date, patiant: booking.patiant };
            const exist = await bookingCollection.findOne(query);

            //do not add if already exists booking for same day and same treatment
            if (exist) {
                return res.send({ success: false, booking: exist });
            }
            const result = await bookingCollection.insertOne(booking);
            res.send({ success: true, result });

        })

    }

    finally {

    }

}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from doctor!')
})

app.listen(port, () => {
    console.log(`doctors app listening on port ${port}`)
})