import type { PreAuthenticationTriggerHandler } from "aws-lambda"
const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
// Rekognition クライアントの作成
// Create Rekognition client
const client = new RekognitionClient({});
import { env } from '$amplify/env/pre-sign-in';
// 顔画像が保存されている S3 バケット名
// S3 bucket name where face images are stored
const bucketName = env.MULTIFACTOR_AUTHENTICATION_PASSWORD_FACE_US_EAST_1_BUCKET_NAME;

import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// SSM クライアントの作成
// Create SSM client
const ssmClient = new SSMClient({});

// ユーザープールIDを取得する非同期関数
// Asynchronous function to get the user pool ID
const getUserPoolId = async (): Promise<string> => {
  const command = new GetParameterCommand({
    Name: "/myapp/userPoolId",
  });

  try {
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || "";
  } catch (error) {
    console.error("Error retrieving parameter:", error);
    throw error;
  }
};

// ユーザープールIDを非同期で取得
// Get the user pool ID asynchronously
const userPoolId = await getUserPoolId();

import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
// Cognito クライアントの作成
// Create Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ });

// ユーザーのメールアドレスを検証する非同期関数
// Asynchronous function to verify user's email address
async function verifyEmail(userPoolId: string, username: string, email: string) {
  try {
    // AdminUpdateUserAttributesCommand のパラメータを設定
    // Set parameters for AdminUpdateUserAttributesCommand
    const params = {
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        {
          Name: "email",
          Value: email
        },
        {
          Name: "email_verified",
          Value: "true"
        }
      ]
    };

    // コマンドの作成
    // Create the command
    const command = new AdminUpdateUserAttributesCommand(params);

    // コマンドの送信
    // Send the command
    const response = await cognitoClient.send(command);
    console.log("Email verified successfully:", response);
  } catch (error) {
    console.error("Error verifying email:", error);
  }
}

// PreAuthenticationTriggerHandler の実装
// Implementation of PreAuthenticationTriggerHandler
export const handler: PreAuthenticationTriggerHandler = async (event) => {
  // ユーザー名とメールアドレスを取得
  // Get the username and email address
  const username = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;

  console.log({ userPoolId, username, email });

  console.log(event.request);
  // メールアドレスが検証されていない場合
  // If the email address is not verified
  if (event.request.userAttributes.email_verified == "false") {
    console.log("first Login");
    // メールアドレスを検証
    // Verify the email address
    await verifyEmail(userPoolId, username, email);
    return event
  }

  // 顔画像のファイル名を取得
  // Get the file name of the face image
  const fileName = `${event.request.userAttributes["address"]}`
  console.log({ fileName });
  const signInNewKey = `sign-in/${fileName}`

  try {
    const signUpNewKey = `sign-up/${fileName}`
    console.log({ signInNewKey, signUpNewKey });
    // CompareFacesCommand のパラメータを設定
    // Set parameters for CompareFacesCommand
    const params = {
      SourceImage: {
        S3Object: {
          Bucket: bucketName,
          Name: signInNewKey,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: bucketName,
          Name: signUpNewKey,
        },
      },
      SimilarityThreshold: 50, // Similarity threshold
    };
    const command = new CompareFacesCommand(params);
    const response = await client.send(command);

    console.log('response:', response);
    console.log('FaceMatches:', response.FaceMatches);
    console.log('UnmatchedFaces:', response.UnmatchedFaces);

    // 一致する顔が見つからない場合はエラー
    // Throw an error if no matching faces are found
    if (response.FaceMatches && response.FaceMatches.length == 0) throw new Error("No faces matched.")
    const similarity = response.FaceMatches[0].Similarity;
    console.log(`Similarity: ${similarity}`);
    // 類似度が50%未満の場合はエラー
    // Throw an error if similarity is below 50%
    if (similarity <= 50) throw new Error("similarity below 50");

    console.log('Faces are similar enough.');
    return event

  } catch (error) {
    throw new Error(`Error comparing faces:, ${error}`);
  }
}