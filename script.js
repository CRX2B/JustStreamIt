// Configuration de l'API
const API_BASE_URL = 'http://localhost:8000/api/v1';
const ITEMS_PER_PAGE = 6;
const DEFAULT_IMAGE = 'images/Image_Non_Dispo.jpg';

// Sélecteurs DOM
const modal = document.getElementById('movie-modal');
const closeBtn = document.querySelector('.close');
const carouselButtons = document.querySelectorAll('.carousel-button');
const categorySelect = document.getElementById('category-select');
const showMoreButtons = document.querySelectorAll('.show-more-button');

// État de l'application
let availableCategories = [];
let hiddenMoviesVisible = {};

// Fermeture de la modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Fonction pour récupérer les données de l'API
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return null;
    }
}

// Fonction pour récupérer les films par catégorie
async function fetchMoviesByCategory(category, page = 1) {
    const url = `${API_BASE_URL}/titles/?genre=${category}&sort_by=-votes,-imdb_score&page=${page}&page_size=10000`;
    return await fetchData(url);
}

// Fonction pour récupérer les meilleurs films
async function fetchTopRatedMovies(page = 1) {
    const url = `${API_BASE_URL}/titles/?sort_by=-votes,-imdb_score&page=${page}&page_size=10000`;
    return await fetchData(url);
}

// Fonction pour récupérer les détails d'un film
async function fetchMovieDetails(movieId) {
    const url = `${API_BASE_URL}/titles/${movieId}`;
    return await fetchData(url);
}

// Fonction pour récupérer toutes les catégories disponibles
async function fetchCategories() {
    const url = `${API_BASE_URL}/genres/?page_size=30`;
    const response = await fetchData(url);
    
    if (!response || !response.results) return;

    // Extraction des noms de genres
    availableCategories = response.results
        .map(genre => genre.name)
        .sort();

    populateCategorySelect();
}

// Fonction pour peupler le sélecteur de catégories
function populateCategorySelect() {
    categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
    
    // On ajoute toutes les catégories sauf Action et Comedy
    availableCategories
        .filter(category => !['Action', 'Comedy'].includes(category))
        .forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
}

// Fonction pour créer une carte de film
function createMovieCard(movie) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    
    const img = document.createElement('img');
    img.alt = movie.title;
    img.src = movie.image_url;
    
    // Gestion des images non disponibles
    img.onerror = () => {
        img.src = DEFAULT_IMAGE;
    };
    
    const titleOverlay = document.createElement('div');
    titleOverlay.className = 'movie-title-overlay';
    const titleText = document.createElement('h3');
    titleText.textContent = movie.title;
    titleOverlay.appendChild(titleText);
    
    movieCard.appendChild(img);
    movieCard.appendChild(titleOverlay);
    movieCard.onclick = () => showMovieDetails(movie.id);
    return movieCard;
}

// Fonction pour afficher les détails d'un film
async function showMovieDetails(movieId) {
    const movie = await fetchMovieDetails(movieId);
    if (!movie) return;

    const modalImage = document.getElementById('modal-image');
    modalImage.src = movie.image_url;
    modalImage.onerror = () => {
        modalImage.src = DEFAULT_IMAGE;
    };

    document.getElementById('modal-title').textContent = movie.title;
    document.getElementById('modal-genre').textContent = `Genre: ${movie.genres.join(', ')}`;
    document.getElementById('modal-date').textContent = `Date de sortie: ${movie.date_published}`;
    document.getElementById('modal-rated').textContent = `Rated: ${movie.rated}`;
    document.getElementById('modal-imdb-score').textContent = `Score IMDb: ${movie.imdb_score}`;
    document.getElementById('modal-directors').textContent = `Réalisateur(s): ${movie.directors.join(', ')}`;
    document.getElementById('modal-actors').textContent = `Acteurs: ${movie.actors.join(', ')}`;
    document.getElementById('modal-duration').textContent = `Durée: ${movie.duration} min`;
    document.getElementById('modal-countries').textContent = `Pays: ${movie.countries.join(', ')}`;
    document.getElementById('modal-box-office').textContent = `Box Office: ${movie.worldwide_gross_income ? movie.worldwide_gross_income.toLocaleString() + ' $' : 'Non disponible'}`;
    document.getElementById('modal-description').textContent = `Description: ${movie.description}`;

    modal.style.display = "flex";
}

