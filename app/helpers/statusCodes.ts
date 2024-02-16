const redirectLocation = "/redirect";

interface CodesData {
    [k: number]: {
        headers?: {[k: string]: string;};
        body?: {[k: string]: string;};
    }
}

export default {
    301: { headers: { Location: redirectLocation } },
    302: { headers: { Location: redirectLocation } },
    303: { headers: { Location: redirectLocation } },
    307: { headers: { Location: redirectLocation } },
    308: { headers: { Location: redirectLocation } },
    401: { headers: { "WWW-Authenticate": "Basic realm='Basic'" } },
    406: { body: { accept: "application/json" } },
    407: { headers: { "Proxy-Authenticate": "Basic realm='Basic'" } },
    408: { headers: { Connection: "Close" } },
    426: {
        headers: {
            Upgrade: "HTTP/2.0",
            Connection: "Upgrade",
        },
    },
} as CodesData;
