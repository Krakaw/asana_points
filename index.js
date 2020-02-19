require('dotenv').config()
const cron = require('node-cron');
const express = require('express')
const app = express()
const {getAsanaPoints} = require('./models/asana');

cron.schedule("*/4 * * * *", getAsanaPoints(true), {scheduled: true});

app.use(express.json())

app.get('/', async (req, res) => {
    const force = req.query.force || false;
    const points = await getAsanaPoints(force);
    return res.json(points);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
});
