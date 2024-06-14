import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { preSignedUrl } from './functions/pre-signed-url/resource';
import { storage } from './storage/resource';
import { preSignUp } from './auth/pre-sign-up/resource';
import { preAuthentication } from './auth/pre-sign-in/resource'
import * as iam from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  preSignedUrl,
  storage, 
  preSignUp,
  preAuthentication
});

const unAuthenticatedUserIamRole = backend.auth.resources.unauthenticatedUserIamRole;
backend.preSignedUrl.resources.lambda.grantInvoke(unAuthenticatedUserIamRole);


const statement = new iam.PolicyStatement({
  sid: "preSignUpPolicy",
  actions: [
    "rekognition:DetectFaces",
    "rekognition:CompareFaces",
    "s3:*",
  ],
  resources: ["*"],
  // resources: [
  //   backend.preSignUp.resources.lambda.functionArn,
  //   backend.preAuthentication.resources.lambda.functionArn,
  // ],
})


backend.preSignUp.resources.lambda.addToRolePolicy(statement)
backend.preAuthentication.resources.lambda.addToRolePolicy(statement)


backend.addOutput({
  custom: {
    preSignedUrlFunctionName: backend.preSignedUrl.resources.lambda.functionName,
    bucketName: backend.storage.resources.bucket.bucketName,
  },
});