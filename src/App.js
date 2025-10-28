import React, { useEffect, useState } from "react";

// API endpoints for different search types
const API = {
  searchByIngredient: (ingredient) =>
    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(
      ingredient
    )}`,
  searchByName: (name) =>
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
      name
    )}`,
  searchByCategory: (category) =>
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(
      category
    )}`,
  lookupById: (id) => `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`,
};

// Local storage hook for favorites
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
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("ingredient");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [favorites, setFavorites] = useLocalStorage("favorites", []);

  useEffect(() => {
    fetchMeals("chicken", "ingredient"); // default search
  }, []);

  // 🔍 Fetch meals dynamically based on search type
  async function fetchMeals(value, type) {
    if (!value.trim()) {
      setError("Please enter a search term.");
      setMeals([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url;
      switch (type) {
        case "meal":
          url = API.searchByName(value);
          break;
        case "category":
          url = API.searchByCategory(value);
          break;
        default:
          url = API.searchByIngredient(value);
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.meals) {
        setMeals([]);
        setError("No recipes found 😕");
      } else {
        setMeals(data.meals);
      }
    } catch (err) {
      setError("Failed to fetch recipes.");
    } finally {
      setLoading(false);
    }
  }

  // 🍲 Fetch full meal details
  async function openMealDetails(id) {
    setSelectedMeal(null);
    setLoading(true);
    try {
      const res = await fetch(API.lookupById(id));
      const data = await res.json();
      setSelectedMeal(data.meals[0]);
    } catch {
      setError("Failed to load details.");
    } finally {
      setLoading(false);
    }
  }

  // 💖 Add or remove from favorites
  function toggleFavorite(meal) {
    const exists = favorites.find((m) => m.idMeal === meal.idMeal);
    if (exists) {
      setFavorites(favorites.filter((m) => m.idMeal !== meal.idMeal));
    } else {
      setFavorites([...favorites, meal]);
    }
  }
  
  const [darkMode, setDarkMode] = useState(false);
   return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <header>
        <h1>🍰 Recipe Finder</h1>
        <p>From Pinterest inspo → Reality 🌸</p>

        {/* 🌙 Dark Mode Toggle */}
        <button className="toggle-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>



      <div className="search">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="ingredient">Ingredient</option>
          <option value="meal">Meal Name</option>
          <option value="category">Category</option>
        </select>

        <input
          placeholder={`Search by ${searchType}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchMeals(query, searchType)}
        />

        <button onClick={() => fetchMeals(query, searchType)} disabled={loading}>
          {loading ? "Searching..." : "Search"}
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
                    ? "Unfavorite"
                    : "Favorite"}
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
                <p className="instructions">{selectedMeal.strInstructions}</p>
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
