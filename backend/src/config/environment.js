const DEFAULT_PORT = 3000;

function getServerConfig(environment = process.env) {
  const port = Number(environment.PORT || DEFAULT_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT deve ser um número inteiro entre 1 e 65535.");
  }

  return { port };
}

function getDatabaseConfig(environment = process.env) {
  const requiredKeys = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missingKeys = requiredKeys.filter((key) => !environment[key]);

  if (missingKeys.length > 0) {
    throw new Error("Variáveis de banco ausentes: " + missingKeys.join(", ") + ".");
  }

  const port = Number(environment.DB_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT deve ser um número inteiro entre 1 e 65535.");
  }

  return {
    host: environment.DB_HOST,
    port,
    database: environment.DB_NAME,
    username: environment.DB_USER,
    password: environment.DB_PASSWORD
  };
}

function getAuthConfig(environment = process.env) {
  if (!environment.JWT_SECRET || environment.JWT_SECRET.length < 16) {
    throw new Error("JWT_SECRET deve possuir ao menos 16 caracteres.");
  }

  return { jwtSecret: environment.JWT_SECRET };
}

module.exports = { getAuthConfig, getDatabaseConfig, getServerConfig };
