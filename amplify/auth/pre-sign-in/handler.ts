import type { PreAuthenticationTriggerHandler } from "aws-lambda"
const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
const client = new RekognitionClient({});
import { env } from '$amplify/env/pre-sign-in';
const bucketName = env.MULTIFACTOR_AUTHENTICATION_PASSWORD_FACE_US_EAST_1_BUCKET_NAME;

import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// SSMクライアントの作成
const ssmClient = new SSMClient({});

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

const userPoolId = await getUserPoolId();

import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
// 
// クライアントの設定
const cognitoClient = new CognitoIdentityProviderClient({ });

async function verifyEmail(userPoolId: string, username: string, email: string) {
  try {
    // AdminUpdateUserAttributesCommandのパラメータを設定
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
    const command = new AdminUpdateUserAttributesCommand(params);

    // コマンドの送信
    const response = await cognitoClient.send(command);
    console.log("Email verified successfully:", response);
  } catch (error) {
    console.error("Error verifying email:", error);
  }
}




export const handler: PreAuthenticationTriggerHandler = async (event) => {
  
  const username = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;

  console.log({ userPoolId, username, email });

  console.log(event.request);
  if (event.request.userAttributes.email_verified == "false") {
    console.log("first Login");
    await verifyEmail(userPoolId, username, email);
    return event
  }



  const fileName = `${event.request.userAttributes["address"]}`
  console.log({ fileName });
  const signInNewKey = `sign-in/${fileName}`

  try {
    const signUpNewKey = `sign-up/${fileName}`
    console.log({ signInNewKey, signUpNewKey });
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
      SimilarityThreshold: 50, // 類似度の閾値
    };
    const command = new CompareFacesCommand(params);
    const response = await client.send(command);


    // const response = await rekognition.compareFaces(params)
    console.log('response:', response);
    console.log('FaceMatches:', response.FaceMatches);
    console.log('UnmatchedFaces:', response.UnmatchedFaces);

    if (response.FaceMatches && response.FaceMatches.length == 0) throw new Error("No faces matched.")
    const similarity = response.FaceMatches[0].Similarity;
    console.log(`Similarity: ${similarity}`);
    if (similarity <= 50) throw new Error("similarity below 50");

    console.log('Faces are similar enough.');
    return event

  } catch (error) {
    throw new Error(`Error comparing faces:, ${error}`);
  }
}