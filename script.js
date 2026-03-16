/**
 * POKEDEX DASHBOARD SCRIPT
 * Connects dranben.com (Netlify) to Cloudflare Workers KV
 */

// --- 1. CONFIGURATION ---
const WORKER_URL = "https://pokemon.brandenkenn.workers.dev";
const DEFAULT_TRAINER = "dranben";

// --- 2. MAIN FETCH FUNCTION ---
async function fetchTrainerData(username) {
    const display = document.getElementById('pokemon-display');
    const nameEl = document.getElementById('trainer-name');
    const balanceEl = document.getElementById('trainer-balance');
    const totalEl = document.getElementById('trainer-total');
    
    // Reset and show loading state
    nameEl.innerText = "SEARCHING...";
    display.innerHTML = '<div style="color: white; grid-column: 1/-1; text-align: center; font-family: sans-serif;">Connecting to Cloudflare KV...</div>';

    // Build the URL with JSON format flag
    const url = `${WORKER_URL}?user=${encodeURIComponent(username)}&userstats=true&format=json`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Worker connection failed");
        
        const data = await response.json();

        // Check if user has data (Cloudflare returns defaults if new)
        if (!data || (data.total === 0 && (!data.collection || data.collection.length === 0))) {
            nameEl.innerText = "NOT FOUND";
            display.innerHTML = '<div style="color: #ff4444; grid-column: 1/-1; text-align: center; padding: 20px;">Trainer has no recorded catches.</div>';
            balanceEl.innerText = "₽0";
            totalEl.innerText = "0";
            return;
        }

        // Update UI Text
        nameEl.innerText = username.toUpperCase();
        balanceEl.innerText = `₽${(data.balance || 0).toLocaleString()}`;
        totalEl.innerText = data.total || 0;
        
        // Clear "Searching" message
        display.innerHTML = ""; 

        // Loop through collection (Last 20 catches, newest first)
        const catches = data.collection || [];
        catches.slice(-20).reverse().forEach(entry => {
            
            // --- SANITY CHECK: Ensure entry is a valid string ---
            if (!entry || typeof entry !== 'string') return;

            const isShiny = entry.includes('✨');
            const hasPokerus = entry.includes('🦠');
            
            // Extract name: "Pikachu(15/15/15)" -> "pikachu"
            let nameParts = entry.split('(');
            if (nameParts.length === 0) return; 
            let name = nameParts[0].replace('✨', '').toLowerCase().trim();

            // Create Sprite Element
            const img = document.createElement('img');
            
            // Try to pull high-quality Home sprites
            const spritePath = isShiny ? 'shiny' : 'normal';
            img.src = `https://img.pokemondb.net/sprites/home/${spritePath}/${name}.png`;
            img.alt = name;
            img.title = entry; // Tooltip shows IVs on hover
            
            // --- ERROR HANDLING: Fallback if sprite is missing ---
            img.onerror = () => { 
                img.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"; 
                img.style.filter = "grayscale(1)";
                img.style.opacity = "0.5";
            };
            
            // Apply CSS Classes for special effects
            if (isShiny) img.classList.add('shiny-glow');
            if (hasPokerus) img.classList.add('pokerus-border');

            display.appendChild(img);
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        nameEl.innerText = "ERROR";
        display.innerHTML = `<div style="color: #ff4444; grid-column: 1/-1; text-align: center;">Worker Error: ${error.message}</div>`;
    }
}

// --- 3. SEARCH LOGIC ---

function performSearch() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    if (username) {
        fetchTrainerData(username);
    }
}

// Listen for Search Click
document.getElementById('search-btn').addEventListener('click', performSearch);

// Listen for Enter Key in search box
document.getElementById('username-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

// --- 4. INITIALIZATION ---

// Check URL for specific user (e.g., dranben.com/?user=someone)
const urlParams = new URLSearchParams(window.location.search);
const userFromUrl = urlParams.get('user');

if (userFromUrl) {
    fetchTrainerData(userFromUrl);
} else {
    // Default load
    fetchTrainerData(DEFAULT_TRAINER);
}
