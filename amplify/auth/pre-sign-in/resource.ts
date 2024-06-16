import { defineFunction } from '@aws-amplify/backend';
import { env } from '$amplify/env/pre-signed-url';

export const preAuthentication = defineFunction({
  name: "pre-sign-in",
  timeoutSeconds: 60,
});
