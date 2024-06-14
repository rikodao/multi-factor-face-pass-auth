import { defineFunction } from '@aws-amplify/backend';

export const preAuthentication = defineFunction({
  name: "pre-sign-in",
  timeoutSeconds: 60
});
