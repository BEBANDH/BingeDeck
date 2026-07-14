// === CONFIGURATION ===
// The OMDB_API_KEY is now securely loaded from config.js

// === FIREBASE CONFIGURATION (REPLACE WITH YOUR KEYS) ===
const firebaseConfig = {

    apiKey: "AIzaSyCjDCLPgVtJM0IHtUwW8vRoPQuR2zHz6q4",

    authDomain: "bingedeck.firebaseapp.com",

    projectId: "bingedeck",

    storageBucket: "bingedeck.firebasestorage.app",

    messagingSenderId: "78548571785",

    appId: "1:78548571785:web:3d45ee189618cf36491858",

    measurementId: "G-N72YL0E6EX"

};


let auth, db, provider;
let currentUser = null;

if (window.firebase) {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    provider = new firebase.auth.GoogleAuthProvider();
}

// === DOM ELEMENTS ===
const form = document.getElementById('watchlist-form');
const titleInput = document.getElementById('title');
const typeInput = document.getElementById('type');
const carouselsContainer = document.getElementById('carousels-container');
const errorMsg = document.getElementById('error-message');
const template = document.getElementById('card-template');
const navBtns = document.querySelectorAll('#category-filters .nav-link');
const filterUnwatchedToggle = document.getElementById('filter-unwatched-toggle');
const exportExcelBtn = document.getElementById('export-excel-btn');
const genreFilter = document.getElementById('genre-filter');
const mainHeader = document.getElementById('main-header');
const internalSearchInput = document.getElementById('internal-search');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

// Profile Elements
const btnSignin = document.getElementById('btn-signin');
const profileAvatarContainer = document.getElementById('profile-avatar-container');
const profileAvatar = document.getElementById('profile-avatar');
const profileMenu = document.getElementById('profile-menu');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const statMovies = document.getElementById('stat-movies');
const statShows = document.getElementById('stat-shows');
const statAnime = document.getElementById('stat-anime');
const btnDeleteAll = document.getElementById('btn-delete-all');
const btnSignout = document.getElementById('btn-signout');

// Hero Banner Elements
const heroBanner = document.getElementById('hero-banner');
const heroBg = document.getElementById('hero-bg');
const heroPoster = document.getElementById('hero-poster');
const heroTitle = document.getElementById('hero-title');
const heroMeta = document.getElementById('hero-meta');
const heroPlot = document.getElementById('hero-plot');
const heroBtnDetails = document.getElementById('hero-btn-details');
const heroBtnWatch = document.getElementById('hero-btn-watch');
let currentHeroItem = null;

// Modal Elements
let currentModalItem = null;
const detailsModal = document.getElementById('details-modal');
const btnCloseModal = document.querySelector('.btn-close-modal');
const modalBackdrop = document.querySelector('.modal-backdrop');
const modalHeroBg = document.getElementById('modal-hero-bg');
const modalHeroPoster = document.getElementById('modal-hero-poster');
const modalTitle = document.getElementById('modal-title');
const modalYear = document.getElementById('modal-year');
const modalScore = document.getElementById('modal-score');
const modalTypeOverride = document.getElementById('modal-type-override');
const modalEpisodes = document.getElementById('modal-episodes');
const modalRuntime = document.getElementById('modal-runtime');
const modalGenre = document.getElementById('modal-genre');
const modalGenreContainer = document.getElementById('modal-genre-container');
const modalCreator = document.getElementById('modal-creator');
const modalCreatorContainer = document.getElementById('modal-creator-container');
const modalPlot = document.getElementById('modal-plot');
const modalCast = document.getElementById('modal-cast');
const modalSeasonsContainer = document.getElementById('modal-seasons-container');
const modalSeasonsList = document.getElementById('modal-seasons-list');

// Autocomplete Elements
const autocompleteDropdown = document.getElementById('autocomplete-dropdown');

// Progress & Sort Elements
const globalSort = document.getElementById('global-sort');
const progressTracker = document.getElementById('progress-tracker');
const trackSeason = document.getElementById('track-season');
const trackEpisode = document.getElementById('track-episode');
const btnSaveProgress = document.getElementById('btn-save-progress');

