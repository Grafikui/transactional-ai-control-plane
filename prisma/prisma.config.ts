import { defineConfig } from '@prisma/cli';

export default defineConfig({
  datasource: {
    db: {
      provider: 'sqlite',
      url: 'file:./dev.db',
    },
  },
});
