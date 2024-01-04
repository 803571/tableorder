import express from 'express';
import CategoryRouter from './routes/category.router.js';
import MenuRouter from './routes/menu.router.js';

const app = express();
const PORT = 3017;

app.use(express.json());
app.use('/api', [CategoryRouter, MenuRouter]);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});