// Confirm Delete Modal Elements
const confirmModal = document.getElementById('confirm-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
const confirmItemTitle = document.getElementById('confirm-item-title');
let itemToDeleteId = null;

// Bulk Import Elements
const bulkImportBtn = document.getElementById('bulk-import-btn');
const bulkImportModal = document.getElementById('bulk-import-modal');
const btnCloseBulk = document.getElementById('btn-close-bulk');
const bulkImportText = document.getElementById('bulk-import-text');
const bulkTypeSelect = document.getElementById('bulk-type');
const btnStartBulk = document.getElementById('btn-start-bulk');
const bulkProgressContainer = document.getElementById('bulk-progress-container');
const bulkProgressText = document.getElementById('bulk-progress-text');
const bulkProgressFill = document.getElementById('bulk-progress-fill');

// === STATE ===
let watchlist = JSON.parse(localStorage.getItem('cinevault_data')) || [];
let currentFilter = 'all'; // 'all', 'movie', 'series', 'anime'
let showUnwatchedOnly = localStorage.getItem('cinevault_unwatched_filter') === 'true';

// === INIT ===
function init() {
    renderRows();

    // Sort & Filter Events
    globalSort.addEventListener('change', renderRows);
    genreFilter.addEventListener('change', renderRows);

    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });

    if (mobileMenuToggle && sidebarElement) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebarElement.classList.toggle('mobile-open');
        });
    }

    renderRows();
}

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key.toLowerCase()) {
        case 's': e.preventDefault(); titleInput.focus(); break;
        case '1': navBtns[0].click(); break;
        case '2': navBtns[1].click(); break;
        case '3': navBtns[2].click(); break;
        case '4': navBtns[3].click(); break;
    }
});

// === EVENT LISTENERS ===
typeInput.addEventListener('change', () => {
    autocompleteDropdown.classList.add('hidden');
});

document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) autocompleteDropdown.classList.add('hidden');
});

const sidebarElement = document.querySelector('.sidebar');
if (sidebarElement && typeInput) {
    sidebarElement.addEventListener('mouseleave', () => {
        if (!sidebarElement.classList.contains('searching')) {
            typeInput.blur();
        }
    });
}

// Add searching class to keep sidebar expanded during search
titleInput.addEventListener('focus', () => sidebarElement.classList.add('searching'));
titleInput.addEventListener('blur', () => {
    setTimeout(() => sidebarElement.classList.remove('searching'), 200);
});
typeInput.addEventListener('focus', () => sidebarElement.classList.add('searching'));
typeInput.addEventListener('blur', () => sidebarElement.classList.remove('searching'));

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = titleInput.value.trim();
    if (query.length >= 2) {
        performSearch(query, typeInput.value);
    }
});

internalSearchInput.addEventListener('input', renderRows);

