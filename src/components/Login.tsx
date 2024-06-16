import { useEffect, useState } from "react";
import App from "../App.tsx";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { Authenticator } from "@aws-amplify/ui-react";
import Camera from "./Camera.tsx"
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { fetchAuthSession } from 'aws-amplify/auth';
import md5 from "md5";

Amplify.configure(outputs);
import { Buffer } from 'buffer';
import { SignInInput, SignUpInput, signIn, signUp } from "aws-amplify/auth";

// for handleSignUp function. handleSignUp function can't reference signUpImage state.
let signUpImageGlobal: string | null = null
// for handleSignIn function. handleSignIn function can't reference signInImage state.
let signInImageGlobal: string | null = null

export default () => {

    const [signUpImage, setSignUpImage] = useState(null);
    const [signInImage, setSignInImage] = useState(null);

    // for handleSignUp and handleSignIn function.
    useEffect(() => {
        signUpImageGlobal = signUpImage
        signInImageGlobal = signInImage
    }, [signUpImage, signInImage]);

    
    async function getPresignedUrl(fileName: string) {
        const { credentials } = await fetchAuthSession();
        console.log(credentials);
        const awsRegion = outputs.auth.aws_region;
        const functionName = outputs.custom.preSignedUrlFunctionName;

        const labmda = new LambdaClient({ credentials: credentials, region: awsRegion });
        const command = new InvokeCommand({
            FunctionName: functionName,
            Payload: Buffer.from(JSON.stringify({ key: fileName })),
        });
        const apiResponse = await labmda.send(command);
        console.log(apiResponse);

        if (apiResponse.Payload) {
            const payloadStr = new TextDecoder().decode(apiResponse.Payload);


            const payload = JSON.parse(payloadStr);
            console.log(payload.body);
            return payload.body
        }
    }

    const handleUploadImagetoS3 = async (imageSrc: string, presignedURL: string) => {
        const res = await fetch(imageSrc)
        const blob = await res.blob()
        const response = await fetch(presignedURL, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': 'image/jpeg',
            }
        })

        if (!response.ok) {
            alert("Error happen")
            console.error("Erorr")
            console.error(response)
            return {
                body: null
            };
        }
    };


    const services = {
        async handleSignUp(input: SignUpInput) {
            console.log(signUpImage);
            if (signUpImageGlobal == null) throw new Error("Please take a Photo");

            const { username, password } = input;
            const fileName = `${md5(username)}.jpg`
            console.log({ fileName });
            const presignedURL = await getPresignedUrl('sign-up/'+fileName)


            await handleUploadImagetoS3(signUpImageGlobal, presignedURL).catch((err) => {
                throw new Error(err);
            })



            return signUp({
                username: username,
                password,
                options: {
                    ...input.options,
                    userAttributes: {
                        ...input.options?.userAttributes,
                        address: fileName,
                    },
                },
            });
        },
        async handleSignIn(input: SignInInput) {

            console.log(signInImageGlobal);
            if (signInImageGlobal == null) throw new Error("Please take a Photo");

            const { username, password } = input;

            const fileName = `${md5(username)}.jpg`
            console.log({ fileName });
            const presignedURL = await getPresignedUrl('sign-in/'+fileName)

            handleUploadImagetoS3(signInImageGlobal, presignedURL)
                .catch((err) => {
                    throw new Error(err);
                })

            return signIn({
                username: username,
                password,
                options: {
                    ...input.options,
                    userAttributes: {
                        address: fileName,
                    },
                },
            });
        },
    };



    const components = {
        SignUp: {
            Header() {
                return (
                    <>
                        <Camera image={signUpImage} setImage={setSignUpImage} />
                    </>
                );
            },
        },
        SignIn: {
            Header() {
                return (
                    <>
                        <Camera image={signInImage} setImage={setSignInImage} />
                    </>
                );
            },
        },
    };

    return (
        <Authenticator services={services} components={components}>
            {({ signOut, user }) => (
                <>
                    {/* @ts-ignore */}
                    <App user={user} />

                    <button onClick={signOut}>Sign out</button>
                </>
            )}
        </Authenticator>
    )



};
