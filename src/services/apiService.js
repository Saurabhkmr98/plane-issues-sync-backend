const { logger } = require("../../utils/logger");
const axios = require('axios');
const { GITHUB_API_TOKEN, PLANE_API_KEY } = require("../../config");

class APIService {
    constructor(basePath, headers) {
        this.API_BASE_PATH = basePath;
        this.headers = headers;
    }

    async apiMethod({ method = 'post', requestURL, requestBody = {} }) {
        try {
            const response = await axios({
                method: method,
                url: `${this.API_BASE_PATH}${requestURL}`,
                data: { ...requestBody },
                headers: this.headers,
            });

            return response.data;
        } catch (error) {
            logger.error(`Error in API call: ${error.message}`);
            throw error;
        }
    }

    async getMethod({ requestURL }) {
        try {
            return this.apiMethod({ method: "get", requestURL });
        } catch (error) {
            logger.error(`Error in API getMethod call: ${error.message}`);
            throw error;
        }
    }

    async postMethod({ requestURL, requestBody }) {
        try {
            return this.apiMethod({ method: "post", requestURL, requestBody });
        } catch (error) {
            logger.error(`Error in API postMethod call: ${error.message}`);
            throw error;
        }
    }

    async patchMethod({ requestURL, requestBody }) {
        try {
            return this.apiMethod({ method: "patch", requestURL, requestBody });
        } catch (error) {
            logger.error(`Error in API patchMethod call: ${error.message}`);
            throw error;
        }
    }
}

// Initializing service
const githubAPIService = new APIService(
    `https://api.github.com`,
    {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${GITHUB_API_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28"
    }
);


const planeAPIService = new APIService(
    `https://api.plane.so/api/v1`,
    {
        "Content-Type": "application/json",
        "x-api-key": PLANE_API_KEY,
    }
)

module.exports = {
    githubAPIService,
    planeAPIService
};
