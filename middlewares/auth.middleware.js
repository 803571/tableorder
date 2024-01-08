import jwt from "jsonwebtoken";
import { prisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
    try {
        // 1. 로그인하려는 이에게 쿠키를 전달받아야 합니다.
        const { authorization } = req.cookies; // 쿠키안에 내용이 auth.. 임.
        console.log(authorization);

        // 2. 쿠키가 bearer 형식인지 확인합니다.
        const [tokenType, token] = authorization.split(" "); // split을 쓰면 특정문자열을 기준으로 잘라주게 됨. 공백을 기준으로 자른다는 거고, 이는 토큰에서 %에 해당함.
        // authorization 의 문자열을 보면 왼쪽엔 bearer, 오른쪽에는 실제 jwt 토큰이 들어가므로 분리해준것
        if (tokenType !== "Bearer") throw new Error("토큰 타입이 일치하지 않습니다.");

        // 3. 서버에서 발급한 jwt 토큰이 맞는지 검증합니다.
        const decodedToken = jwt.verify(token, "customized_secret_key"); // users라우터에서 기입한 비밀키
        const userId = decodedToken.id;
        // console.log("토큰내용테스트: ", token);
        // console.log('decodedToken:', decodedToken);
        // console.log('userId: ', userId, 'Type', typeof userId);
        // 4. jwt 의 userId로 사용자 조회
        const user = await prisma.users.findFirst({
            where: { id: { equals : +userId } } // id가 정수형이므로
        })
        if(!user){ //유저를 검색해봤는데 없네? 그럼 토큰을 지워야지 ㅋㅋ
            res.clearCookie("authorization");
            throw new Error("토큰 사용자가 존재하지 않습니다.");
        }
        
        // 5. req.user 에 조회된 사용자 정보를 할당합니다.
        req.user = user;
        console.log('Auth Middleware - User:', req.user);

        // 6. 다음 미들웨어를 실행합니다.
        next();

    } catch (error) {
        res.clearCookie("authorization"); //에러나면 특정 쿠키를 삭제합니다.
        switch (error.name) {
            case "TokenExpiredError": //토큰이 만료되었을 경우
                return res.status(401).json({ errorMessage: "토큰이 만료되었습니다." });
            case "JsonWebTokenError": //토큰 검증 실패했을 때
                return res.status(401).json({ errorMessage: "토큰 인증에 실패했습니다." });
            default: //이외의 에러는 여기로 ~
                return res.status(401).json({ errorMessage: error.message ?? "비정상적인 요청입니다." }); // err.message = 에러에 있는 메시지가 존재할 때 출력, 아닐경우 후자가 출력됨.
        }

    }
}