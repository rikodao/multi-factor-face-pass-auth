// Import the module to define an Amplify Backend
// Amplify Backendを定義するためのモジュールをインポート
import { defineBackend } from '@aws-amplify/backend';

// Import resources related to authentication
// 認証機能に関するリソースをインポート
import { auth } from './auth/resource';

// Import resources related to generating pre-signed URLs
// 事前署名付きURLを生成する関数に関するリソースをインポート
import { preSignedUrl } from './functions/pre-signed-url/resource';

// Import resources related to storage (S3 bucket)
// ストレージ(S3バケット)に関するリソースをインポート
import { storage } from './storage/resource';

// Import resources related to pre-sign-up (pre-authentication processing for user registration)
// 認証前処理(ユーザー登録前処理)に関するリソースをインポート
import { preSignUp } from './auth/pre-sign-up/resource';

// Import resources related to pre-authentication (pre-authentication processing for login)
// 認証前処理(ログイン前処理)に関するリソースをインポート
import { preAuthentication } from './auth/pre-sign-in/resource'

// Import modules related to AWS IAM service
// AWS IAMサービスに関するモジュールをインポート
import * as iam from 'aws-cdk-lib/aws-iam';

// Import modules related to AWS Systems Manager Parameter Store
// AWS Systems Manager Parameter Storeに関するモジュールをインポート
import * as ssm from 'aws-cdk-lib/aws-ssm';

// Define the Amplify Backend
// Amplify Backendを定義
const backend = defineBackend({
  auth,
  preSignedUrl,
  storage,
  preSignUp,
  preAuthentication
});

// Get the IAM role for unauthenticated users
// 認証されていないユーザーのIAMロールを取得
const unAuthenticatedUserIamRole = backend.auth.resources.unauthenticatedUserIamRole;

// Grant permission for unauthenticated users to execute the function to generate pre-signed URLs
// 認証されていないユーザーに事前署名付きURLを生成する関数を実行する権限を付与
backend.preSignedUrl.resources.lambda.grantInvoke(unAuthenticatedUserIamRole);

// Define an IAM policy statement
// IAMポリシーステートメントを定義
const statement = new iam.PolicyStatement({
  sid: "preSignUpPolicy",
  actions: [
    "rekognition:DetectFaces", // Permission for face detection
    "rekognition:CompareFaces", // Permission for face comparison
    "s3:*", // Full access permission for S3
    "ssm:GetParameter", // Permission to get parameters from Systems Manager Parameter Store
    "cognito-idp:AdminUpdateUserAttributes", // Permission to update user attributes in Cognito User Pool
  ],
  resources: ["*"], // Uncommented to grant access to all resources
})

// Add the policy to the IAM role of the pre-sign-up function
// ユーザー登録前処理関数のIAMロールにポリシーを追加
backend.preSignUp.resources.lambda.addToRolePolicy(statement)

// Add the policy to the IAM role of the pre-authentication function
// ログイン前処理関数のIAMロールにポリシーを追加
backend.preAuthentication.resources.lambda.addToRolePolicy(statement)

// Set custom output values for the Amplify Backend
// Amplify Backendの出力にカスタム値を設定
backend.addOutput({
  custom: {
    preSignedUrlFunctionName: backend.preSignedUrl.resources.lambda.functionName, // Name of the function to generate pre-signed URLs
    bucketName: backend.storage.resources.bucket.bucketName, // Name of the S3 bucket
  },
});

// Add a new attribute to the schema of the Cognito User Pool
// Cognito User Poolのスキーマに新しい属性を追加
const { cfnUserPool } = backend.auth.resources.cfnResources;

if (Array.isArray(cfnUserPool.schema)) {
  cfnUserPool.schema.push({
    name: 'firstLogin', // Attribute name
    attributeDataType: 'Boolean', // Attribute data type
    developerOnlyAttribute: true, // Attribute accessible only by developers
  });
}

// Create a stack for custom resources
// カスタムリソースのためのスタックを作成
const customResourceStack = backend.createStack('MyCustomResources');

// Create a parameter in Systems Manager Parameter Store to store the User Pool ID
// Systems Manager Parameter StoreにユーザープールのIDを保存するパラメータを作成
new ssm.StringParameter(customResourceStack, 'UserPoolIdParameter', {
  parameterName: '/myapp/userPoolId', // Parameter name
  stringValue: backend.auth.resources.userPool.userPoolId, // User Pool ID
});