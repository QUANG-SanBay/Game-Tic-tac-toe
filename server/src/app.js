import express from 'express';
import cors from 'cors';

const app = express();


// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: "Chào mừng bạn đến với Node.js Backend 2025!" });
});


export default app;