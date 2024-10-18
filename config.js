const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT: process.env.PORT,
    GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    PLANE_API_KEY: process.env.PLANE_API_KEY,
    PLANE_WORKSPACE_SLUG: process.env.PLANE_WORKSPACE_SLUG,
    PLANE_PROJECT_ID: process.env.PLANE_PROJECT_ID,
};