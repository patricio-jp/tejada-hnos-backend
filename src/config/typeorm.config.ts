import { DataSource } from 'typeorm';
import { ENV } from "@config/environment";

/**
 * PostgreSQL DataSource configuration using TypeORM.
 * @requires POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_DATABASE environment variables.
 */
export const PostgreSQLDataSource = new DataSource({
    type: 'postgres',
    host: ENV.POSTGRES_HOST,
    port: +ENV.POSTGRES_PORT,
    username: ENV.POSTGRES_USERNAME,
    password: ENV.POSTGRES_PASSWORD,
    database: ENV.POSTGRES_DATABASE,
    entities: ["src/entities/*.ts"],
    synchronize: true, // Set to false in production
    logging: true,
});

// Un segundo DataSource, que utilizaremos solo para testing:
export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    entities: ["src/entities/*.entity.ts"],
    migrations: [],
    subscribers: [],
    logging: false,
    synchronize: true, // ¡Importante para pruebas! Crea las tablas automáticamente
});

// Helper para inicializar y limpiar la DB en tests
export const initializeTestDatabase = async () => {
    if (!TestDataSource.isInitialized) {
        await TestDataSource.initialize();
    }
    return TestDataSource;
};

export const cleanupTestDatabase = async () => {
    if (TestDataSource.isInitialized) {
        await TestDataSource.destroy();
    }
};

// Helper para limpiar datos entre tests
export const clearDatabase = async () => {
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
        const repository = TestDataSource.getRepository(entity.name);
        await repository.clear();
    }
};
