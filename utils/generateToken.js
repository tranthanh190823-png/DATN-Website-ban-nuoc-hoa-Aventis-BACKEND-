import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d'
    });

    // Option: You can also set it as an HTTP-only cookie if you want, 
    // but typically for standard APIs we just return the token to the client.
    // However, if we do cookie:
    // res.cookie('jwt', token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    //     sameSite: 'strict', // Prevent CSRF attacks
    //     maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    // });
    
    return token;
};

export default generateToken;
