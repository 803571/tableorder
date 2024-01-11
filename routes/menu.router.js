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
        return res.status(201).json({ Message: "메뉴를 등록하였습니다." });
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

// 메뉴 상세 조회 api 2 (기존 api 입니다.)
// router.get('/category/:categoryId/menu/:menuId', async (req, res, next) => {
//     try {
//         const { categoryId, menuId } = req.params;

//         const menu = await prisma.menu.findUnique({
//             where: {
//                 id: +menuId,
//                 CategoryID: +categoryId,
//             },
//             include: {
//                 Category: true,
//             },
//         });

//         if (!menu) {
//             // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
//             return next(new Error("404"));
//         }

//         res.json(menu);
//     } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
// });

// 메뉴 상세 조회 api 2 (소프트 삭제를 반영한 API 입니다.)
router.get('/category/:categoryId/menu/:menuId', async (req, res, next) => {
    try {
        const { categoryId, menuId } = req.params;

        const menu = await prisma.menu.findUnique({
            where: {
                id: +menuId,
                CategoryID: +categoryId,
                isDeleted: null, // 소프트 삭제된 메뉴를 제외하고.
            },
            include: {
                name: true,
                description: true, // 메뉴 설명 추가
                image: true,
                price: true,
                order: true,
                status: true, //문제 생기면 name 부터 status까지 삭제
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

// // 카테고리별 메뉴 조회 API (기존 조회 API입니다. 백업용)
// router.get('/category/:categoryId/menu', async (req, res, next) => {
//     try {
//         const { categoryId } = req.params;

//         const menu = await prisma.menu.findMany({
//             where: {
//                 CategoryID: +categoryId,
//             },
//             include: {
//                 Category: true,
//             },
//         });

//         if (menu.length === 0) {
//             // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
//             return next(new Error("404"));
//         }

//         res.json(menu);
//     } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
// });

// 카테고리별 메뉴 조회 API (소프트 삭제를 반영합니다.)
router.get('/category/:categoryId/menu', async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const menu = await prisma.menu.findMany({
            where: {
                CategoryID: +categoryId,
                isDeleted: null, // 소프트 삭제된 메뉴를 제외
            },
            orderBy: {
                order: "asc", // 순서에 따라 오름차순으로 정렬합니다.
            },
            include: {
                name: true,
                image: true,
                price: true,
                order: true,
                status: true, //혹시 조회에 문제가 생겼다면 name ~ status는 모두 삭제해보기
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

// 메뉴 수정 API (기존 api입니다.)
// router.patch('/category/:categoryId/menu/:menuId', authMiddleware, async (req, res, next) => {
//     try {
//         const { categoryId, menuId } = req.params;
//         if (req.user.userType !== "Owner") {
//             return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
//         }
//         const { name, description, price, order, status } = await checkMenu.validateAsync(req.body);

//         // 메뉴 가격이 0보다 작은 경우
//         if (price < 0) {
//             return res.status(400).json({ errorMessage: "메뉴 가격은 0보다 작을 수 없습니다." })
//         }

//         // 카테고리 존재 여부 확인
//         const categoryExists = await prisma.category.findUnique({
//             where: { id: +categoryId },
//         });

//         if (!categoryExists) {
//             return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." })
//             // return next(new Error("404"));
//         }

//         // 메뉴 수정
//         // const updatedMenu = await prisma.menu.update({
//         await prisma.menu.update({
//             where: { id: +menuId },
//             data: {
//                 name,
//                 description,
//                 price,
//                 status,
//                 Category: { connect: { id: +categoryId } },
//             },
//         });

//         // res.json({ message: '메뉴를 수정하였습니다.', updatedMenu });
//         res.status(201).json({ message: '메뉴를 수정하였습니다.' });
//     } catch (error) {
//         // menuId에 해당하는 메뉴가 존재하지 않을 경우
//         if (error.code === 'P2025') {
//             return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." })
//         }
//         next(error);
//     }
// });

// 메뉴 수정 API (소프트 삭제를 반영한 API 입니다.)
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

        // 소프트 삭제된 메뉴는 수정할 수 없음
        const existingMenu = await prisma.menu.findUnique({
            where: { id: +menuId },
        });
        if (!existingMenu || existingMenu.isDeleted) {
            return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." })

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

// 메뉴 삭제 API (기존 api입니다.)
// router.delete('/category/:categoryId/menu/:menuId', authMiddleware, async (req, res, next) => {
//     try {
//         const { categoryId, menuId } = req.params;
//         if (req.user.userType !== "Owner") {
//             return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
//         }
//         // categoryId와 menuId가 입력되지 않은 경우
//         if (!categoryId || !menuId) {
//             // return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
//             return next(new Error("400"));
//         }

//         // 카테고리 존재 여부 확인
//         const categoryExists = await prisma.category.findUnique({
//             where: { id: +categoryId },
//         });

//         // categoryId에 해당하는 카테고리가 존재하지 않을 경우
//         if (!categoryExists) {
//             // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
//             return next(new Error("404"));
//         }

//         // 메뉴 삭제
//         const deletedMenu = await prisma.menu.delete({
//             where: { id: +menuId },
//         });

//         // 메뉴가 존재하지 않을 경우
//         if (!deletedMenu) {
//             // return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." });
//             return next(new Error("404"));
//         }

//         res.status(201).json({ Message: "메뉴를 삭제하였습니다." });
//     } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
// });

// 메뉴 삭제 API
router.delete('/category/:categoryId', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
        }

        const category = await prisma.category.findUnique({
            where: { id: +categoryId }
        });

        if (!category) {
            return next(new Error("404"));
        }

        // 카테고리를 소프트 삭제 (isDeleted 필드를 현 시간으로 설정함)
        await prisma.category.update({
            where: {
                id: +categoryId,
            },
            data: {
                isDeleted: new Date()
            }
        });

        // 연관된 모든 메뉴도 소프트 삭제
        await prisma.menu.updateMany({
            where: {
                CategoryID: +categoryId, // 'CategoryID' 필드 사용
                // 추가적으로, isDeleted가 null인 항목만 업데이트할 수 있도록 조건을 추가할 수 있습니다.
                isDeleted: null
            },
            data: {
                isDeleted: new Date()
            }
        });

        return res.status(200).json({ data: "카테고리 정보를 삭제하였습니다." });
    } catch (error) {
        return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
    }
});

// 메뉴 주문 API 1
// router.post('/order', authMiddleware, async (req, res, next) => {
//     try {
//         const { categoryId, menuId } = req.params;
//         const { orderQuantity } = Joi.object({ //주문량
//             orderQuantity: Joi.number().integer().min(1).required(),
//         }).validate(req.body);

//         // 사용자 타입 확인
//         if (req.user.userType !== "Customer") {
//             return res.status(401).json({ errorMessage: "소비자만 사용할 수 있는 API입니다." });
//         }

//         // 메뉴 존재 여부 확인
//         const menu = await prisma.menu.findUnique({
//             where: { id: +menuId, CategoryID: +categoryId },
//         });

//         if (!menu) {
//             return res.status(404).json({ errorMessage: '존재하지 않는 메뉴입니다.' });
//         }

//         // 주문 생성
//         const order = await prisma.order.create({
//             data: {
//                 quantity: orderQuantity,
//                 status: "PENDING", // 주문 대기 상태로 초기화
//                 Menu: { connect: { id: +menuId } },
//                 User: { connect: { id: req.user.id } },
//             },
//         });

//         res.status(201).json({ message: '주문이 완료되었습니다.', order });
//     } catch (error) {
//         if (error.isJoi) {
//             return res.status(400).json({ errorMessage: '데이터 형식이 올바르지 않습니다.' });
//         }
//         next(error);
//     }
// });

// 메뉴 주문 API 2
router.post('/orders', authMiddleware, async (req, res, next) => {
    try {
        if (req.user.userType !== "Customer") { // 주문자의 타입이 Customer가 아니라면
            return res.status(401).json({ errorMessage: "소비자만 사용할 수 있는 API입니다." });
        }
        const { menuId, quantity } = req.body; // 클라이언트가 서버로 보낸 post 요청의 본문 (body). 당신이 insomnia를 통해 메뉴주문 api를 실행할때 집어넣은 그 요청사항입니다.

        // 주문하려는 메뉴가 존재하는지 확인
        const menu = await prisma.menu.findUnique({
            where: { id: +menuId }, //해당 메뉴를 prisma menu 테이블에서 찾습니다. id 필드에서 메뉴의 Id를 찾아내는겁니다.
        });

        if (!menu) {
            return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." });
        }

        // 주문 수량이 유효한지 확인
        if (quantity <= 0) {
            return res.status(400).json({ errorMessage: "주문 수량은 1 이상이어야 합니다." });
        }

        // 주문 생성
        // const order = await prisma.order.create({
        await prisma.order.create({ // 주문이 성공했을 때 아래 내역을 보여주려면 위 코드를 활성화하고 이 코드를 비활성화하세요. 또한, 주문성공 메시지 옆에 order를 붙혀주세요.
            data: {
                menuId: +menuId,
                quantity: +quantity,
                userId: req.user.id,
            },
        });

        res.status(201).json({ message: '주문이 성공적으로 생성되었습니다.' });
    } catch (error) {
        // 메뉴가 존재하지 않을 경우
        // if (error.code === 'P2025') {
        if (!menu) {
            return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다." });
        }
        next(error);
    }
});

// 사용자 주문 내역 조회 API
router.get('/orders/customer', authMiddleware, async (req, res, next) => {
    try {
        if (req.user.userType !== "Customer") {
            return res.status(401).json({ errorMessage: "소비자만 사용할 수 있는 API입니다." });
        }

        const userOrders = await prisma.order.findMany({ // prisma의 Order 테이블에서 주문내역을 찾을겁니다. 여러개면 다 찾아야하니 Many를 사용
            where: {
                userId: req.user.id
            },
            orderBy: {
                createdAt: "desc", // 주문날짜를 기준으로 내림차순 정렬하기
            },
            include: {
                Menu: true, // select : {name, price 가 true일 경우} 의 줄임말
            },
        });

        // 주문 내역이 없는 경우?
        if (userOrders.length === 0) {
            return res.status(404).json({ errorMessage: "주문 내역이 없습니다." });
        }

        // 주문 목록을 응답으로 반환
        res.json(userOrders.map(order => ({
            menuName: order.Menu.name, // 메뉴 이름 ex:) 된장찌개
            menuPrice: order.Menu.price, // 메뉴 금액
            quantity: order.quantity, // 시킨 메뉴의 양
            orderStatus: order.orderType, // 주문상태. 기본적으로 대기상태인 Pending
            orderDate: order.createdAt, // 주문 날짜 및 시각
            totalAmount: order.Menu.price * order.quantity, // 총 금액. 메뉴금액 * 메뉴 양
        })));


    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 사장님 주문 내역 조회 API
router.get('/orders/owner', authMiddleware, async (req, res, next) => {
    try {
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용할 수 있는 API입니다." });
        }

        const userOrders = await prisma.order.findMany({ // prisma의 Order 테이블에서 주문내역을 찾을겁니다. 여러개면 다 찾아야하니 Many를 사용
            // Owner 타입이라면 특별한 경우 없이 모든 주문을 조회할 수 있도록 아래 비활성화
            // where: {
            //     userId: req.user.id
            // },
            orderBy: {
                createdAt: "desc", // 주문날짜를 기준으로 내림차순 정렬하기
            },
            include: {
                Menu: true,
                Users: true, //사용자 정보를 가져오기 위해 추가
            },
        });

        // 주문 내역이 없는 경우?
        if (userOrders.length === 0) {
            return res.status(404).json({ errorMessage: "주문 내역이 없습니다." });
        }

        // 주문 목록을 응답으로 반환
        res.json(userOrders.map(order => ({
            id: order.Users.id,
            nickname: order.Users.nickname,
            menuName: order.Menu.name,
            menuPrice: order.Menu.price,
            quantity: order.quantity,
            orderStatus: order.orderType,
            orderDate: order.createdAt,
            totalAmount: order.Menu.price * order.quantity,
        })));


    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 주문 상태 변경 API
router.patch('/orders/:orderId/status', authMiddleware, async (req, res, next) => {
    try {
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용할 수 있는 API입니다." });
        }

        // 주문한 Id와 주문 상태를 req, 요청으로부터 받아옵니다. insomnia로 입력하는 바로 그것
        const { orderId } = req.params;
        const { "status" : orderType } = req.body;

        // 주문을 찾아서 상태를 바꿔줍니다.
        // const updatedOrder = await prisma.order.update({
        await prisma.order.update({
            where: { id: +orderId },
            data: { orderType },
        })

        // 주문 목록을 응답으로 반환
        res.status(201).json({ message: '주문 내역을 수정하였습니다.' }); //내용 출력을 원하면 메시지 뒤에 , updatedOrder 를 붙히시오.

        // 주문 내역이 없는 경우?
        if (userOrders.length === 0) {
            return res.status(404).json({ errorMessage: "존재하지 않는 주문 내역입니다." });
        }


    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

export default router;