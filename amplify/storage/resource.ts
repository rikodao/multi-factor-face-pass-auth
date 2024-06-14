import { defineStorage } from '@aws-amplify/backend';
import { preSignedUrl } from '../functions/pre-signed-url/resource';
import { preSignUp } from '../auth/pre-sign-up/resource';
import { preAuthentication } from '../auth/pre-sign-in/resource'
export const storage = defineStorage({
  name: 'multifactor-authentication-password-face-us-east-1',
  access: (allow) => ({
    'sign-up/*': [
      allow.resource(preSignedUrl).to(['read', 'write', 'delete']),
      allow.resource(preSignUp).to(['read', 'write', 'delete']),
    ],
    'sign-in/*': [
      allow.resource(preSignedUrl).to(['read', 'write', 'delete']),
      allow.resource(preAuthentication).to(['read', 'write', 'delete'])

    ],
  })
});
