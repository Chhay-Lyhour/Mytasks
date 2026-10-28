import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, refreshAccessToken, setAccessToken } from './api';

type User = { id: number; email: string };
type Recipe = {
  id: number;
  name: string;
  ingredients: string;
  isFavorite: boolean;
};
type RecipeDraft = Pick<Recipe, 'name' | 'ingredients' | 'isFavorite'>;
type AuthMode = 'login' | 'signup';
type Filter = 'all' | 'favorites';

const initialDraft: RecipeDraft = {
  name: '',
  ingredients: '',
  isFavorite: false,
};

const foodPhotos = [
  'photo-1509440159596-0249088772ff',
  'photo-1565299624946-b28f40a0ae38',
  'photo-1512621776951-a57141f2eefd',
  'photo-1490645935967-10de6ba17061',
  'photo-1473093295043-cdd812d0e601',
  'photo-1547592180-85f173990554',
];

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data
  ) {
    const message = error.response.data.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }
  return fallback;
}

function ingredientCount(ingredients: string): number {
  return ingredients
    .split(/[,\n]/)
    .map((ingredient) => ingredient.trim())
    .filter(Boolean).length;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [draft, setDraft] = useState<RecipeDraft>(initialDraft);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  async function loadRecipes() {
    const response = await api.get<Recipe[]>('/recipes');
    setRecipes(response.data);
  }

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const [token] = await Promise.all([
          refreshAccessToken(),
          loadRecipes(),
        ]);
        if (token) {
          const response = await api.get<User>('/auth/me');
          if (active) setUser(response.data);
        }
      } catch {
        if (active)
          setError('We could not load your recipe box. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleShortcuts(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setAuthMode(null);
        setShowRecipeForm(false);
        setSelectedRecipe(null);
      }
    }

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  const visibleRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesFilter = filter === 'all' || recipe.isFavorite;
      const matchesSearch =
        !normalizedQuery ||
        recipe.name.toLowerCase().includes(normalizedQuery) ||
        recipe.ingredients.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesSearch;
    });
  }, [filter, query, recipes]);

  function openCreateForm() {
    if (!user) {
      setAuthMode('login');
      setNotice('Sign in to save a recipe to the kitchen.');
      return;
    }
    setEditingRecipe(null);
    setDraft(initialDraft);
    setShowRecipeForm(true);
  }

  async function openRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setError('');
    try {
      const response = await api.get<Recipe>(`/recipes/${recipe.id}`);
      setSelectedRecipe(response.data);
    } catch (requestError) {
      setSelectedRecipe(null);
      setError(getErrorMessage(requestError, 'Could not open this recipe.'));
    }
  }

  function openEditForm(recipe: Recipe) {
    setEditingRecipe(recipe);
    setDraft({
      name: recipe.name,
      ingredients: recipe.ingredients,
      isFavorite: recipe.isFavorite,
    });
    setSelectedRecipe(null);
    setShowRecipeForm(true);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authMode) return;
    setSaving(true);
    setError('');
    try {
      if (authMode === 'signup') {
        await api.post('/auth/signup', {
          email: authEmail,
          password: authPassword,
        });
      }
      const response = await api.post<{ accessToken: string }>('/auth/login', {
        email: authEmail,
        password: authPassword,
      });
      setAccessToken(response.data.accessToken);
      const me = await api.get<User>('/auth/me');
      setUser(me.data);
      setAuthMode(null);
      setAuthPassword('');
      setNotice(`Welcome to the kitchen, ${me.data.email}.`);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          authMode === 'signup'
            ? 'Could not create your account.'
            : 'Could not sign in with those details.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRecipeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = editingRecipe
        ? await api.patch<Recipe>(`/recipes/${editingRecipe.id}`, draft)
        : await api.post<Recipe>('/recipes', draft);
      setRecipes((current) =>
        editingRecipe
          ? current.map((recipe) =>
              recipe.id === response.data.id ? response.data : recipe,
            )
          : [response.data, ...current],
      );
      setSelectedRecipe(response.data);
      setShowRecipeForm(false);
      setNotice(
        editingRecipe ? 'Recipe updated.' : 'Recipe added to the kitchen.',
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not save your recipe.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite(recipe: Recipe) {
    if (!user) {
      setAuthMode('login');
      setNotice('Sign in to save your favorite recipes.');
      return;
    }
    setError('');
    try {
      const response = await api.patch<Recipe>(`/recipes/${recipe.id}`, {
        isFavorite: !recipe.isFavorite,
      });
      setRecipes((current) =>
        current.map((item) => (item.id === recipe.id ? response.data : item)),
      );
      setSelectedRecipe((current) =>
        current?.id === recipe.id ? response.data : current,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'Could not update your favorite.'),
      );
    }
  }

  async function deleteRecipe(recipe: Recipe) {
    if (!user) {
      setAuthMode('login');
      setNotice('Sign in to manage your recipes.');
      return;
    }
    if (!window.confirm(`Remove "${recipe.name}" from your recipe box?`))
      return;
    setSaving(true);
    setError('');
    try {
      await api.delete(`/recipes/${recipe.id}`);
      setRecipes((current) => current.filter((item) => item.id !== recipe.id));
      setSelectedRecipe(null);
      setNotice('Recipe removed.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not delete this recipe.'));
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/logout');
      setAccessToken(null);
      setUser(null);
      setNotice('You have signed out.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not sign out.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="wordmark"
          href="#home"
          aria-label="The Recipe Atelier home"
        >
          <span className="wordmark-icon" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M20 3.8 23.8 15l11.5.1-9.2 6.7 3.5 11.1L20 26l-9.6 6.9 3.5-11.1-9.2-6.7L16.2 15 20 3.8Z" />
              <circle cx="20" cy="20" r="3.1" />
            </svg>
          </span>
          <span>
            <strong>the recipe atelier</strong>
            <small>A LITTLE SOMETHING DELICIOUS</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-active" href="#recipes">
            Recipes
          </a>
          <a href="#our-kitchen">Our kitchen</a>
          <a href="#footer">Say hello</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-chip" title={user.email}>
                <span className="avatar">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{user.email.split('@')[0]}</span>
              </span>
              <button
                className="button button-outline button-small"
                onClick={() => void logout()}
                disabled={saving}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              className="button button-dark button-small"
              onClick={() => {
                setNotice('');
                setAuthMode('login');
              }}
            >
              Sign in <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </header>

      <main id="home">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              GOOD FOOD, GATHERED HERE
            </div>
            <h1 id="hero-title">
              A little
              <br />
              <em>more</em> delicious.
            </h1>
            <p className="hero-description">
              Recipes worth slowing down for, made to be shared and remembered.
              Pull up a chair — there’s always room for one more.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#recipes">
                Find your next favorite <span aria-hidden="true">↗</span>
              </a>
              <button className="text-button" onClick={openCreateForm}>
                Share a recipe <span aria-hidden="true">＋</span>
              </button>
            </div>
            <div className="hero-note">
              <div className="avatar-stack" aria-hidden="true">
                <span>J</span>
                <span>M</span>
                <span>A</span>
              </div>
              <span>
                <strong>
                  {recipes.length
                    ? `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'}`
                    : 'A growing collection of recipes'}
                </strong>{' '}
                made with love
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-wrap">
              <img
                className="hero-photo"
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=85"
                alt="Freshly baked artisan sourdough bread"
              />
              <div className="photo-shade" />
              <div className="hero-photo-caption">
                <span>FROM OUR KITCHEN</span>
                <strong>Made slowly. Shared generously.</strong>
              </div>
            </div>
            <div className="floating-stamp" aria-label="Made with love">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <defs>
                  <path
                    id="stamp-circle"
                    d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0"
                  />
                </defs>
                <text>
                  <textPath href="#stamp-circle">
                    MADE WITH LOVE · MADE WITH LOVE ·
                  </textPath>
                </text>
              </svg>
              <span>♥</span>
            </div>
            <div className="hero-food-label">
              <span className="label-sparkle">✳</span>
              <span>
                Good things take
                <br />a little time.
              </span>
            </div>
          </div>
          <span className="hero-index">EST. IN YOUR KITCHEN · 2026</span>
        </section>

        <section className="ticker" aria-label="Our philosophy">
          <div className="ticker-track">
            <span>COOK SOMETHING GOOD</span>
            <i>✳</i>
            <span>PASS IT AROUND</span>
            <i>✳</i>
            <span>MAKE YOURSELF AT HOME</span>
            <i>✳</i>
            <span>COOK SOMETHING GOOD</span>
            <i>✳</i>
            <span>PASS IT AROUND</span>
            <i>✳</i>
            <span>MAKE YOURSELF AT HOME</span>
            <i>✳</i>
          </div>
        </section>

        <section className="recipes-section" id="recipes">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                THE GOOD STUFF
              </div>
              <h2>
                Recipes for <em>real life.</em>
              </h2>
              <p>Everyday favorites, lovingly passed around the table.</p>
            </div>
            <button
              className="button button-dark add-recipe"
              onClick={openCreateForm}
            >
              <span aria-hidden="true">＋</span> Add your recipe
            </button>
          </div>

          <div className="recipe-toolbar">
            <div
              className="filter-tabs"
              role="group"
              aria-label="Filter recipes"
            >
              <button
                className={
                  filter === 'all' ? 'filter-tab active' : 'filter-tab'
                }
                onClick={() => setFilter('all')}
              >
                All recipes <span>{recipes.length}</span>
              </button>
              <button
                className={
                  filter === 'favorites' ? 'filter-tab active' : 'filter-tab'
                }
                onClick={() => setFilter('favorites')}
              >
                <span aria-hidden="true">♡</span> Favorites
                <span>
                  {recipes.filter((recipe) => recipe.isFavorite).length}
                </span>
              </button>
            </div>
            <label className="search-box">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a recipe..."
                aria-label="Search recipes"
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>

          {error && !authMode && !showRecipeForm && (
            <div className="alert alert-error" role="alert">
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}
          {notice && !authMode && !showRecipeForm && (
            <div className="alert alert-success" role="status">
              <span>{notice}</span>
              <button
                onClick={() => setNotice('')}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <span className="loader" />
              <p>Setting the table...</p>
            </div>
          ) : visibleRecipes.length > 0 ? (
            <div className="recipe-grid">
              {visibleRecipes.map((recipe, index) => (
                <article className="recipe-card" key={recipe.id}>
                  <button
                    className="recipe-image-button"
                    onClick={() => void openRecipe(recipe)}
                    aria-label={`View ${recipe.name}`}
                  >
                    <img
                      className="recipe-image"
                      src={`https://images.unsplash.com/${foodPhotos[index % foodPhotos.length]}?auto=format&fit=crop&w=900&q=80`}
                      alt=""
                      loading="lazy"
                    />
                    <span className="recipe-category">
                      {recipe.isFavorite
                        ? 'A HOUSE FAVORITE'
                        : 'FROM THE COMMUNITY'}
                    </span>
                  </button>
                  <button
                    className={
                      recipe.isFavorite
                        ? 'favorite-button is-favorite'
                        : 'favorite-button'
                    }
                    onClick={() => void toggleFavorite(recipe)}
                    aria-label={
                      recipe.isFavorite
                        ? `Remove ${recipe.name} from favorites`
                        : `Add ${recipe.name} to favorites`
                    }
                    title={
                      user ? 'Toggle favorite' : 'Sign in to save favorites'
                    }
                  >
                    {recipe.isFavorite ? '♥' : '♡'}
                  </button>
                  <button
                    className="recipe-card-copy"
                    onClick={() => void openRecipe(recipe)}
                  >
                    <span className="recipe-meta">
                      <span>
                        {ingredientCount(recipe.ingredients)} ingredients
                      </span>
                      <span className="meta-dot">·</span>
                      <span>Made to share</span>
                    </span>
                    <span className="recipe-title">{recipe.name}</span>
                    <span className="recipe-description">
                      {recipe.ingredients.replace(/\s+/g, ' ').slice(0, 94)}
                      {recipe.ingredients.length > 94 ? '…' : ''}
                    </span>
                    <span className="recipe-link">
                      Take a look <span aria-hidden="true">↗</span>
                    </span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">✳</span>
              <h3>
                {query
                  ? 'Nothing on the menu just yet.'
                  : 'The recipe box is ready.'}
              </h3>
              <p>
                {query
                  ? 'Try another ingredient or recipe name.'
                  : filter === 'favorites'
                    ? 'Tap the little heart on a recipe to keep it close.'
                    : 'Be the first to add something delicious.'}
              </p>
              {!query && filter === 'all' && (
                <button className="button button-dark" onClick={openCreateForm}>
                  Add the first recipe <span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
          )}
        </section>

        <section className="kitchen-note" id="our-kitchen">
          <div className="kitchen-note-mark" aria-hidden="true">
            ✳
          </div>
          <div>
            <div className="eyebrow">A NOTE FROM THE KITCHEN</div>
            <h2>
              Good food is better <em>together.</em>
            </h2>
            <p>
              This is our little corner for the things we love to cook — the
              handwritten keepers, the happy accidents, the recipes that always
              bring everyone back for seconds.
            </p>
          </div>
          <button className="text-button" onClick={openCreateForm}>
            Pull up a chair <span aria-hidden="true">↗</span>
          </button>
        </section>
      </main>

      <footer className="footer" id="footer">
        <a className="wordmark footer-wordmark" href="#home">
          <span className="wordmark-icon" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M20 3.8 23.8 15l11.5.1-9.2 6.7 3.5 11.1L20 26l-9.6 6.9 3.5-11.1-9.2-6.7L16.2 15 20 3.8Z" />
              <circle cx="20" cy="20" r="3.1" />
            </svg>
          </span>
          <span>
            <strong>the recipe atelier</strong>
            <small>A LITTLE SOMETHING DELICIOUS</small>
          </span>
        </a>
        <span className="footer-message">
          Made for sharing, wherever you are.
        </span>
        <a className="back-top" href="#home">
          Back to the top ↑
        </a>
      </footer>

      {(authMode || showRecipeForm || selectedRecipe) && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAuthMode(null);
              setShowRecipeForm(false);
              setSelectedRecipe(null);
              setError('');
              setNotice('');
            }
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="modal-close"
              onClick={() => {
                setAuthMode(null);
                setShowRecipeForm(false);
                setSelectedRecipe(null);
                setError('');
              }}
              aria-label="Close dialog"
            >
              ×
            </button>
            {authMode ? (
              <>
                <div className="modal-kicker">WELCOME TO OUR KITCHEN</div>
                <h2 id="modal-title">
                  {authMode === 'login' ? 'Come on in.' : 'Pull up a chair.'}
                </h2>
                <p className="modal-intro">
                  {notice ||
                    (authMode === 'login'
                      ? 'Sign in to save and share your favorite recipes.'
                      : 'Create an account to start your own recipe box.')}
                </p>
                <form
                  className="modal-form"
                  onSubmit={(event) => void handleAuth(event)}
                >
                  <label>
                    Email address
                    <input
                      autoComplete="email"
                      type="email"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      autoComplete={
                        authMode === 'login'
                          ? 'current-password'
                          : 'new-password'
                      }
                      type="password"
                      minLength={8}
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      required
                    />
                  </label>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="button button-dark modal-submit"
                    disabled={saving}
                  >
                    {saving
                      ? 'One moment...'
                      : authMode === 'login'
                        ? 'Sign in to the kitchen'
                        : 'Create my account'}
                    {!saving && <span aria-hidden="true">↗</span>}
                  </button>
                </form>
                <p className="modal-switch">
                  {authMode === 'login'
                    ? 'New around here?'
                    : 'Already have a place?'}{' '}
                  <button
                    onClick={() => {
                      setError('');
                      setNotice('');
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    }}
                  >
                    {authMode === 'login' ? 'Create an account' : 'Sign in'}
                  </button>
                </p>
              </>
            ) : showRecipeForm ? (
              <>
                <div className="modal-kicker">
                  {editingRecipe ? 'A LITTLE UPDATE' : 'PASS IT AROUND'}
                </div>
                <h2 id="modal-title">
                  {editingRecipe ? 'Make it yours.' : 'Share something good.'}
                </h2>
                <p className="modal-intro">
                  The best recipes always have a story. Start with the
                  ingredients.
                </p>
                <form
                  className="modal-form"
                  onSubmit={(event) => void handleRecipeSubmit(event)}
                >
                  <label>
                    Recipe name
                    <input
                      autoFocus
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Sunday morning pancakes"
                      required
                    />
                  </label>
                  <label>
                    Ingredients
                    <textarea
                      value={draft.ingredients}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          ingredients: event.target.value,
                        }))
                      }
                      placeholder={'2 cups flour\n1 cup milk\n2 happy eggs'}
                      rows={5}
                      required
                    />
                    <span className="field-hint">
                      Add one per line or separate with commas.
                    </span>
                  </label>
                  <label className="favorite-check">
                    <input
                      type="checkbox"
                      checked={draft.isFavorite}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          isFavorite: event.target.checked,
                        }))
                      }
                    />
                    <span>Mark this one a house favorite</span>
                  </label>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="button button-dark modal-submit"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : editingRecipe
                        ? 'Save changes'
                        : 'Add to the recipe box'}
                    {!saving && <span aria-hidden="true">↗</span>}
                  </button>
                </form>
              </>
            ) : selectedRecipe ? (
              <>
                <div className="detail-photo-wrap">
                  <img
                    src={`https://images.unsplash.com/${foodPhotos[selectedRecipe.id % foodPhotos.length]}?auto=format&fit=crop&w=1000&q=85`}
                    alt=""
                    className="detail-photo"
                  />
                  <span className="recipe-category">
                    {selectedRecipe.isFavorite
                      ? 'A HOUSE FAVORITE'
                      : 'FROM THE COMMUNITY'}
                  </span>
                </div>
                <div className="modal-kicker">
                  {ingredientCount(selectedRecipe.ingredients)} INGREDIENTS ·
                  MADE TO SHARE
                </div>
                <h2 id="modal-title" className="detail-title">
                  {selectedRecipe.name}
                </h2>
                <div className="detail-ingredients">
                  <h3>A little list of lovely things</h3>
                  <ul>
                    {selectedRecipe.ingredients
                      .split(/[,\n]/)
                      .map((ingredient) => ingredient.trim())
                      .filter(Boolean)
                      .map((ingredient, index) => (
                        <li key={`${ingredient}-${index}`}>
                          <span>✳</span>
                          {ingredient}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="detail-actions">
                  <button
                    className="button button-outline"
                    onClick={() => void toggleFavorite(selectedRecipe)}
                  >
                    {selectedRecipe.isFavorite
                      ? '♥ Saved favorite'
                      : '♡ Save favorite'}
                  </button>
                  {user && (
                    <>
                      <button
                        className="button button-dark"
                        onClick={() => openEditForm(selectedRecipe)}
                      >
                        Edit recipe
                      </button>
                      <button
                        className="delete-link"
                        onClick={() => void deleteRecipe(selectedRecipe)}
                        disabled={saving}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                {!user && (
                  <p className="detail-signin">
                    <button
                      onClick={() => {
                        setSelectedRecipe(null);
                        setNotice('Sign in to share your own recipes.');
                        setAuthMode('login');
                      }}
                    >
                      Sign in
                    </button>{' '}
                    to add your own to the table.
                  </p>
                )}
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
