const CLIENT_ID = "oqdrp3gkw3lczkb14z6h74ycboupib"; 
const REDIRECT_URI = "https://dranben.com";
const WORKER_URL = "https://pokemon.brandenkenn.workers.dev";

let fullCollection = []; // The master list of Pokemon objects/strings

// --- 1. INITIALIZATION ---
window.onload = async () => {
    // 1. Handle Twitch redirect/session
    await handleTwitchRedirect();

    const urlParams = new URLSearchParams(window.location.search);
    const urlUser = urlParams.get('user');
    const loggedInUser = localStorage.getItem('twitch_user');

    // 2. DATA LOGIC: What should the page actually show?
    // We default to 'dranben' for the CONTENT so the page isn't blank.
    const userToLoad = urlUser || loggedInUser || 'dranben';

    // 3. INPUT LOGIC: What should the SEARCH BOX show?
    // We ONLY fill the box if there is a specific user in the URL or a login.
    // If it's a fresh visit (no URL user, no login), we leave it "" (empty).
    const inputField = document.getElementById('username-input');
    inputField.value = urlUser || loggedInUser || "";

    // 4. Load the actual Pokemon
    fetchTrainerData(userToLoad);
};

// --- 2. TWITCH AUTH & SESSION MANAGEMENT ---
async function handleTwitchRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        try {
            const res = await fetch(`${WORKER_URL}?login_code=${code}`);
            const authData = await res.json();

            if (authData.status === "success") {
                // Save credentials to browser memory
                localStorage.setItem('twitch_user', authData.user);
                localStorage.setItem('auth_token', authData.token);
                
                // Clean the URL (removes the ?code=...)
                window.history.replaceState({}, document.title, "/");
                updateAuthUI(authData.user);
            }
        } catch (e) {
            console.error("Auth Handshake Failed:", e);
        }
    } else {
        checkSession();
    }
}

function checkSession() {
    const savedUser = localStorage.getItem('twitch_user');
    const savedToken = localStorage.getItem('auth_token');
    
    // Ensure the token isn't the literal string "undefined"
    if (savedUser && savedToken && savedToken !== "undefined") {
        updateAuthUI(savedUser);
    }
}

function updateAuthUI(username) {
    const loginBtn = document.getElementById('login-btn');
    const userDisplay = document.getElementById('user-display');
    
    if (loginBtn && userDisplay) {
        loginBtn.style.display = 'none';
        userDisplay.innerText = `TRAINER: ${username.toUpperCase()}`;
        userDisplay.style.display = 'inline-block';
    }
}

// --- 3. DATA FETCHING ---
async function fetchTrainerData(username) {
    const display = document.getElementById('pokemon-display');
    const trainerNameSpan = document.getElementById('trainer-name');
    const statTotal = document.getElementById('stat-total');
    const statBalance = document.getElementById('stat-balance');
    
    trainerNameSpan.innerText = username.toUpperCase();
    display.innerHTML = "<p class='loading'>Scanning Storage Units...</p>";

    try {
        const res = await fetch(`${WORKER_URL}?user=${username}&userstats=true`);
        const data = await res.json();
        
        // Update Stats (The ₽ symbol is in the HTML)
        statTotal.innerText = data.total || 0;
        statBalance.innerText = data.balance?.toLocaleString() || 0;
        
        // Update Favorites Bar
        updateFavoriteUI(data.favorites);
        
        // Process Collection
        fullCollection = (data.collection || []).filter(Boolean);
        
        // Create a mapped array so we remember the database index even when reversed
        const displayList = fullCollection.map((poke, index) => {
            return { ...poke, originalIndex: index };
        }).reverse();
        
        renderSprites(displayList);
        
    } catch (e) {
        display.innerHTML = "<p>Error: Storage unit is offline.</p>";
        console.error(e);
    }
}

