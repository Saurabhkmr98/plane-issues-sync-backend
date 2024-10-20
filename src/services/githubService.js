const { GITHUB_OWNER, GITHUB_REPOSITORY, GITHUB_WEBHOOK_SECRET } = require("../../config");
const { logger } = require("../../utils/logger");
const { githubAPIService } = require("./apiService");


class GithubService {
    async verifySignature(header, payload) {
        let encoder = new TextEncoder();
        let parts = header.split("=");
        let sigHex = parts[1];

        let algorithm = { name: "HMAC", hash: { name: 'SHA-256' } };

        let keyBytes = encoder.encode(GITHUB_WEBHOOK_SECRET);
        let extractable = false;
        let key = await crypto.subtle.importKey(
            "raw",
            keyBytes,
            algorithm,
            extractable,
            ["sign", "verify"],
        );

        let sigBytes = this.hexToBytes(sigHex);
        let dataBytes = encoder.encode(payload);
        let equal = await crypto.subtle.verify(
            algorithm.name,
            key,
            sigBytes,
            dataBytes,
        );

        return equal;
    }

    hexToBytes(hex) {
        let len = hex.length / 2;
        let bytes = new Uint8Array(len);

        let index = 0;
        for (let i = 0; i < hex.length; i += 2) {
            let c = hex.slice(i, i + 2);
            let b = parseInt(c, 16);
            bytes[index] = b;
            index += 1;
        }

        return bytes;
    }


    async fetchAllOpenIssues() {
        try {
            const requestURL = `/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/issues`
            const resp = await githubAPIService.getMethod({ requestURL })
            return resp
        } catch (e) {
            logger.error("Error in fetchAllOpenIssues", { err: e?.messsage })
            throw e
        }
    }

}

module.exports = GithubService;