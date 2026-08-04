import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }
  return secret;
};

export const generateToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    getJwtSecret(),
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    }
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, getJwtSecret());
};
