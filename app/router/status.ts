import express from "express";
import codesData from "../helpers/statusCodes";

const router = express.Router();

const prepareCodes = (codesString: string) => codesString.split(",")
    .map(code => +code)
    .filter(code => code >= 100 && code <= 511)
    .filter(Boolean);

router.use("/:codes?", (req: express.Request, res: express.Response) => {
    const { codes } = req.params;

    if (!codes) {
        res.status(200);
        res.end();
        return;
    }

    const cleanedCodes = prepareCodes(codes);

    if (!cleanedCodes.length) {
        res.status(400);
        res.send("Invalid code");
        return;
    }

    const randomIndex = Math.round(Math.random() * (cleanedCodes.length - 1));
    const code = cleanedCodes[randomIndex];

    res.status(code);

    if (codesData[code]) {
        const codeData = codesData[code];
        if (codeData.headers) {
            res.set(codeData.headers);
        }
        if (codeData.body) {
            res.send(codeData.body);
        }
    }

    res.end();
});

export default router;
