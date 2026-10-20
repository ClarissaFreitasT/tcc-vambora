import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client.js";
import { databaseConfig } from "./database.js";

const adapter = new PrismaMariaDb(databaseConfig());

const prisma = new PrismaClient({ adapter });

export { prisma };