exportExcelBtn.addEventListener('click', () => {
    if (watchlist.length === 0) {
        showError('Your watchlist is empty!');
        return;
    }
    const headers = ['Title', 'Type', 'Year', 'IMDB Score', 'Status', 'Progress', 'Genres', 'Date Added'];
    let csvContent = headers.join(',') + '\n';

    watchlist.forEach(item => {
        const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        const status = item.isUnwatched === false ? 'Watched' : 'Unwatched';
        const progress = item.progress || '';
        const dateStr = item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '';

        const row = [
            escapeCSV(item.title),
            escapeCSV(item.type),
            escapeCSV(item.year),
            escapeCSV(item.score),
            escapeCSV(status),
            escapeCSV(progress),
            escapeCSV(item.genre),
            escapeCSV(dateStr)
        ];
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bingedeck_watchlist.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

const apiCache = {};

async function performSearch(query, type) {
    if (typeof OMDB_API_KEY === 'undefined' || OMDB_API_KEY === 'YOUR_API_KEY_HERE') return;
    const cacheKey = `${query.toLowerCase()}_${type}`;
    if (apiCache[cacheKey]) {
        renderAutocomplete(apiCache[cacheKey], type);
        return;
    }

    try {
        let results = [];
        
        // 1. Check Global Firebase Cache
        if (window.db) {
            try {
                const docRef = await db.collection('search_cache').doc(cacheKey).get();
                if (docRef.exists) {
                    results = docRef.data().results;
                    apiCache[cacheKey] = results;
                    renderAutocomplete(results, type);
                    return;
                }
            } catch (err) { console.warn("Cache read error", err); }
        }

        if (type === 'anime') {
            const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
            if (!res.ok) {
                showError(`Anime Search Error: Jikan API is temporarily unavailable (${res.status}). Please try again later.`);
                const submitBtn = document.getElementById('btn-submit-add');
                if(submitBtn) { submitBtn.innerHTML = '<i class="ph-bold ph-plus"></i>'; submitBtn.disabled = false; }
                return;
            }
            const data = await res.json();
            if (data.data) {
                results = data.data.map(item => ({
                    Title: item.title_english || item.title,
                    Year: item.year || (item.aired && item.aired.prop && item.aired.prop.from ? item.aired.prop.from.year : 'N/A'),
                    Poster: item.images?.jpg?.image_url || 'N/A',
                    imdbID: null
                }));
            }
        } else {
            const queryType = type === 'series' ? 'series' : (type === 'mixed' ? '' : 'movie');
            const typeStr = queryType ? `&type=${queryType}` : '';
            const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}${typeStr}&apikey=${OMDB_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) {
                showError(`Search Error: OMDB API is temporarily unavailable (${res.status}).`);
                return;
            }
            const data = await res.json();
            if (data.Response === 'True' && data.Search) {
                results = data.Search;
            }
        }
        
        if (results.length > 0) {
            apiCache[cacheKey] = results;
            // 2. Save to Global Firebase Cache
            if (window.db) {
                db.collection('search_cache').doc(cacheKey).set({ results }).catch(err => console.warn(err));
            }
            renderAutocomplete(results, type);
        } else {
            autocompleteDropdown.classList.add('hidden');
        }
    } catch (err) {
        autocompleteDropdown.classList.add('hidden');
    }
}

function renderAutocomplete(results, type) {
    autocompleteDropdown.innerHTML = '';
    results.slice(0, 5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        const posterSrc = item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/40x60/222222/6b7280?text=NA';
        div.innerHTML = `
            <img src="${posterSrc}" alt="Poster" class="autocomplete-poster">
            <div class="autocomplete-item-info">
                <span class="autocomplete-item-title">${item.Title}</span>
                <span class="autocomplete-item-year">${item.Year}</span>
            </div>
        `;
        div.addEventListener('click', () => {
            titleInput.value = item.Title;
            autocompleteDropdown.classList.add('hidden');
            addWatchlistItem(item.Title, type, item.imdbID);
        });
        autocompleteDropdown.appendChild(div);
    });
    autocompleteDropdown.classList.remove('hidden');
}

async function addWatchlistItem(title, type, exactImdbId = null) {
    hideError();
    if (!title) return;
    if (watchlist.some(item => item.title.toLowerCase() === title.toLowerCase() && (item.type === type || type === 'mixed'))) {
        showError('Item is already in your watchlist!');
        return;
    }
    const submitBtn = document.getElementById('btn-submit-add');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i>';
    submitBtn.disabled = true;

    try {
        const metadata = await fetchMovieMetadata(title, type, exactImdbId);
        let actualType = metadata.actualType || type;

        if (actualType === 'anime' || type === 'anime') {
            actualType = 'anime';
            try {
                const jikanEps = await fetchAnimeTotalEpisodes(title);
                if (jikanEps && (metadata.totalSeasons === 1 || !metadata.totalSeasons)) {
                    metadata.episodes = `${jikanEps} Eps`;
                    metadata.totalSeasons = null;
                }
            } catch (err) { console.warn("Jikan fallback failed", err); }
        }

        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: metadata.title || title,
            year: metadata.year || 'N/A',
            type: actualType,
            poster: metadata.poster || 'https://via.placeholder.com/200x300/181818/6b7280?text=No+Poster',
            score: metadata.score || 'N/A',
            episodes: metadata.episodes || '',
            runtime: metadata.runtime || '',
            genre: metadata.genre || '',
            creator: metadata.creator || '',
            released: metadata.released || '',
            plot: metadata.plot || 'No description available.',
            cast: metadata.cast || '',
            imdbID: metadata.imdbID || null,
            totalSeasons: metadata.totalSeasons || null,
            addedAt: new Date().toISOString(),
            isUnwatched: true
        };

        watchlist.unshift(newItem);
        saveData();
        renderRows();
        titleInput.value = '';
        titleInput.blur();
    } catch (err) {
        showError(err.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// === BULK IMPORT LOGIC ===
bulkImportBtn.addEventListener('click', () => {
    bulkImportText.value = '';
    bulkProgressContainer.classList.add('hidden');
    bulkProgressFill.style.width = '0%';
    bulkImportModal.classList.remove('hidden');
});

btnCloseBulk.addEventListener('click', () => bulkImportModal.classList.add('hidden'));

btnStartBulk.addEventListener('click', async () => {
    const text = bulkImportText.value.trim();
    if (!text) return;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    const type = bulkTypeSelect.value;

    btnStartBulk.disabled = true; bulkImportText.disabled = true;
    bulkProgressContainer.classList.remove('hidden');

    let addedCount = 0; let failedTitles = [];

    for (let i = 0; i < lines.length; i++) {
        // Remove leading hyphens, bullets, or numbers (e.g. "- peaky blinders")
        const title = lines[i].replace(/^[-*•0-9.\s]+/, '').trim();
        if (!title) continue;
        
        bulkProgressText.textContent = `Processing ${i + 1} of ${lines.length}: ${title}...`;
        bulkProgressFill.style.width = `${((i + 1) / lines.length) * 100}%`;

        try {
            if (watchlist.some(item => item.title.toLowerCase() === title.toLowerCase())) continue;

            let metadata = null;
            let actualType = type;
            let eps = '';

            // 1. Try Jikan if Anime
            if (type === 'anime') {
                try {
                    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.data && data.data.length > 0) {
                            const item = data.data[0];
                            metadata = {
                                title: item.title_english || item.title,
                                year: item.year || (item.aired && item.aired.prop && item.aired.prop.from ? item.aired.prop.from.year : 'N/A'),
                                poster: item.images?.jpg?.image_url || null,
                                score: item.score ? item.score.toString() : 'N/A',
                                episodes: item.episodes ? `${item.episodes} Eps` : '',
                                runtime: item.duration || '',
                                genre: item.genres ? item.genres.map(g => g.name).join(', ') : '',
                                plot: item.synopsis || 'No description available.',
                                actualType: 'anime',
                                totalSeasons: null,
                                imdbID: null
                            };
                            eps = metadata.episodes;
                            actualType = 'anime';
                        }
                    }
                } catch(e) { console.warn("Jikan fallback failed", e); }
            }

            // 2. Fallback to OMDB
            if (!metadata) {
                metadata = await fetchMovieMetadata(title, type);
                eps = metadata.episodes;
                actualType = metadata.actualType || type;

                if (actualType === 'anime' || type === 'anime') {
                    actualType = 'anime';
                    try {
                        const jikanEps = await fetchAnimeTotalEpisodes(title);
                        if (jikanEps && (metadata.totalSeasons === 1 || !metadata.totalSeasons)) {
                            eps = `${jikanEps} Eps`;
                            metadata.totalSeasons = null;
                        }
                    } catch (err) { }
                }
            }

            watchlist.unshift({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: metadata.title || title,
                year: metadata.year || 'N/A',
                type: actualType,
                poster: metadata.poster || 'https://via.placeholder.com/200x300/181818/6b7280?text=No+Poster',
                score: metadata.score || 'N/A',
                episodes: eps || '',
                runtime: metadata.runtime || '',
                genre: metadata.genre || '',
                creator: metadata.creator || '',
                released: metadata.released || '',
                plot: metadata.plot || 'No description available.',
                cast: metadata.cast || '',
                imdbID: metadata.imdbID || null,
                totalSeasons: metadata.totalSeasons || null,
                addedAt: new Date().toISOString(),
                isUnwatched: true
            });
            addedCount++;
        } catch (err) { failedTitles.push(title); }
        await new Promise(r => setTimeout(r, 350));
    }

    saveData(); renderRows();
    let resultMsg = `Successfully added ${addedCount} item(s).`;
    if (failedTitles.length > 0) resultMsg += ` Failed to find ${failedTitles.length} item(s): ${failedTitles.join(', ')}`;

    bulkProgressText.textContent = resultMsg;
    btnStartBulk.disabled = false; bulkImportText.disabled = false;
    if (failedTitles.length === 0) setTimeout(() => bulkImportModal.classList.add('hidden'), 3000);
});

// Sidebar Navigation (Filters)
navBtns.forEach(btn => {
    if (btn.id === 'filter-unwatched-toggle') return;
    btn.addEventListener('click', () => {
        navBtns.forEach(b => { if (b.id !== 'filter-unwatched-toggle') b.classList.remove('active') });
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-tab');
        renderRows();
    });
});

filterUnwatchedToggle.addEventListener('click', () => {
    showUnwatchedOnly = !showUnwatchedOnly;
    filterUnwatchedToggle.classList.toggle('active', showUnwatchedOnly);
    localStorage.setItem('cinevault_unwatched_filter', showUnwatchedOnly);
    renderRows();
});

exportExcelBtn.addEventListener('click', () => {
    if (watchlist.length === 0) return;
    const headers = ['Title', 'Type', 'Year', 'Score', 'Episodes', 'Runtime', 'Genre', 'Creator', 'Released', 'Status'];
    const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
    const rows = watchlist.map(item => [
        escapeCsv(item.title), escapeCsv(item.type), escapeCsv(item.year), escapeCsv(item.score),
        escapeCsv(item.episodes), escapeCsv(item.runtime), escapeCsv(item.genre), escapeCsv(item.creator),
        escapeCsv(item.released), escapeCsv(item.isUnwatched === false ? 'Watched' : 'Unwatched')
    ].join(','));
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'BingeDeck_Watchlist.csv';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
});

// === UI & STORAGE ===
function saveData() {
    localStorage.setItem('cinevault_data', JSON.stringify(watchlist));
    if (currentUser && window.db) {
        db.collection('users').doc(currentUser.uid).set({ watchlist: watchlist })
            .catch(err => {
                console.error("Error syncing to cloud: ", err);
                showError("Cloud Sync Failed: " + err.message);
            });
    }
}

function renderHeroBanner(items) {
    if (items.length === 0) {
        heroBanner.classList.add('hidden');
        carouselsContainer.classList.add('no-hero');
        return;
    }

    // Pick the most recently added unwatched item for the hero banner, or fallback
    let heroItem = items.find(i => i.isUnwatched) || items[0];
    currentHeroItem = heroItem;

    heroBanner.classList.remove('hidden');
    carouselsContainer.classList.remove('no-hero');

    heroBg.style.backgroundImage = `url('${heroItem.poster}')`;
    heroPoster.src = heroItem.poster;
    heroTitle.textContent = heroItem.title;

    // Create meta string
    const metaParts = [];
    if (heroItem.score !== 'N/A') metaParts.push(`<span style="color:gold; font-weight:bold;"><i class="ph-fill ph-star"></i> IMDb ${heroItem.score}</span>`);
    if (heroItem.year && heroItem.year !== 'N/A') metaParts.push(`<span>${heroItem.year}</span>`);
    metaParts.push(`<span class="border-badge">${heroItem.type.toUpperCase()}</span>`);
    if (heroItem.episodes) metaParts.push(`<span>${heroItem.episodes}</span>`);
    else if (heroItem.runtime) metaParts.push(`<span>${heroItem.runtime}</span>`);

    heroMeta.innerHTML = metaParts.join(' ');
    heroPlot.textContent = heroItem.plot || 'No description available.';

    // Watch state
    if (heroItem.isUnwatched === false) {
        heroBtnWatch.innerHTML = '<i class="ph-bold ph-check"></i> Watched';
    } else {
        heroBtnWatch.innerHTML = '<i class="ph-bold ph-eye"></i> Mark Watched';
    }

    // Use .onclick to safely overwrite listeners without needing to clone/replace DOM nodes
    heroBtnDetails.onclick = () => openModal(currentHeroItem);

    heroBtnWatch.onclick = () => {
        currentHeroItem.isUnwatched = !currentHeroItem.isUnwatched;
        if (!currentHeroItem.isUnwatched) delete currentHeroItem.progress;
        saveData();
        renderRows();
    };
}

function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) chunked.push(array.slice(i, i + size));
    return chunked;
}

