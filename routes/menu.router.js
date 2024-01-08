import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

const checkMenu = Joi.object({
    name: Joi.string().min(2).max(20).required(),
    description: Joi.string().min(2).max(20),
    image: Joi.string(),
    price: Joi.number(),
    status: Joi.string(),
    // order: Joi.number(),  menu 테이블에 order가 없으므로 Joi 할 필요 없음

})

// 메뉴 등록 API (Create)
router.post('/category/:categoryId/menu', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
        }
        const { name, description, image, price, status } = await checkMenu.validateAsync(req.body);

        // let { status } = req.body; // prisma에서 status 초기값이 for_sale임을 자꾸 인식 못해서 임시로 작성
        // if(!status) { // 이를 수정하려면 이 코드를 주석처리하고 위의 req.body에 status를 추가하시오.
        //     status = "FOR_SALE";
        // }

        const category = await prisma.category.findUnique({
            where: { id: +categoryId }
        });

        if (!name || !description || !image || !price) {
            // return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
            return next(new Error("400"));
        }
        if (!category) {
            // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
            return next(new Error("404"));
        }
        if (price < 0) {
            return res.status(400).json({ errorMessage: "메뉴 가격은 0보다 작을 수 없습니다." });
        }
        // const newMenu = await prisma.menu.create({ // 등록 시 내용을 노출시키지 않기 위해 주석처리
        await prisma.menu.create({
            data: { name, description, image, price, status, CategoryID: +categoryId }
        });
        // return res.status(201).json({ Message: "메뉴를 등록하였습니다.", menu: newMenu }); // 등록 시 내용을 노출시키지 않기 위해 주석처리
        return res.status(201).json({ Message: "메뉴를 등록하였습니다."});
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 메뉴 상세 조회 API
// router.get('/category/:categoryId/menu/:menuId', async (req, res, next) => {
//     try {
//         const { categoryId, menuId } = req.params;
//         const menu = await prisma.menu.findUnique({
//             where: { id: +menuId },
//             select: {
//                 id: true,
//                 name: true,
//                 description: true,
//                 image: true,
//                 price: true,
//                 status: true,
//                 Category: {
//                     select: {
//                         order: true
//                     }
//                 }
//             }
//         });
//         // if (!menu) {
//         if (!menu || menu.Category.id !== +categoryId) {
//             return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
//         }
//         return res.status(200).json({ data: menu });
//     } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
// });

// 메뉴 상세 조회 api 2
router.get('/category/:categoryId/menu/:menuId', async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;

        const menu = await prisma.menu.findUnique({
            where: {
                id: +menuId,
                CategoryID: +categoryId,
            },
            include: {
                Category: true,
            },
        });

        if (!menu) {
            // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
            return next(new Error("404"));
        }

        res.json(menu);
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 카테고리별 메뉴 조회 API
router.get('/category/:categoryId/menu', async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const menu = await prisma.menu.findMany({
            where: {
                CategoryID: +categoryId,
            },
            include: {
                Category: true,
            },
        });

        if (menu.length === 0) {
            // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
            return next(new Error("404"));
        }

        res.json(menu);
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 메뉴 수정 API
router.patch('/category/:categoryId/menu/:menuId', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
        }
        const { name, description, price, order, status } = await checkMenu.validateAsync(req.body);

        // 메뉴 가격이 0보다 작은 경우
        if (price < 0) {
            return res.status(400).json({ errorMessage: "메뉴 가격은 0보다 작을 수 없습니다." }) 
        }

        // 카테고리 존재 여부 확인
        const categoryExists = await prisma.category.findUnique({
            where: { id: +categoryId },
        });

        if (!categoryExists) {
            return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." })
            // return next(new Error("404"));
        }

        // 메뉴 수정
        // const updatedMenu = await prisma.menu.update({
        await prisma.menu.update({
            where: { id: +menuId },
            data: {
                name,
                description,
                price,
                status,
                Category: { connect: { id: +categoryId } },
            },
        });

        // res.json({ message: '메뉴를 수정하였습니다.', updatedMenu });
        res.status(201).json({ message: '메뉴를 수정하였습니다.' });
    } catch (error) {
        // menuId에 해당하는 메뉴가 존재하지 않을 경우
        if (error.code === 'P2025') {
            return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." }) 
        }
        next(error);
    }
});

// 메뉴 삭제 API
router.delete('/category/:categoryId/menu/:menuId', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
        }
        // categoryId와 menuId가 입력되지 않은 경우
        if (!categoryId || !menuId) {
            // return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
            return next(new Error("400"));
        }

        // 카테고리 존재 여부 확인
        const categoryExists = await prisma.category.findUnique({
            where: { id: +categoryId },
        });

        // categoryId에 해당하는 카테고리가 존재하지 않을 경우
        if (!categoryExists) {
            // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
            return next(new Error("404"));
        }

        // 메뉴 삭제
        const deletedMenu = await prisma.menu.delete({
            where: { id: +menuId },
        });

        // 메뉴가 존재하지 않을 경우
        if (!deletedMenu) {
            // return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." });
            return next(new Error("404"));
        }

        res.status(201).json({ Message: "메뉴를 삭제하였습니다." });
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

export default router;