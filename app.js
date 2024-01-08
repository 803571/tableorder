import express from 'express';
import cookieParser from 'cookie-parser';
import CategoryRouter from './routes/category.router.js';
import MenuRouter from './routes/menu.router.js';
import UsersRouter from './routes/users.router.js';
import errorhandlingMiddleware from './middlewares/errorhandling.middleware.js';


const app = express();
const PORT = 3017;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [CategoryRouter, MenuRouter, UsersRouter]);
app.use(errorhandlingMiddleware);

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});