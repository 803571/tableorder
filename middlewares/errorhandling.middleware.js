// errorhandling.middleware.js

export default (err, req, res, next) => {
    console.error(err); // 에러를 콘솔에 출력하거나 로깅하는 등의 작업도 가능합니다.

    if (err.message === "400") {
        return res.status(400).json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
    } 
    if (err.message === "404") {
        return res.status(404).json({ errorMessage: "존재하지 않는 카테고리입니다." });
    } 

    // 기본적으로 500 Internal Server Error를 반환합니다.
    return res.status(500).json({ errorMessage: "서버 오류입니다." });
};
