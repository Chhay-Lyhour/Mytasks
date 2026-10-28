import { FormEvent, useEffect, useState } from 'react';
import { api, refreshAccessToken, setAccessToken } from './api';

type User = { id: number; email: string };
type Todo = { id: number; title: string; done: boolean };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [email, setEmail] = useState('alice@test.dev');
  const [password, setPassword] = useState('secret123');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    const token = await refreshAccessToken();
    if (token) {
      await loadSession();
    }
    setReady(true);
  }

  async function loadSession() {
    const me = await api.get<User>('/auth/me');
    setUser(me.data);
    const list = await api.get<Todo[]>('/todos');
    setTodos(list.data);
  }

  async function handleAuth(path: '/auth/login' | '/auth/signup', event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (path === '/auth/signup') {
        await api.post(path, { email, password });
      }
      const { data } = await api.post<{ accessToken: string }>('/auth/login', {
        email,
        password,
      });
      setAccessToken(data.accessToken);
      await loadSession();
    } catch {
      setError('Invalid credentials or email already registered.');
    }
  }

  async function addTodo(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }
    const { data } = await api.post<Todo>('/todos', { title });
    setTodos((current) => [...current, data]);
    setTitle('');
  }

  async function removeTodo(id: number) {
    await api.delete(`/todos/${id}`);
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  async function logout() {
    await api.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
    setTodos([]);
  }

  if (!ready) {
    return <p>Loading…</p>;
  }

  if (!user) {
    return (
      <main>
        <h1>MyTasks</h1>
        <p>Access token stays in memory. Refresh token is an HttpOnly cookie.</p>
        <form onSubmit={(event) => void handleAuth('/auth/login', event)}>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={8}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="row">
            <button type="submit">Log in</button>
            <button
              type="button"
              className="secondary"
              onClick={(event) => void handleAuth('/auth/signup', event)}
            >
              Sign up
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>MyTasks</h1>
      <p>Signed in as {user.email}. The axios interceptor refreshes on 401.</p>
      <div className="row">
        <button className="secondary" type="button" onClick={() => void logout()}>
          Log out
        </button>
      </div>
      <form onSubmit={(event) => void addTodo(event)}>
        <label>
          New to-do
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Finish the auth lab"
          />
        </label>
        <button type="submit">Add</button>
      </form>
      <section className="panel">
        {todos.length === 0 ? <p>No to-dos yet.</p> : null}
        {todos.map((todo) => (
          <div className="todo" key={todo.id}>
            <span>{todo.title}</span>
            <button type="button" onClick={() => void removeTodo(todo.id)}>
              Delete
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
