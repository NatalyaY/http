import express from "express";

const router = express.Router();

const handleResponse = (
    req: express.Request,
    res: express.Response,
) => {
    if (req.method.toLowerCase() !== req.path.slice(1)) {
        res.status(405);
        res.end();
        return;
    }
    res.status(200);
    res.end();
};

router.use("/get", handleResponse);
router.use("/post", handleResponse);
router.use("/delete", handleResponse);
router.use("/put", handleResponse);
router.use("/patch", handleResponse);

export default router;