// Fonction pour charger le meilleur film
async function loadBestMovie() {
    const data = await fetchTopRatedMovies();
    if (!data || !data.results.length) return;

    const bestMovie = data.results[0];
    const movieDetails = await fetchMovieDetails(bestMovie.id);
    if (!movieDetails) return;
    
    const heroSection = document.getElementById('best-movie');
    const container = document.createElement('div');
    container.className = 'best-movie-container';
    
    const img = document.createElement('img');
    img.className = 'best-movie-image';
    img.src = bestMovie.image_url;
    img.alt = bestMovie.title;
    img.onerror = () => {
        img.src = DEFAULT_IMAGE;
    };
    
    const info = document.createElement('div');
    info.className = 'best-movie-info';
    
    info.innerHTML = `
        <h1>${movieDetails.title}</h1>
        <p class="movie-description">${movieDetails.description}</p>
        <button class="info-button">Plus d'informations</button>
    `;
    
    container.appendChild(img);
    container.appendChild(info);
    heroSection.innerHTML = '';
    heroSection.appendChild(container);
    
    const infoButton = info.querySelector('.info-button');
    infoButton.onclick = () => showMovieDetails(bestMovie.id);
}

// Fonction pour charger une catégorie de films
async function loadMovieCategory(categoryId, category = '') {
    const container = document.getElementById(categoryId);
    const data = category ? 
        await fetchMoviesByCategory(category, 1) : 
        await fetchTopRatedMovies(1);
    
    if (!data || !data.results.length) return;
    
    // On prend seulement les 6 premiers films (qui sont déjà triés par votes et score)
    const uniqueMovies = data.results.slice(0, ITEMS_PER_PAGE);
    container.innerHTML = '';
    uniqueMovies.forEach((movie, index) => {
        const card = createMovieCard(movie);
        // Gestion de l'affichage initial selon la taille de l'écran
        if ((window.innerWidth <= 480 && index >= 2) || 
            (window.innerWidth <= 1024 && index >= 4) || 
            (window.innerWidth > 1024 && index >= 6)) {
            card.classList.add('hidden');
        }
        container.appendChild(card);
    });

    // Initialiser l'état des films cachés
    hiddenMoviesVisible[categoryId] = false;
}

// Gestion des boutons du carousel
carouselButtons.forEach(button => {
    button.addEventListener('click', () => {
        const direction = button.classList.contains('prev') ? -1 : 1;
        const carousel = button.parentElement;
        const grid = carousel.querySelector('.movies-grid');
        const cardWidth = grid.querySelector('.movie-card').offsetWidth + 8; // 8 pour le gap
        grid.scrollLeft += cardWidth * direction * 4;
    });
});

// Gestion du bouton "Voir plus"
showMoreButtons.forEach(button => {
    button.addEventListener('click', () => {
        const section = button.closest('.movies-section');
        const moviesGrid = section.querySelector('.movies-grid');
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 480;
        
        let hiddenMovies;
        if (isMobile) {
            // Sur mobile, on montre tous les films à partir du 3ème
            hiddenMovies = moviesGrid.querySelectorAll('.movie-card:nth-child(n+3)');
        } else if (isTablet) {
            // Sur tablette, on montre la deuxième rangée (films 5-8)
            hiddenMovies = moviesGrid.querySelectorAll('.movie-card:nth-child(n+5)');
        }
        
        const isShowing = button.textContent === 'Voir plus';
        
        if (hiddenMovies) {
            hiddenMovies.forEach(movie => {
                if (isShowing) {
                    movie.classList.add('show-more');
                } else {
                    movie.classList.remove('show-more');
                }
            });
        }
        
        button.textContent = isShowing ? 'Voir moins' : 'Voir plus';
    });
});

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    const movieGrids = document.querySelectorAll('.movies-grid');
    movieGrids.forEach(grid => {
        const cards = grid.querySelectorAll('.movie-card');
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 480;
        
        cards.forEach((card, index) => {
            if (isMobile && index >= 2) {
                if (!hiddenMoviesVisible[grid.id]) {
                    card.classList.add('hidden');
                    card.classList.remove('visible');
                }
            } else if (isTablet && index >= 4) {
                if (!hiddenMoviesVisible[grid.id]) {
                    card.classList.add('hidden');
                    card.classList.remove('visible');
                }
            } else if (!isMobile && !isTablet && index >= 6) {
                if (!hiddenMoviesVisible[grid.id]) {
                    card.classList.add('hidden');
                    card.classList.remove('visible');
                }
            } else {
                card.classList.remove('hidden');
                card.classList.remove('visible');
            }
        });
    });
});

// Gestion du changement de catégorie
categorySelect.addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    if (selectedCategory) {
        loadMovieCategory('free-category-movies', selectedCategory);
        hiddenMoviesVisible['free-category-movies'] = false;
        const button = document.querySelector('#free-category-movies')
            .closest('.movies-section')
            .querySelector('.show-more-button');
        if (button) {
            button.textContent = 'Voir plus';
        }
    }
});

// Initialisation de la page
async function initializePage() {
    await Promise.all([
        fetchCategories(),
        loadBestMovie(),
        loadMovieCategory('top-rated-movies'),
        loadMovieCategory('action-movies', 'Action'),
        loadMovieCategory('comedy-movies', 'Comedy')
    ]);
}

// Lancer l'initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializePage); 