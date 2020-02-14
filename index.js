require('dotenv').config()
const express = require('express')
const app = express()
const {getAsanaPoints} = require('./models/asana');


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