function createCardNode(item) {
    const cardNode = document.importNode(template.content, true);
    const card = cardNode.querySelector('.netflix-card');

    card.querySelector('.poster').src = item.poster;
    card.querySelector('.card-title').textContent = item.title;
    card.querySelector('.card-year').textContent = item.year;
    card.querySelector('.score-val').innerHTML = item.score !== 'N/A' ? `<i class="ph-fill ph-star"></i> IMDb ${item.score}` : '';
    const typeBadge = card.querySelector('.type-badge');
    if (item.progress && (item.type === 'series' || item.type === 'anime')) {
        typeBadge.textContent = `S${item.progress.season} E${item.progress.episode}`;
    } else {
        typeBadge.textContent = item.type.toUpperCase();
    }

    if (item.episodes) {
        const epEl = card.querySelector('.episodes');
        epEl.textContent = item.episodes;
        epEl.classList.remove('hidden');
    }

    const watchBtn = card.querySelector('.btn-watch-toggle');
    if (item.isUnwatched === false) {
        card.classList.add('watched');
        watchBtn.innerHTML = '<i class="ph-bold ph-check"></i>';
        watchBtn.classList.add('active');
        watchBtn.title = "Mark as Unwatched";
    } else {
        watchBtn.title = "Mark as Watched";
    }

    watchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        item.isUnwatched = !item.isUnwatched;
        if (!item.isUnwatched) delete item.progress;
        saveData(); renderRows();
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        itemToDeleteId = item.id;
        confirmItemTitle.textContent = item.title;
        confirmModal.classList.remove('hidden');
    });

    card.addEventListener('click', () => openModal(item));
    return card;
}

