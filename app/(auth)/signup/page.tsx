import { signUp } from "./actions";

type SignupPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main>
      <h1>Create your account</h1>
      <p>Sign up to start using Paperplane.</p>

      {params?.error ? (
        <p role="alert" style={{ color: "red" }}>
          {params.error}
        </p>
      ) : null}

      {params?.message ? (
        <p role="status" style={{ color: "green" }}>
          {params.message}
        </p>
      ) : null}

      <form action={signUp}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </div>

        <button type="submit">Sign up</button>
      </form>
    </main>
  );
}
