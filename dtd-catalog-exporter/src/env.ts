import dotenv from "dotenv";
import { envSchema } from "./models/Env.js";

dotenv.config();
export const env = envSchema.parse(process.env);
