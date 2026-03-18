import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT || 3333);

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`[api] running on http://localhost:${port}`);
  });
}

export default app;
