export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-500">Page not found</p>
        <a href="/login" className="mt-4 inline-block text-[#5568EE] hover:underline">
          Go to login
        </a>
      </div>
    </div>
  );
}