function renderRows() {
    carouselsContainer.innerHTML = '';

    let baseList = currentFilter === 'all' ? watchlist : watchlist.filter(item => item.type === currentFilter);
    if (showUnwatchedOnly) baseList = baseList.filter(item => item.isUnwatched !== false);
    
    const internalQuery = internalSearchInput.value.toLowerCase().trim();
    if (internalQuery) {
        baseList = baseList.filter(item => item.title.toLowerCase().includes(internalQuery));
    }

    // Extract unique genres for dropdown
    const uniqueGenres = new Set();
    watchlist.forEach(item => {
        if (item.genre && item.genre !== 'N/A') {
            item.genre.split(',').forEach(g => uniqueGenres.add(g.trim()));
        }
    });

    // Populate genre filter without losing current selection
    const currentSelectedGenre = genreFilter.value;
    const optionsHtml = ['<option value="all">All Genres</option>'];
    Array.from(uniqueGenres).sort().forEach(g => {
        optionsHtml.push(`<option value="${g}">${g}</option>`);
    });
    genreFilter.innerHTML = optionsHtml.join('');
    genreFilter.value = currentSelectedGenre || 'all';

    // Apply Genre Filter
    if (genreFilter.value !== 'all') {
        baseList = baseList.filter(item => item.genre && item.genre.includes(genreFilter.value));
    }

    // Apply global sort
    const sortVal = globalSort.value;
    baseList.sort((a, b) => {
        if (sortVal === 'added_desc') return new Date(b.addedAt) - new Date(a.addedAt);
        if (sortVal === 'added_asc') return new Date(b.addedAt) - new Date(a.addedAt);
        if (sortVal === 'score_desc') return (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0);
        if (sortVal === 'score_asc') return (parseFloat(a.score) || 0) - (parseFloat(b.score) || 0);
        if (sortVal === 'year_desc') return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
        if (sortVal === 'year_asc') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
        if (sortVal === 'alpha_asc') return a.title.localeCompare(b.title);
        if (sortVal === 'alpha_desc') return b.title.localeCompare(a.title);
        if (sortVal === 'runtime_desc') return (parseInt(b.runtime) || 0) - (parseInt(a.runtime) || 0);
        return 0;
    });

    if (baseList.length === 0) {
        heroBanner.classList.add('hidden');
        carouselsContainer.classList.add('no-hero');
        carouselsContainer.innerHTML = '<h3 style="color:#777; text-align:center; margin-top:50px;">Your list is empty. Add some titles!</h3>';
        return;
    }

    // Update Navigation Counts
    const tabHome = document.querySelector('[data-tab="all"]');
    const tabMovies = document.querySelector('[data-tab="movie"]');
    const tabSeries = document.querySelector('[data-tab="series"]');
    const tabAnime = document.querySelector('[data-tab="anime"]');

    if (tabHome) tabHome.textContent = `Home (${watchlist.length})`;
    if (tabMovies) tabMovies.textContent = `Movies (${watchlist.filter(i => i.type === 'movie').length})`;
    if (tabSeries) tabSeries.textContent = `TV Shows (${watchlist.filter(i => i.type === 'series').length})`;
    if (tabAnime) tabAnime.textContent = `Anime (${watchlist.filter(i => i.type === 'anime').length})`;

    if (currentFilter === 'all') {
        heroBanner.classList.remove('hidden');
        carouselsContainer.classList.remove('no-hero');
        renderHeroBanner(baseList);

        const rows = [];
        const CHUNK_SIZE = 15;

        const unwatched = baseList.filter(i => i.isUnwatched !== false);
        if (unwatched.length > 0) {
            const chunks = chunkArray(unwatched, CHUNK_SIZE);
            chunks.forEach((c, i) => rows.push({ title: chunks.length > 1 ? `Continue Watching (${i * CHUNK_SIZE + 1}-${i * CHUNK_SIZE + c.length})` : 'Continue Watching', items: c }));
        }

        // Trending sorting ignores global sort for UI logic, but here we keep it as it's just 'Recently Added' default
        const trending = [...baseList].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        if (trending.length > 0) {
            const chunks = chunkArray(trending, CHUNK_SIZE);
            chunks.forEach((c, i) => rows.push({ title: chunks.length > 1 ? `Recently Added (${i * CHUNK_SIZE + 1}-${i * CHUNK_SIZE + c.length})` : 'Recently Added', items: c }));
        }

        const movies = baseList.filter(i => i.type === 'movie');
        if (movies.length > 0) {
            const chunks = chunkArray(movies, CHUNK_SIZE);
            chunks.forEach((c, i) => rows.push({ title: chunks.length > 1 ? `Your Movies (${i * CHUNK_SIZE + 1}-${i * CHUNK_SIZE + c.length})` : 'Your Movies', items: c }));
        }

        const series = baseList.filter(i => i.type === 'series');
        if (series.length > 0) {
            const chunks = chunkArray(series, CHUNK_SIZE);
            chunks.forEach((c, i) => rows.push({ title: chunks.length > 1 ? `Binge-Worthy TV Shows (${i * CHUNK_SIZE + 1}-${i * CHUNK_SIZE + c.length})` : 'Binge-Worthy TV Shows', items: c }));
        }

        const anime = baseList.filter(i => i.type === 'anime');
        if (anime.length > 0) {
            const chunks = chunkArray(anime, CHUNK_SIZE);
            chunks.forEach((c, i) => rows.push({ title: chunks.length > 1 ? `Anime Collection (${i * CHUNK_SIZE + 1}-${i * CHUNK_SIZE + c.length})` : 'Anime Collection', items: c }));
        }

        const watched = baseList.filter(i => i.isUnwatched === false);
        if (watched.length > 0 && !showUnwatchedOnly) {
            const chunks = chunkArray(watched, CHUNK_SIZE);
            chunks.forEach((c, i) => rows.push({ title: chunks.length > 1 ? `Watch It Again (${i * CHUNK_SIZE + 1}-${i * CHUNK_SIZE + c.length})` : 'Watch It Again', items: c }));
        }

        const fragment = document.createDocumentFragment();

        rows.forEach(row => {
            if (row.items.length === 0) return;
            const rowSection = document.createElement('div');
            rowSection.className = 'carousel-row';
            rowSection.innerHTML = `<h3 class="carousel-title">${row.title}</h3>`;
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'carousel-container';
            row.items.forEach(item => scrollContainer.appendChild(createCardNode(item)));
            rowSection.appendChild(scrollContainer);
            fragment.appendChild(rowSection);
        });

        carouselsContainer.appendChild(fragment);
    } else {
        heroBanner.classList.add('hidden');
        carouselsContainer.classList.add('no-hero');

        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        carouselsContainer.appendChild(gridContainer);

        let loadedCount = 0;
        const CHUNK = 40;

        function loadMore() {
            const fragment = document.createDocumentFragment();
            const itemsToLoad = baseList.slice(loadedCount, loadedCount + CHUNK);
            itemsToLoad.forEach(item => fragment.appendChild(createCardNode(item)));
            gridContainer.appendChild(fragment);
            loadedCount += itemsToLoad.length;

            if (loadedCount >= baseList.length && window.gridObserver) {
                window.gridObserver.disconnect();
            }
        }

        loadMore(); // Initial load

        if (loadedCount < baseList.length) {
            const sentinel = document.createElement('div');
            sentinel.style.height = '1px';
            carouselsContainer.appendChild(sentinel);

            if (window.gridObserver) window.gridObserver.disconnect();
            window.gridObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) loadMore();
            }, { rootMargin: '400px' });
            window.gridObserver.observe(sentinel);
        }
    }
}

