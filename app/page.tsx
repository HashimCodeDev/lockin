import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const unstable_instant = { prefetch: "static" };

interface TodoRow {
  id: string;
  name: string;
}

async function TodosList() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase
    .from("todos")
    .select("id, name")
    .returns<TodoRow[]>();

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading todos...</p>}>
      <TodosList />
    </Suspense>
  );
}
