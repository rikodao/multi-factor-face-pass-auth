import { AuthUser } from "aws-amplify/auth";

function App( user:   AuthUser | undefined) {
  
  return (
    <main>
      <h1>Welcome {user?.signInDetails?.loginId} {user?.username}</h1>
    </main>
  );
}

export default App;
