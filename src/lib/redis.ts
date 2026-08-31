import { createClient, RedisClientType } from "redis";
import { envVars } from "../config/env";

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  async connect(): Promise<void> {
    try {
      const redisUrl = envVars.REDIS_URL;
      this.client = createClient({ url: redisUrl });

      //Handle connection events
      this.client.on("error", (err) => {
        console.error("Redis Client Error: ", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("Redis Client Ready");
        this.isConnected = true;
      });

      this.client.on("end", () => {
        console.log("Redis Client Disconnected");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        console.log("Redis Clint Reconnecting");
      });

      await this.client.connect();
    } catch (error) {
      console.log(error);
    }
  }
  private ensureConnection(): RedisClientType {
    if (!this.client) {
      throw new Error("Redis client not initialized . Call connect() first.");
    }
    if (!this.isConnected) {
        throw new Error("Redis client not connect. ")
    }

    return this.client
  }


}


export const redisService=new RedisService()