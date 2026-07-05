import jwt from 'jsonwebtoken';

export const generateToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    }
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
};
