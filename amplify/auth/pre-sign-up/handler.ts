import type { PreSignUpTriggerHandler } from "aws-lambda"
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition({ apiVersion: '2016-06-27' });
import { env } from '$amplify/env/pre-sign-up';
const bucketName = env.MULTIFACTOR_AUTHENTICATION_PASSWORD_FACE_US_EAST_1_BUCKET_NAME;


export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log(event.request);
  
  const fileName = `${event.request.userAttributes["address"]}`
  console.log({fileName});
  const signUpNewKey = `sign-up/${fileName}`
  

  console.log({ bucketName, signUpNewKey });

  const params = {
    Image: {
      S3Object: {
        Bucket: bucketName,
        Name: signUpNewKey
      }
    },
    Attributes: ['ALL']
  };

  try {
    const data = await rekognition.detectFaces(params).promise();
    
    const faceCount = data.FaceDetails.length;
    if (faceCount !== 1) throw new Error(`Found ${faceCount} face. Only one face accept`)
    event.response.autoConfirmUser = true;

    event.request.validationData = {'signUpLogin':'true'}


      
      return event
      


  } catch (err) {
    console.error('Error detecting faces:', err);
    throw err;
  }
}

