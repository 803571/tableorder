import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.


// 카테고리 등록 API
router.post('/category', async (req, res, next) => {
    try {
        const { name, order } = req.body;
        const category = await prisma.category.create({
            data: {
                name,
                order
            }
        });
        if (!name || !order) {
            return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
        }
        // return res.status(201).json({ data: category });
        return res.status(201).json({ Message: "카테고리를 등록하였습니다." });
    } catch (error) { return res.status(400).json({ eerrorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 카테고리 조회 API
router.get('/category', async (req, res, next) => {
    try {
        const category = await prisma.category.findMany({
            select: { // 아래에 특정 column 을 false 처리해서 안나오게 할 수 있지만, select 로 특정 column을 true로 설정하지 않으면 자동적으로 해당 column이 조회되지 않음
                id: true,
                name: true,
                order: true,
            },
        });
        return res.status(200).json({ data: category });
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 카테고리 수정 API
router.patch('/category/:categoryId', async (req, res, next) => {
    try {
        const { categoryId } = req.params; // 수정하고자 하는 카테고리의 고유id값을 받아온다~
        const { name, order } = req.body; // 카테고리이름을 body에 뿌려준다~
        if (!name || !order) {
            return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
        }

        const category = await prisma.category.findUnique({ // 너가 못알아볼거 아니까 도움되라고 써둔다 50번째줄 참고
            where: { id: +categoryId }
        });
        // prisma 라는 ORM라이브러리를 사용해서 db에서 특정 카테고리 정보를 가져오려는 코드임
        // category.findUnique는 db에서 유일한 하나의 레코드를 찾아오는 역할을 하고
        // await는 그때까지 기다리라는 의미임
        // where 절은 db에서 어떤 레코드를 찾을지 지정하는거고
        // id필드가 categoryId와 일치하는 레코드를 찾으라는거임. +가 붙으면 그 변수를 정수로 강제변환하는거고
        // = categoryId에 해당하는 정보를 갖고와서 category에 할당하는 역할이니 기억안나면 이거라도 읽어라

        if (!category) {
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
router.delete('/category/:categoryId', async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        if (!categoryId) {
            return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
        }
        const category = await prisma.category.findUnique({
            where: { id: +categoryId }
        });
        if (!category) {
            return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
        }

        await prisma.category.delete({
            where: {
                id: +categoryId,
            }
        })
        return res.status(200).json({ data: "카테고리 정보를 삭제하였습니다." });
    } catch (error) { return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

export default router;