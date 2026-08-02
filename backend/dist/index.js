"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const products_1 = __importDefault(require("./routes/products"));
const vendors_1 = __importDefault(require("./routes/vendors"));
const purchase_1 = __importDefault(require("./routes/purchase"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/products', products_1.default);
app.use('/api/vendors', vendors_1.default);
app.use('/api/purchase', purchase_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Rx3000 Backend API', timestamp: new Date() });
});
app.listen(PORT, () => {
    console.log(`🚀 Rx3000 Backend Server listening on http://localhost:${PORT}`);
});