function showError(msg) { errorMsg.textContent = msg; errorMsg.classList.remove('hidden'); setTimeout(hideError, 4000); }
function hideError() { errorMsg.classList.add('hidden'); errorMsg.textContent = ''; }

// === MODAL LOGIC ===
function openModal(item) {
    currentModalItem = item;
    modalHeroBg.style.backgroundImage = `url('${item.poster}')`;
    modalHeroPoster.src = item.poster;
    modalTitle.textContent = item.title;
    modalYear.textContent = item.year;
    modalScore.textContent = item.score;
    modalTypeOverride.value = item.type;

    if (item.episodes) { modalEpisodes.textContent = `• ${item.episodes}`; modalEpisodes.classList.remove('hidden'); }
    else { modalEpisodes.classList.add('hidden'); }

    if (item.runtime) { modalRuntime.textContent = `• ${item.runtime}`; modalRuntime.classList.remove('hidden'); }
    else { modalRuntime.classList.add('hidden'); }

    if (item.genre) { modalGenre.textContent = item.genre; modalGenreContainer.classList.remove('hidden'); }
    else { modalGenreContainer.classList.add('hidden'); }

    if (item.creator) { modalCreator.textContent = item.creator; modalCreatorContainer.classList.remove('hidden'); }
    else { modalCreatorContainer.classList.add('hidden'); }

    modalPlot.textContent = item.plot;

    if (item.cast) { modalCast.textContent = item.cast; modalCast.parentElement.classList.remove('hidden'); }
    else { modalCast.textContent = ''; modalCast.parentElement.classList.add('hidden'); }

    modalSeasonsContainer.classList.add('hidden');
    modalSeasonsList.innerHTML = '';
    detailsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Progress Tracker Widget
    if (item.type === 'series' || item.type === 'anime') {
        progressTracker.classList.remove('hidden');
        trackSeason.value = item.progress ? item.progress.season : '';
        trackEpisode.value = item.progress ? item.progress.episode : '';
        btnSaveProgress.onclick = () => {
            const s = parseInt(trackSeason.value);
            const e = parseInt(trackEpisode.value);
            if (s && e) {
                item.progress = { season: s, episode: e };
                saveData(); renderRows(); closeModal();
            }
        };
    } else {
        progressTracker.classList.add('hidden');
    }

    // Season fetching removed to ensure 0 API calls on modal open.
    // The total episodes/progress are already cached in Firebase.
}

