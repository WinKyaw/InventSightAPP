import { Sequelize } from 'sequelize';
import { DATABASE_CONFIG } from '../config';

// Create Sequelize instance
export const sequelize = new Sequelize({
  dialect: DATABASE_CONFIG.dialect,
  host: DATABASE_CONFIG.host,
  port: DATABASE_CONFIG.port,
  database: DATABASE_CONFIG.database,
  username: DATABASE_CONFIG.username,
  password: DATABASE_CONFIG.password,
  storage: DATABASE_CONFIG.storage, // for SQLite
  logging: DATABASE_CONFIG.logging,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

export default sequelize;