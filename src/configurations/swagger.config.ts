import { registerAs } from '@nestjs/config';
import { DocumentBuilder } from '@nestjs/swagger';
import * as env from 'env-var';

export const SwaggerConfig = registerAs('SwaggerConfig', () => ({
  title: env.get('SWAGGER_TITLE').required().asString(),
  description: env.get('SWAGGER_DESCRIPTION').required().asString(),
  version: env.get('SWAGGER_VERSION').required().asString(),
  apiPrefix: env.get('API_PREFIX').default('api').asString(),
}));

export const createSwaggerDocument = (
  config: ReturnType<typeof SwaggerConfig>,
) => {
  return new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .addBearerAuth()
    .build();
};

export default SwaggerConfig;
