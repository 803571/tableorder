import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

// import authMiddlewares from '../middlewares/auth.middleware.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

const checkCategory = Joi.object({
    name: Joi.string().min(2).max(20).required(),
    order: Joi.number(),
})

// 카테고리 등록 API
router.post('/category', authMiddleware, async (req, res, next) => {
    try {
        // console.log(req.user);
        const { id } = req.user;
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
        }
        const { name, order } = await checkCategory.validateAsync(req.body);
        // const category = await prisma.category.create({ // 앞에 변수 선언 지워도 작동함..!!!
        await prisma.category.create({
            data: {
                userId : id, // 컬럼명 : 위에서 가져오는 값
                name,
                order
            }
        });
        if (!name || !order) {
            // return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
            return next(new Error("400"));
        }
        // return res.status(201).json({ data: category }); // 변수 선언 안했으니 지우는데, 원래는 카테고리등록값이 나옴
        return res.status(201).json({ Message: "카테고리를 등록하였습니다." });
        } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
    // } catch (err) {
    //     next(err)
    // }
});

// 카테고리 조회 API (기존 api 입니다.)
// router.get('/category', async (req, res, next) => {
//     try {
//         const category = await prisma.category.findMany({
//             select: { // 아래에 특정 column 을 false 처리해서 안나오게 할 수 있지만, select 로 특정 column을 true로 설정하지 않으면 자동적으로 해당 column이 조회되지 않음
//                 id: true,
//                 name: true,
//                 order: true,
//             },
//         });
//         return res.status(200).json({ data: category });
//     } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
// });

// 카테고리 조회 API (소프트 삭제를 반영한 API 입니다.)
router.get('/category', async (req, res, next) => {
    try {
        const category = await prisma.category.findMany({
            where: {
                deletedAt: null // 소프트 삭제된 항목을 제외
            },

            select: { // 아래에 특정 column 을 false 처리해서 안나오게 할 수 있지만, select 로 특정 column을 true로 설정하지 않으면 자동적으로 해당 column이 조회되지 않음
                id: true,
                name: true,
                order: true,
            },

            orderBy: {
                order: "asc" //지정된 순서대로 정렬
            },
        });
        return res.status(200).json({ data: category });
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 카테고리 수정 API
router.patch('/category/:categoryId', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId } = req.params; // 수정하고자 하는 카테고리의 고유id값을 받아온다~
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
        }

        // 입력한 값의 유효성 검사
        const { name, order } = await checkCategory.validateAsync(req.body); // 카테고리이름을 body에 뿌려준다~
        if (!name || !order) {
            // return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
            return next(new Error("400"));
        }

        // 카테고리 존재 여부 및 소프트 삭제의 여부 화긴
        const category = await prisma.category.findUnique({
            where: { id: +categoryId }
        });
        // prisma 라는 ORM라이브러리를 사용해서 db에서 특정 카테고리 정보를 가져오려는 코드임
        // category.findUnique는 db에서 유일한 하나의 레코드를 찾아오는 역할을 하고
        // await는 그때까지 기다리라는 의미임
        // where 절은 db에서 어떤 레코드를 찾을지 지정하는거고
        // id필드가 categoryId와 일치하는 레코드를 찾으라는거임. +가 붙으면 그 변수를 정수로 강제변환하는거고
        // = categoryId에 해당하는 정보를 갖고와서 category에 할당하는 역할이니 기억안나면 이거라도 읽어라

        // if (!category) {    //기존 코드
        //     return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
        // }

        if (!category || category.isDeleted) { // isDeleted 필드를 확인합니다.
            return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
        }

        await prisma.category.update({
            data: { name, order },
            where: {
                id: +categoryId
            }
        })
        return res.status(200).json({ data: "카테고리 정보를 수정하였습니다." });
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 카테고리 삭제 API
router.delete('/category/:categoryId', authMiddleware, async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        if (req.user.userType !== "Owner") {
            return res.status(401).json({ errorMessage: "사장님만 사용 가능한 API입니다." });
        }
        
        const category = await prisma.category.findUnique({
            where: { id: +categoryId }
        });

        // if (!categoryId) {
        //     // return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
        //     return next(new Error("400"));
        // }
        
        if (!category) {
            // return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
            return next(new Error("404"));
        }

        // 기존 삭제 기능
        // await prisma.category.delete({
        //     where: {
        //         id: +categoryId,
        //     }
        // })
        // return res.status(200).json({ data: "카테고리 정보를 삭제하였습니다." });
        
        // 카테고리를 소프트 삭제 (idDeleted 필드를 현 시간으로 설정함)
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
                categoryId: +categoryId,
            },
            data: {
                isDeleted: new Date()
            }
        });

        return res.status(200).json({ data: "카테고리 정보를 삭제하였습니다." });
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

export default router;