import { Logo } from "../Logo";

export function LoginHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <Logo size="large" />
      </div>
      <h1 className="text-3xl font-bold text-primary-900 mb-2">Welcome Back</h1>
      <p className="text-gray-600">Sign in to continue to UniMate</p>
    </div>
  );
}
