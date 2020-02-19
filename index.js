require('dotenv').config()
const cron = require('node-cron');
const express = require('express')
const app = express()
const {getAsanaPoints} = require('./models/asana');
const {CRON_FETCH_MINUTES} = process.env;


if (CRON_FETCH_MINUTES) {
    cron.schedule(`*/${CRON_FETCH_MINUTES} * * * *`, getAsanaPoints.bind(this, true), {scheduled: true});
}


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
