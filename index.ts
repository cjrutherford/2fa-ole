import express from 'express';
import * as bp from 'body-parser';
import apiRouter from './api.router';

const app = express();

app.use(bp.json())
app.use(bp.urlencoded({extended: true}));

app.get('/', express.static('client/build'));

app.use('/api', apiRouter)

app.listen(3000, () => {
    console.log(`Running on port: ${3000}`);
});