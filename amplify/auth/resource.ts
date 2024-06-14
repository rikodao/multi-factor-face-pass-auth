import { defineAuth } from '@aws-amplify/backend';
import { preSignUp } from './pre-sign-up/resource';
import { preAuthentication } from './pre-sign-in/resource'




/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    address: {
      mutable: true,
      required: true,
    }
  },
  triggers: {
    preSignUp,
    preAuthentication
  }
});
