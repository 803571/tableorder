import express from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

const checkUsers = Joi.object({
    nickname: Joi.string().min(2).max(20).required(),
    password: Joi.string().min(2).max(20).required(),
    userType: Joi.string().insensitive().valid("Owner", "Customer").optional(), // .insensitive() 는 대소문자 구분을 안한다는 뜻이고, 순서를 앞에 둬야 작동합니다.
    // authorization: Joi.string(),

})

// 회원가입 API
router.post('/signup', async (req, res, next) => {
    try {
        const { nickname, password, userType } = await checkUsers.validateAsync(req.body);
        // 입력받은 값이 올바르지 않은지 확인합니다.
        if (!nickname || !password || !userType) {
            // return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
            return next(new Error("400")); // 그 어떤 형식에 어긋나도 모두 같은 메시지를 반환함.
        }

        // 입력받은 닉네임이 중복된 값인지 확인합니다.
        const duplicateValue = await prisma.users.findFirst({
            where: { nickname },
        });
        if (duplicateValue) {
            return res.status(409).json({ errorMessage: "중복된 닉네임입니다." });
        }
        // 비밀번호 기입할 때 암호화되도록, 얼마나 복잡하게 꼬을 것이냐 = 10회
        // const hashedPassword = await bcrypt.hash(password, 10);

        // 회원가입에 필요한 정보를 받습니다. 
        await prisma.users.create({
            data: {
                nickname,
                password,
                // password: hashedPassword, // 암호화된 데이터.. 인데 그냥 비활성화시킴. 작동하긴 합니다.
                userType, // owner Owner 같아야하므로 toUppercase() 를 줬는데, 위에 insensitive 를 주면 없어도 돼
                // authorization: authorization.toUpperCase(), // owner Owner 같아야하므로
            }
        });
        // 회원가입이 완료되었음.
        return res.status(201).json({ errorMessage: "회원가입이 완료되었습니다." });
    } catch (error) { return res.status(400).json({ eerrorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

// 로그인 API
router.post('/signin', async (req, res, next) => {
    try {
        const { nickname, password } = await checkUsers.validateAsync(req.body);

        const user = await prisma.users.findFirst({
            where: { nickname },
        });
        if (!nickname || !password) {
            return next(new Error("400")); // 그 어떤 형식에 어긋나도 모두 같은 메시지를 반환함.
        }

        if (!nickname) {
            return res.status(401).json({ errorMessage: "존재하지 않는 닉네임입니다." });
        }

        if (user.password !== password) {
            return res.status(401).json({ errorMessage: "비밀번호가 일치하지 않습니다." });
        }
        // if (!password) {
        //     return res.status(401).json({ errorMessage: "비밀번호가 일치하지 않습니다." });
        // }

        // 암호화된 비밀번호 일치하는지 체크하는 기능. 회원가입 api에서 암호화하는 기능을 만들었으나 비활성화하였으므로 마찬가지로 비활성화한다.
        // if (!await bcrypt.compare(password, user.password)) {
        //     return res.status(401).json({ errorMessage: "비밀번호가 일치하지 않습니다." });
        // }

        // 로그인 성공하면 jwt 토큰을 발급해주기
        const token = jwt.sign(
            {
                id: user.id // userid는 56번째 줄에서 찾은 user를 뜻한다.
            },
            "customized_secret_key", // 비밀 키. jwt 토큰을 서명할 때 필요하다.
        )
        // console.log('Generated Token:', token); //잘 생성 됐는지 확인용
        res.cookie("authorization", `Bearer ${token}`);
        return res.status(200).json({ Message: "로그인에 성공하였습니다." });

    } catch (error) { return res.status(400).json({ eerrorMessage: "데이터 형식이 올바르지 않습니다." }) };
});

export default router;

