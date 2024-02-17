import { createHash } from "node:crypto";

const encodeBase64 = (data: string) => Buffer
    .from(data)
    .toString("base64");

const decodeBase64 = (data: string) => Buffer
    .from(data, "base64")
    .toString("utf8");

const createHashWithAlgo = (data: string, algorithm: string) => createHash(algorithm)
    .update(data)
    .digest("hex");

export {
    encodeBase64, decodeBase64, createHashWithAlgo,
};