// --- 4. THE RENDERING ENGINE (RECTANGULAR CARDS) ---
function renderSprites(list) {
    const display = document.getElementById('pokemon-display');
    display.innerHTML = "";

    if (list.length === 0) {
        display.innerHTML = "<p>No Pokémon found in this storage unit.</p>";
        return;
    }

    list.forEach(item => {
        const { id, n: name, iv, s, p, originalIndex } = item;
        const [atk, def, hp] = iv || [0,0,0];
        const isShiny = s === 1;
        const hasPokerus = p === 1;
        
        const card = document.createElement('div');
        card.className = `pokemon-card ${isShiny ? 'shiny-card' : ''}`;

        card.innerHTML = `
            <button class="release-btn" title="Release ${name}" 
                    onclick="releasePokemon(${originalIndex}, '${name}')">×</button>
            
            <button class="fav-btn" title="Set Favorite"
                    onclick="toggleFavoriteDialog(${originalIndex})">★</button>
            
            <div class="pokemon-name">${name.toUpperCase()}</div>
            ${hasPokerus ? '<div class="pokerus-tag">🧬 POKERUS</div>' : ''}
            
            <img src="https://img.pokemondb.net/sprites/home/${isShiny ? 'shiny' : 'normal'}/${name.toLowerCase()}.png" 
                 alt="${name}"
                 onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'">
            
            <div class="stats-box">
                <div class="stat-row">
                    <span class="stat-label">ATK</span>
                    <span class="stat-value ${atk === 15 ? 'perfect-stat' : ''}">${atk}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">DEF</span>
                    <span class="stat-value ${def === 15 ? 'perfect-stat' : ''}">${def}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">STA</span>
                    <span class="stat-value ${hp === 15 ? 'perfect-stat' : ''}">${hp}</span>
                </div>
            </div>
        `;
        display.appendChild(card);
    });
}

function updateFavoriteUI(favorites) {
    for (let i = 0; i < 4; i++) {
        const slotImg = document.querySelector(`#fav-${i} img`);
        const data = favorites && favorites[i];
        
        if (data) {
            const isShiny = data.s === 1;
            slotImg.src = `https://img.pokemondb.net/sprites/home/${isShiny ? 'shiny' : 'normal'}/${data.n.toLowerCase()}.png`;
            slotImg.title = data.n;
        } else {
            slotImg.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
            slotImg.title = "Empty Slot";
        }
    }
}

// --- 5. USER ACTIONS ---
async function releasePokemon(index, name) {
    if (!confirm(`Are you sure you want to release ${name}? This cannot be undone.`)) return;

    const loggedInUser = localStorage.getItem('twitch_user');
    const token = localStorage.getItem('auth_token');

    try {
        const res = await fetch(`${WORKER_URL}?user=${loggedInUser}&release_index=${index}&token=${token}`);
        if (res.ok) {
            fetchTrainerData(currentUserView);
        } else {
            alert("Failed to release. Make sure you are logged in and own this collection.");
        }
    } catch (e) {
        alert("Network error occurred.");
    }
}

function toggleFavoriteDialog(index) {
    const slotInput = prompt("Which Favorite Slot? (Enter 1, 2, 3, or 4)");
    if (!slotInput) return; // User cancelled
    
    const slotNum = parseInt(slotInput);
    if (isNaN(slotNum) || slotNum < 1 || slotNum > 4) {
        alert("Invalid slot. Please enter a number between 1 and 4.");
        return;
    }
    
    // Array is 0-indexed, so we subtract 1 from their choice
    updateFavorite(slotNum - 1, index);
}

async function updateFavorite(slot, pokeIndex) {
    const loggedInUser = localStorage.getItem('twitch_user');
    const token = localStorage.getItem('auth_token');
    
    try {
        const res = await fetch(`${WORKER_URL}?user=${loggedInUser}&set_favorite=true&slot=${slot}&index=${pokeIndex}&token=${token}`);
        if (res.ok) {
            fetchTrainerData(currentUserView);
        } else {
            alert("Failed to set favorite. Make sure you are logged in and own this collection.");
        }
    } catch (e) {
        alert("Network error occurred.");
    }
}

// --- 6. UTILITIES & SEARCH ---
function checkOwnership() {
    const loggedInUser = localStorage.getItem('twitch_user');
    if (loggedInUser && loggedInUser === currentUserView) {
        document.body.classList.add('is-owner');
    } else {
        document.body.classList.remove('is-owner');
    }
}

function searchUser() {
    const searchBox = document.getElementById('search-input'); // Assumes you have an input with this ID
    const username = searchBox.value.trim().toLowerCase();
    
    if (username) {
        currentUserView = username;
        checkOwnership();
        fetchTrainerData(username);
        // Optional: Update URL without reloading page so they can share the link
        window.history.pushState({}, '', `?user=${username}`);
    }
}
