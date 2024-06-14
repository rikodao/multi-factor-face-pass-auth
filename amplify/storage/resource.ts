import { defineStorage } from '@aws-amplify/backend';
import { preSignedUrl } from '../functions/pre-signed-url/resource';
export const storage = defineStorage({
  name: 'amplify-gen2-sign-up-us-east-1',
  access: (allow) => ({
    'sign-up/*': [
      allow.guest.to(['read']),
      allow.resource(preSignedUrl).to(['read', 'write', 'delete'])
    ],
    'sign-in/*': [
      allow.guest.to(['read']),
      allow.resource(preSignedUrl).to(['read', 'write', 'delete'])
    ],
  })
});
