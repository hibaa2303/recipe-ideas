import React, { useEffect, useState } from 'react';

const API = {
  searchByIngredient: (ingredient) =>
    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`,
  lookupById: (id) =>
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`,
};

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

export default function App() {
  const [query, setQuery] = useState('chicken');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [favorites, setFavorites] = useLocalStorage('favorites', []);

  useEffect(() => {
    fetchMeals('chicken');
  }, []);

  async function fetchMeals(ingredient) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API.searchByIngredient(ingredient));
      const data = await res.json();
      if (!data.meals) {
        setMeals([]);
        setError('No recipes found.');
      } else {
        setMeals(data.meals);
      }
    } catch {
      setError('Failed to fetch recipes.');
    } finally {
      setLoading(false);
    }
  }

  async function openMealDetails(id) {
    setSelectedMeal(null);
    setLoading(true);
    try {
      const res = await fetch(API.lookupById(id));
      const data = await res.json();
      setSelectedMeal(data.meals[0]);
    } catch {
      setError('Failed to load details.');
    } finally {
      setLoading(false);
    }
  }

  function toggleFavorite(meal) {
    const exists = favorites.find((m) => m.idMeal === meal.idMeal);
    if (exists) {
      setFavorites(favorites.filter((m) => m.idMeal !== meal.idMeal));
    } else {
      setFavorites([...favorites, meal]);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🍳 Recipe Ideas</h1>
        <p>Find easy meals by ingredient</p>
      </header>

      <div className="search">
        <input
          placeholder="e.g. chicken, rice, tomato"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchMeals(query)}
        />
        <button onClick={() => fetchMeals(query)} disabled={loading}>
          Search
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}

      <main className="main">
        <section className="results">
          {meals.map((meal) => (
            <div key={meal.idMeal} className="card">
              <img src={meal.strMealThumb} alt={meal.strMeal} />
              <h3>{meal.strMeal}</h3>
              <div className="actions">
                <button onClick={() => openMealDetails(meal.idMeal)}>
                  View
                </button>
                <button onClick={() => toggleFavorite(meal)}>
                  {favorites.find((m) => m.idMeal === meal.idMeal)
                    ? 'Unfavorite'
                    : 'Favorite'}
                </button>
              </div>
            </div>
          ))}
        </section>

        <aside className="sidebar">
          <div className="panel">
            <h2>Favorites</h2>
            {favorites.length === 0 && <p>No favorites yet</p>}
            {favorites.map((f) => (
              <div
                key={f.idMeal}
                className="fav-item"
                onClick={() => openMealDetails(f.idMeal)}
              >
                <img src={f.strMealThumb} alt="" />
                <span>{f.strMeal}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <h2>Meal Details</h2>
            {selectedMeal ? (
              <div className="details">
                <h3>{selectedMeal.strMeal}</h3>
                <img src={selectedMeal.strMealThumb} alt="" />
                <p>
                  <strong>Category:</strong> {selectedMeal.strCategory} <br />
                  <strong>Area:</strong> {selectedMeal.strArea}
                </p>
                <h4>Ingredients</h4>
                <ul>
                  {Array.from({ length: 20 }).map((_, i) => {
                    const ing = selectedMeal[`strIngredient${i + 1}`];
                    const measure = selectedMeal[`strMeasure${i + 1}`];
                    return ing ? (
                      <li key={i}>
                        {ing} – {measure}
                      </li>
                    ) : null;
                  })}
                </ul>
                <h4>Instructions</h4>
                <p className="instructions">
                  {selectedMeal.strInstructions}
                </p>
              </div>
            ) : (
              <p>Select a meal to view details</p>
            )}
          </div>
        </aside>
      </main>

      <footer>Built using TheMealDB API</footer>
    </div>
  );
}
