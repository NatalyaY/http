import express, { type Request } from "express";
import { Readable } from "node:stream";

const router = express.Router();

type query = Request["query"][keyof Request["query"]]

const getStrByBytes = (n: number) => {
    const length = Math.min(Math.round(n), (10 * 1024 * 1024));
    return Buffer.alloc(length, "Если ты хороший котик, скажи мяу! ");
};
const parseNumber = (n: query, defaultValue: number) => (n && !Number.isNaN(+n)
    ? Math.abs(+n)
    : defaultValue
);

class ReadableByParts extends Readable {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        super({ read() {} });
    }

    readByParts({
        buffer,
        step = 1,
        timeout = 0,
    }: { buffer: Buffer, step?: number, timeout?: number }) {
        const read = (i:number) => {
            if (i > buffer.length - 1) return this.emit("end");

            this.push(buffer.slice(i, i + step));

            setTimeout(() => {
                read(i + step);
            }, timeout * 1000);
        };

        read(0);
    }
}

router.get("/bytes/:n", (req, res) => {
    if (!Number.isInteger(+req.params.n)) {
        res.status(400);
        res.send("Invalid quantity");
        res.end();
        return;
    }
    const bytesArray = getStrByBytes(parseNumber(req.params.n, 60));

    res.status(200);
    res.send(bytesArray);
});

router.get("/drip", (req, res) => {
    const {
        duration,
        bytes,
        delay,
    } = req.query;

    const safeDuration = parseNumber(duration, 0.2);
    const safeBytes = parseNumber(bytes, 60);
    const safeDelay = parseNumber(delay, 0);

    const bytesBuffer = getStrByBytes(safeBytes);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Length", Math.round(safeBytes));

    const readable = new ReadableByParts();
    readable.pipe(res);

    setTimeout(() => {
        readable.readByParts({
            buffer: bytesBuffer,
            timeout: safeDuration,
        });
    }, safeDelay * 1000);
});

router.get("/stream-json/:n", (req, res) => {
    const safeQuantity = parseNumber(req.params.n, 2);
    res.setHeader("Content-Type", "application/json");

    const data = JSON.stringify(req.headers);

    const buffer = Buffer.alloc(safeQuantity * data.length, data);

    const readable = new ReadableByParts();
    readable.pipe(res);

    readable.readByParts({
        buffer,
        step: data.length,
    });
});

router.get("/stream-chunks/:n", (req, res) => {
    const {
        duration,
        size,
    } = req.query;

    const safeDuration = parseNumber(duration, 0.2);
    const safeBytes = parseNumber(req.params.n, 120);
    const safeSize = Math.min(parseNumber(size, Math.floor(safeBytes / 10)), safeBytes);

    const bytesBuffer = getStrByBytes(safeBytes);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Content-Length", Math.round(safeBytes));

    const readable = new ReadableByParts();
    readable.pipe(res);

    readable.readByParts({
        buffer: bytesBuffer,
        step: safeSize,
        timeout: safeDuration,
    });
});

export default router;
