// DEBUG VERSION - More permissive CORS for troubleshooting
export const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',  // Added for when Vite uses alternate port
            'http://localhost:5175',  // Added for when Vite uses alternate port
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',  // Added for when Vite uses alternate port
            'http://127.0.0.1:5175',  // Added for when Vite uses alternate port
            'http://127.0.0.1:3001',
            process.env.FRONTEND_URL,
            process.env.CORS_ORIGIN
        ].filter(Boolean);

        console.log(`CORS request from origin: ${origin}`);
        console.log(`Allowed origins:`, allowedOrigins);

        if (allowedOrigins.includes(origin)) {
            console.log(`✅ Origin ${origin} is allowed`);
            callback(null, true);
        } else {
            console.log(`❌ Origin ${origin} is NOT allowed`);
            // For debugging, let's allow it anyway
            callback(null, true);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'Access-Control-Allow-Origin'
    ]
};
