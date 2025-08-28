import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User as UserInterface } from '../types';

// Define the model attributes interface
interface UserAttributes extends UserInterface {}

// Define creation attributes (excluding auto-generated fields)
interface UserCreationAttributesInternal extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'emailVerified'> {}

// Define the User model class
class User extends Model<UserAttributes, UserCreationAttributesInternal> implements UserAttributes {
  public id!: string;
  public email!: string;
  public name!: string;
  public role!: string;
  public emailVerified!: boolean;
  public passwordHash!: string;
  public emailVerificationToken!: string | null;
  public emailVerificationExpires!: Date | null;
  public passwordResetToken!: string | null;
  public passwordResetExpires!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Static methods for common operations
  static async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: email.toLowerCase() } });
  }

  static async findByEmailVerificationToken(token: string): Promise<User | null> {
    return User.findOne({ 
      where: { 
        emailVerificationToken: token,
        emailVerificationExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      } 
    });
  }

  static async findByPasswordResetToken(token: string): Promise<User | null> {
    return User.findOne({ 
      where: { 
        passwordResetToken: token,
        passwordResetExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      } 
    });
  }

  // Instance methods
  public toJSON(): any {
    const values = Object.assign({}, this.get());
    // Remove sensitive data
    delete (values as any).passwordHash;
    delete (values as any).emailVerificationToken;
    delete (values as any).passwordResetToken;
    return values;
  }

  public toPublicJSON(): any {
    const user = this.toJSON();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }
}

// Initialize the model
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
      unique: {
        name: 'users_email_unique',
        msg: 'Email address is already registered'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        len: {
          args: [1, 254],
          msg: 'Email must be between 1 and 254 characters'
        }
      },
      set(value: string) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Name must be between 2 and 100 characters'
        },
        is: {
          args: /^[a-zA-Z\s'-]{2,100}$/,
          msg: 'Name can only contain letters, spaces, hyphens, and apostrophes'
        }
      },
      set(value: string) {
        this.setDataValue('name', value.trim());
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      allowNull: false,
      defaultValue: 'user',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [60, 255], // bcrypt hashes are 60 characters
          msg: 'Invalid password hash format'
        }
      }
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['email_verification_token'],
      },
      {
        fields: ['password_reset_token'],
      },
      {
        fields: ['created_at'],
      },
    ],
    hooks: {
      beforeValidate: (user: User) => {
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        if (user.name) {
          user.name = user.name.trim();
        }
      },
    },
  }
);

export default User;