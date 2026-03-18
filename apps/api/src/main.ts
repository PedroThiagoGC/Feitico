import "reflect-metadata";
import { createApp } from "./app";

async function bootstrap() {
  const app = await createApp();

  const port = process.env.PORT || 3333;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
