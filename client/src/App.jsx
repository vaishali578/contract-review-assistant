import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";

function App() {
  return (
    <div>
      <header>
        <h2>Contract Review Assistant</h2>

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button>Sign In</button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button>Sign Up</button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>

      <main>
        <h1>AI Contract Review Assistant</h1>
        <p>
          Upload your contract and let AI review
          its important clauses.
        </p>
      </main>
    </div>
  );
}

export default App;