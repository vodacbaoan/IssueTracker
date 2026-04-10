import { buildApp } from './app';
import { loadConfig } from './config/env';

async function start(): Promise<void> {
  const config = loadConfig();
  const { app, close } = await buildApp({ config });
  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`Server listening at http://${config.HOST}:${config.PORT}`);
  });

  const closeApp = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    await close();
  };

  process.on('SIGINT', () => {
    void closeApp().finally(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    void closeApp().finally(() => process.exit(0));
  });
}

void start().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
