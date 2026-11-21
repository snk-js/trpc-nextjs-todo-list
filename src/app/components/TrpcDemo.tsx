import { headers } from "next/headers";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export default async function TrpcDemo() {
  const baseUrl = await getBaseUrl();

  const [getRes, postRes] = await Promise.all([
    fetch(`${baseUrl}/api/trpc/hello?name=world`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/trpc/createTodo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My first todo" }),
      cache: "no-store",
    }),
  ]);

  const getData = await getRes.json();
  const postData = await postRes.json();

  return (
    <section>
      <h2>tRPC endpoint check</h2>
      <h3>GET /api/trpc/hello ({getRes.status})</h3>
      <pre>{JSON.stringify(getData, null, 2)}</pre>
      <h3>POST /api/trpc/createTodo ({postRes.status})</h3>
      <pre>{JSON.stringify(postData, null, 2)}</pre>
    </section>
  );
}
