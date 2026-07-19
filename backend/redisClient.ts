import Redis from "ioredis";

export const client = new Redis({
    host : process.env.REDIS_HOST,
    username : process.env.REDIS_USERNAME,
    password : process.env.REDIS_PASSWORD,
    port : Number(process.env.REDIS_PORT),
    maxRetriesPerRequest : null
})
