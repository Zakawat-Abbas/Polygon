const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/stockData', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const stockDataSchema = new mongoose.Schema({
    symbol: String,
    date: Date,
    closingPrice: Number,
});

const StockData = mongoose.model('StockData', stockDataSchema);

app.use(express.json());

app.get('/stock/:symbol/:startDate/:endDate', async (req, res) => {
    const { symbol, startDate, endDate } = req.params;

    try {
        const dataFromDB = await StockData.find({
            symbol,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        if (dataFromDB.length > 0) {
            res.json(dataFromDB);
        } else {
            const polygonApiKey = 'i2WuoplBhZP7jeU5g1fpi6t7Xkn4Kc98';
            const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?apiKey=${polygonApiKey}`;

            const response = await axios.get(polygonUrl);
            const stockData = response.data.results.map((result) => ({
                symbol,
                date: new Date(result.t),
                closingPrice: result.c,
            }));

            await StockData.insertMany(stockData);

            res.json(stockData);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