async function fetchSeasonBreakdown(imdbID, totalSeasons) {
    try {
        const promises = [];
        const maxSeasons = Math.min(totalSeasons, 15);
        for (let i = 1; i <= maxSeasons; i++) promises.push(fetch(`https://www.omdbapi.com/?i=${imdbID}&Season=${i}&apikey=${OMDB_API_KEY}`).then(r => r.json()));

        const seasonsData = await Promise.all(promises);
        modalSeasonsList.innerHTML = '';
        seasonsData.forEach(data => {
            if (data.Response === 'True' && data.Episodes) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>Season ${data.Season}:</strong> ${data.Episodes.length} Episodes`;
                modalSeasonsList.appendChild(li);
            }
        });
        if (totalSeasons > 15) {
            const li = document.createElement('li'); li.textContent = `...and ${totalSeasons - 15} more seasons.`; modalSeasonsList.appendChild(li);
        }
    } catch (err) { modalSeasonsList.innerHTML = '<li>Failed to load season details.</li>'; }
}

function closeModal() { detailsModal.classList.add('hidden'); document.body.style.overflow = ''; }
btnCloseModal.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

modalTypeOverride.addEventListener('change', (e) => {
    if (currentModalItem) {
        currentModalItem.type = e.target.value;
        saveData();
        renderRows();
    }
});

btnCancelDelete.addEventListener('click', () => { confirmModal.classList.add('hidden'); itemToDeleteId = null; });
btnConfirmDelete.addEventListener('click', () => {
    if (itemToDeleteId) {
        watchlist = watchlist.filter(w => w.id !== itemToDeleteId);
        saveData(); renderRows(); confirmModal.classList.add('hidden'); itemToDeleteId = null;
    }
});

// API Helpers
async function fetchMovieMetadata(title, type, exactImdbId = null) {
    if (typeof OMDB_API_KEY === 'undefined' || OMDB_API_KEY === 'YOUR_API_KEY_HERE') throw new Error('API Key missing.');
    
    const cacheKey = exactImdbId || title.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + type;
    
    if (window.db) {
        try {
            const docRef = await db.collection('movie_cache').doc(cacheKey).get();
            if (docRef.exists) return docRef.data();
        } catch(e) { console.warn("Movie cache read error", e); }
    }

    let url = exactImdbId ? `https://www.omdbapi.com/?i=${exactImdbId}&apikey=${OMDB_API_KEY}` : `https://www.omdbapi.com/?t=${encodeURIComponent(title)}${type !== 'mixed' ? '&type=' + (type === 'series' || type === 'anime' ? 'series' : 'movie') : ''}&apikey=${OMDB_API_KEY}`;
    const data = await (await fetch(url)).json();
    if (data.Response === 'False') throw new Error(data.Error || 'Not found');
    const resolvedType = type === 'mixed' ? (data.Type === 'series' ? 'series' : 'movie') : type;
    
    const result = {
        title: data.Title, year: data.Year, poster: data.Poster !== 'N/A' ? data.Poster : null,
        score: data.imdbRating !== 'N/A' ? data.imdbRating : 'N/A', episodes: (resolvedType === 'series' || resolvedType === 'anime') && data.totalSeasons ? `${data.totalSeasons} S` : '',
        runtime: data.Runtime !== 'N/A' ? data.Runtime : '', genre: data.Genre !== 'N/A' ? data.Genre : '',
        creator: data.Director !== 'N/A' && data.Director ? data.Director : (data.Writer !== 'N/A' ? data.Writer : ''),
        released: data.Released !== 'N/A' ? data.Released : '', plot: data.Plot !== 'N/A' ? data.Plot : '',
        cast: data.Actors !== 'N/A' ? data.Actors : '', imdbID: data.imdbID,
        totalSeasons: (resolvedType === 'series' || resolvedType === 'anime') ? parseInt(data.totalSeasons) : null, actualType: resolvedType
    };

    if (window.db) {
        if (data.imdbID) db.collection('movie_cache').doc(data.imdbID).set(result).catch(e=>console.warn(e));
        if (!exactImdbId) db.collection('movie_cache').doc(cacheKey).set(result).catch(e=>console.warn(e));
    }

    return result;
}

async function fetchAnimeTotalEpisodes(title) {
    const cacheKey = 'anime_eps_' + title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (window.db) {
        try {
            const docRef = await db.collection('movie_cache').doc(cacheKey).get();
            if (docRef.exists) return docRef.data().episodes;
        } catch(e) {}
    }

    const data = await (await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`)).json();
    const eps = data.data?.[0]?.episodes || null;
    
    if (window.db && eps) {
        db.collection('movie_cache').doc(cacheKey).set({ episodes: eps }).catch(e=>console.warn(e));
    }
    return eps;
}

// === FIREBASE AUTH & DATABASE LOGIC ===
if (auth) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            // Update UI
            btnSignin.classList.add('hidden');
            profileAvatarContainer.classList.remove('hidden');
            profileAvatar.src = user.photoURL || 'https://via.placeholder.com/36';
            profileName.textContent = user.displayName || 'User';
            profileEmail.textContent = user.email || '';

            // Fetch Cloud Data
            try {
                const docRef = await db.collection('users').doc(user.uid).get();
                let cloudWatchlist = [];
                if (docRef.exists) {
                    cloudWatchlist = docRef.data().watchlist || [];
                }
                
                // Merge local watchlist with cloud watchlist (avoiding duplicates)
                let merged = [...cloudWatchlist];
                watchlist.forEach(localItem => {
                    if (!merged.some(cloudItem => cloudItem.id === localItem.id || cloudItem.title.toLowerCase() === localItem.title.toLowerCase())) {
                        merged.push(localItem);
                    }
                });
                
                watchlist = merged;
                // Force sync the merged list to both local storage and cloud
                saveData();
                renderRows();
            } catch (err) {
                console.error("Error fetching cloud data:", err);
                showError("Cloud Fetch Failed: " + err.message + ". Please check Firestore Security Rules.");
            }
        } else {
            currentUser = null;
            btnSignin.classList.remove('hidden');
            profileAvatarContainer.classList.add('hidden');
        }
    });

    btnSignin.addEventListener('click', () => {
        auth.signInWithPopup(provider).catch(err => showError(err.message));
    });

    btnSignout.addEventListener('click', () => {
        auth.signOut().then(() => {
            profileMenu.classList.add('hidden');
            showError("Signed out successfully.");
        });
    });

    profileAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        // Update stats
        statMovies.textContent = watchlist.filter(i => i.type === 'movie').length;
        statShows.textContent = watchlist.filter(i => i.type === 'series').length;
        statAnime.textContent = watchlist.filter(i => i.type === 'anime').length;
        profileMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!profileAvatarContainer.contains(e.target)) {
            profileMenu.classList.add('hidden');
        }
    });

    btnDeleteAll.addEventListener('click', () => {
        if (confirm("Are you SURE you want to permanently delete all data from the cloud?")) {
            watchlist = [];
            saveData();
            renderRows();
            profileMenu.classList.add('hidden');
            showError("All data deleted.");
        }
    });
}

init();
