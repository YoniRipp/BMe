import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`CORS origin: ${env.CORS_ORIGIN}`);
});