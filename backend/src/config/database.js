const { getDatabaseConfig } = require("./environment");

const config = getDatabaseConfig();

module.exports = {
  development: {
    ...config,
    dialect: "postgres",
    logging: false
  },
  test: {
    ...config,
    database: process.env.DB_TEST_NAME || config.database,
    dialect: "postgres",
    logging: false
  }
};
