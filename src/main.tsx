import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { Authenticator } from "@aws-amplify/ui-react";
import ImageUploder from "./components/ImageUploder.tsx"
Amplify.configure(outputs);
import { Buffer } from 'buffer';
import { SignInInput, SignUpInput, signIn, signUp } from "aws-amplify/auth";

// @ts-ignore
window.Buffer = Buffer;

const services = {
  // async validateCustomSignUp(formData) {
  //   if (!formData.acknowledgement) {
  //     return {
  //       acknowledgement: 'You must agree to the Terms and Conditions',
  //     };
  //   }
  // },
  async handleSignUp(input: SignUpInput) {
    
    const { username, password } = input;
    console.log({input});

    return signUp({
      username: username,
      password,
      options: {
        ...input.options,
        userAttributes: {
          ...input.options?.userAttributes,
          address: `undefined.jpg`,
        },
      },
    });
  },
  async handleSignIn(input: SignInInput) {
    
    const { username, password } = input;
    console.log({input});
  
    return signIn({
      username: username,
      password,
      options: {
        // ...input.options,
        userAttributes: {
          address: `undefined.jpg`,
        },
      },
    });
  },
};



const components = {
  SignUp: {
    FormFields() {
      return (
        <>
          <Authenticator.SignUp.FormFields />
          <ImageUploder sessionid="sign-up/undefined.jpg" ></ImageUploder >
        </>
      );
    },
  },
  SignIn: {
    Header() {
      return (
        <>          
          <ImageUploder sessionid="sign-in/undefined.jpg" ></ImageUploder >
        </>
      );
    },
  },
};


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator services={services} components={components}>
      {({ signOut, user }) => (
        <>
         {/* @ts-ignore */}
          <App  user={user}/>


          <button onClick={signOut}>Sign out</button>
        </>
      )}
    </Authenticator>


  </React.StrictMode>
);
