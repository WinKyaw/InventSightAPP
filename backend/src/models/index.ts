import { sequelize } from '../config/database';
import User from './User';

// Initialize all models
const models = {
  User,
};

// Define associations here if needed
// Example:
// User.hasMany(Post);
// Post.belongsTo(User);

export { sequelize, User };
export default models;