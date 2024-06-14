import { S3 } from 'aws-sdk';
import {  Context } from 'aws-lambda';
import { Handler } from 'aws-lambda';
import { env } from '$amplify/env/pre-signed-url';

const logger = console;
const s3Client = new S3();

export const handler: Handler = async (event:any, context: Context) => {
    const bucketName = env.MULTIFACTOR_AUTHENTICATION_PASSWORD_FACE_US_EAST_1_BUCKET_NAME;
    logger.info("******bucket_name********");
    logger.info(bucketName);
    logger.info("******bucket_name********");

    logger.info("******event********");
    logger.info(event);
    logger.info("******event********");


    const key = event.key;
    logger.info("******key********");
    logger.info(key);
    logger.info("******key********");

    const objectKey = `${key}`; // generate random key for upload object
    const expiration = 600;  // define TTL for presign URL
    logger.info("******object_key********");
    logger.info(objectKey);
    logger.info("******object_key********");

    try {
        // generate presigned url
        const response = await s3Client.getSignedUrlPromise('putObject', {
            Bucket: bucketName,
            Key: objectKey,
            ContentType: 'image/jpeg',
            Expires: expiration
        });
        logger.info("******response********");
        logger.info(response);
        logger.info("******response********");

        // return result
        return {
            statusCode: 200,
            body: response,
            headers: {
                "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
                "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
            },
        };
    } catch (error) {
        logger.error(error);
        // When error occur, return 500 status
        return {
            statusCode: 500,
            
            body: JSON.stringify('Error generating presigned URL')
        };
    }
};