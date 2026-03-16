// --- 1. THE MAIN FETCH FUNCTION ---
async function fetchTrainerData(username) {
    const display = document.getElementById('pokemon-display');
    const nameEl = document.getElementById('trainer-name');
    
    // Show loading state
    nameEl.innerText = "SEARCHING...";
    display.innerHTML = '<div style="color: white; grid-column: 1/-1; text-align: center;">Loading data from KV...</div>';

    const workerUrl = `https://pokemon.brandenkenn.workers.dev?user=${username}&userstats=true&format=json`;

    try {
        const response = await fetch(workerUrl);
        const data = await response.json();

        // Check if user exists (total catches will be 0 if new/empty)
        if (data.total === 0 && (!data.collection || data.collection.length === 0)) {
            nameEl.innerText = "NOT FOUND";
            display.innerHTML = '<div style="color: #ff4444; grid-column: 1/-1; text-align: center;">Trainer has no catches yet!</div>';
            return;
        }

        // Update Text
        nameEl.innerText = username.toUpperCase();
        document.getElementById('trainer-balance').innerText = `₽${data.balance.toLocaleString()}`;
        document.getElementById('trainer-total').innerText = data.total;
        
        // Clear display for new sprites
        display.innerHTML = ""; 

        // Build Sprites
        data.collection.slice(-20).reverse().forEach(entry => {
            const isShiny = entry.includes('✨');
            const hasPokerus = entry.includes('🦠');
            let name = entry.split('(')[0].replace('✨', '').toLowerCase();

            const img = document.createElement('img');
            const spriteType = isShiny ? 'shiny' : 'home'; // 'home' or 'normal' depending on the source
            
            img.src = `https://img.pokemondb.net/sprites/home/${isShiny ? 'shiny' : 'normal'}/${name}.png`;
            img.alt = name;
            img.title = entry; // Tooltip shows stats
            
            if (isShiny) img.classList.add('shiny-glow');
            if (hasPokerus) img.classList.add('pokerus-border');

            display.appendChild(img);
        });

    } catch (error) {
        nameEl.innerText = "ERROR";
        display.innerHTML = "Could not connect to the Worker.";
    }
}

// --- 2. SEARCH EVENT LISTENERS (Put these at the bottom) ---

function performSearch() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    if (username) {
        fetchTrainerData(username);
        input.value = ""; // Optional: Clear box after search
    }
}

document.getElementById('search-btn').addEventListener('click', performSearch);

document.getElementById('username-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

// --- 3. INITIAL LOAD ---
// This runs as soon as the page opens
fetchTrainerData('Branden');
