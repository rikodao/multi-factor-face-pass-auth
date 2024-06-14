import { AuthUser } from "aws-amplify/auth";


function App({ user }: {user: AuthUser | undefined}) {
  return (
    <main>
      <h1>Welcome {user?.signInDetails?.loginId} </h1>
    </main>
  );
}

export default App;
