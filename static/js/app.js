// Arquivo principal de JavaScript para o site de referência D&D
document.addEventListener('DOMContentLoaded', function() {
    // Inicialização do aplicativo
    initApp();
    
    // Configuração dos event listeners
    setupEventListeners();
});

// Função para inicializar o aplicativo
function initApp() {
    console.log('Inicializando D&D Reference App...');
    
    // Carregar dados iniciais
    loadInitialData();
    
    // Inicializar o rolador de dados
    initDiceRoller();
    
    // Verificar se há uma busca ou seção na URL
    checkUrlParameters();
}

// Função para carregar dados iniciais
function loadInitialData() {
    // Carregar dados do banco de dados SQLite via API
    fetchClasses();
    fetchSpells();
    fetchMonsters();
    fetchItems();
    
    // Carregar favoritos do armazenamento local
    loadFavorites();
    
    // Carregar buscas recentes do armazenamento local
    loadRecentSearches();
}

// Função para configurar event listeners
function setupEventListeners() {
    // Event listener para o formulário de busca
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                performSearch(searchTerm);
            }
        });
    }
    
    // Event listeners para navegação do menu
    const menuLinks = document.querySelectorAll('.main-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            navigateToSection(section);
        });
    });
    
    // Event listeners para cards de categoria na página inicial
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            navigateToSection(section);
        });
    });
    
    // Event listener para o botão de voltar na visualização detalhada
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            goBack();
        });
    }
    
    // Event listener para o botão de menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const mainMenu = document.getElementById('main-menu');
    if (menuToggle && mainMenu) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            mainMenu.classList.toggle('active');
        });
    }
    
    // Event listeners para filtros
    setupFilterListeners();
    
    // Event listeners para abas
    setupTabListeners();
    
    // Event listener para criar novo personagem
    const createCharacterBtn = document.getElementById('create-character-btn');
    if (createCharacterBtn) {
        createCharacterBtn.addEventListener('click', function() {
            showCreateCharacterForm();
        });
    }
}

// Função para navegar para uma seção
function navigateToSection(sectionId) {
    // Esconder todas as seções
    const allSections = document.querySelectorAll('main section');
    allSections.forEach(section => {
        section.classList.add('hidden-section');
        section.classList.remove('active-section');
    });
    
    // Mostrar a seção selecionada
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden-section');
        targetSection.classList.add('active-section');
        
        // Atualizar URL com o parâmetro de seção
        updateUrlParameter('section', sectionId);
        
        // Fechar o menu mobile se estiver aberto
        const menuToggle = document.getElementById('menu-toggle');
        const mainMenu = document.getElementById('main-menu');
        if (menuToggle && mainMenu && menuToggle.classList.contains('active')) {
            menuToggle.classList.remove('active');
            mainMenu.classList.remove('active');
        }
    }
}

// Função para realizar busca
function performSearch(searchTerm) {
    console.log(`Realizando busca por: ${searchTerm}`);
    
    // Mostrar a seção de resultados de busca
    navigateToSection('search-results');
    
    // Limpar resultados anteriores
    const resultsContainer = document.getElementById('search-results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<p>Buscando...</p>';
    }
    
    // Fazer requisição para a API de busca
    fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data, searchTerm);
            
            // Adicionar à lista de buscas recentes
            addToRecentSearches(searchTerm);
        })
        .catch(error => {
            console.error('Erro na busca:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<p class="error-message">Erro ao realizar a busca. Por favor, tente novamente.</p>';
            }
        });
}

// Função para exibir resultados da busca
function displaySearchResults(results, searchTerm) {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `<p>Nenhum resultado encontrado para "${searchTerm}".</p>`;
        return;
    }
    
    // Agrupar resultados por tipo
    const groupedResults = {};
    results.forEach(item => {
        if (!groupedResults[item.tipo]) {
            groupedResults[item.tipo] = [];
        }
        groupedResults[item.tipo].push(item);
    });
    
    // Construir HTML dos resultados
    let html = `<p>Resultados para "${searchTerm}" (${results.length} encontrados):</p>`;
    
    // Adicionar resultados agrupados por tipo
    for (const tipo in groupedResults) {
        html += `<div class="result-group" data-type="${tipo}">
            <h3>${getTipoLabel(tipo)} (${groupedResults[tipo].length})</h3>
            <div class="result-list">`;
        
        groupedResults[tipo].forEach(item => {
            html += `<div class="result-item" data-id="${item.id}" data-tipo="${item.tipo}">
                <h4>${item.nome}</h4>
                <p>${item.descricao_curta || ''}</p>
                <div class="result-actions">
                    <button class="view-btn" data-id="${item.id}" data-tipo="${item.tipo}">Ver detalhes</button>
                    <button class="favorite-btn" data-id="${item.id}" data-tipo="${item.tipo}" title="Adicionar aos favoritos">
                        <i class="far fa-star"></i>
                    </button>
                </div>
            </div>`;
        });
        
        html += `</div></div>`;
    }
    
    resultsContainer.innerHTML = html;
    
    // Adicionar event listeners para os botões de visualização e favoritos
    setupResultItemListeners();
}

// Função para obter o label do tipo de conteúdo
function getTipoLabel(tipo) {
    const labels = {
        'regra': 'Regras',
        'classe': 'Classes',
        'subclasse': 'Subclasses',
        'especie': 'Espécies',
        'magia': 'Magias',
        'monstro': 'Monstros',
        'item': 'Itens',
        'item_magico': 'Itens Mágicos'
    };
    
    return labels[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

// Função para configurar listeners dos itens de resultado
function setupResultItemListeners() {
    // Listeners para botões de visualização
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            viewItemDetails(id, tipo);
        });
    });
    
    // Listeners para botões de favoritos
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            toggleFavorite(id, tipo);
            
            // Atualizar ícone
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
            }
        });
    });
}

// Função para visualizar detalhes de um item
function viewItemDetails(id, tipo) {
    console.log(`Visualizando detalhes do item: ${id} (${tipo})`);
    
    // Mostrar a seção de visualização detalhada
    navigateToSection('detail-view');
    
    // Limpar conteúdo anterior
    const detailContent = document.getElementById('detail-content');
    if (detailContent) {
        detailContent.innerHTML = '<p>Carregando...</p>';
    }
    
    // Fazer requisição para a API de detalhes
    fetch(`/api/details?id=${id}&tipo=${tipo}`)
        .then(response => response.json())
        .then(data => {
            displayItemDetails(data);
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes:', error);
            if (detailContent) {
                detailContent.innerHTML = '<p class="error-message">Erro ao carregar detalhes. Por favor, tente novamente.</p>';
            }
        });
}

// Função para exibir detalhes de um item
function displayItemDetails(item) {
    const detailContent = document.getElementById('detail-content');
    if (!detailContent) return;
    
    let html = '';
    
    // Construir HTML com base no tipo de item
    switch (item.tipo) {
        case 'magia':
            html = buildSpellDetailsHtml(item);
            break;
        case 'monstro':
            html = buildMonsterDetailsHtml(item);
            break;
        case 'classe':
            html = buildClassDetailsHtml(item);
            break;
        case 'especie':
            html = buildSpeciesDetailsHtml(item);
            break;
        case 'item':
        case 'item_magico':
            html = buildItemDetailsHtml(item);
            break;
        default:
            html = buildGenericDetailsHtml(item);
    }
    
    detailContent.innerHTML = html;
    
    // Adicionar event listeners para botões de ação
    setupDetailActionListeners(item);
}

// Funções para construir HTML de detalhes para diferentes tipos de itens
function buildSpellDetailsHtml(spell) {
    return `
        <div class="detail-header">
            <h2>${spell.nome}</h2>
            <div class="detail-actions">
                <button class="favorite-btn" data-id="${spell.id}" data-tipo="${spell.tipo}">
                    <i class="${isFavorite(spell.id, spell.tipo) ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="roll-spell-btn" data-spell="${spell.id}">Rolar Dados</button>
            </div>
        </div>
        <div class="spell-meta">
            <p><strong>${spell.escola} ${spell.nivel}</strong></p>
            <p><strong>Tempo de Conjuração:</strong> ${spell.tempo_conjuracao}</p>
            <p><strong>Alcance:</strong> ${spell.alcance}</p>
            <p><strong>Componentes:</strong> ${spell.componentes}</p>
            <p><strong>Duração:</strong> ${spell.duracao}</p>
        </div>
        <div class="spell-description">
            ${formatDescription(spell.descricao)}
        </div>
        <div class="detail-footer">
            <p class="reference">Página ${spell.pagina} do SRD</p>
        </div>
    `;
}

function buildMonsterDetailsHtml(monster) {
    return `
        <div class="detail-header">
            <h2>${monster.nome}</h2>
            <div class="detail-actions">
                <button class="favorite-btn" data-id="${monster.id}" data-tipo="${monster.tipo}">
                    <i class="${isFavorite(monster.id, monster.tipo) ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>
        <div class="monster-meta">
            <p><strong>${monster.tamanho} ${monster.tipo}, ${monster.alinhamento}</strong></p>
            <p><strong>Classe de Armadura:</strong> ${monster.ac}</p>
            <p><strong>Pontos de Vida:</strong> ${monster.hp}</p>
            <p><strong>Velocidade:</strong> ${monster.velocidade}</p>
        </div>
        <div class="monster-stats">
            <!-- Estatísticas do monstro seriam exibidas aqui -->
        </div>
        <div class="monster-description">
            ${formatDescription(monster.descricao)}
        </div>
        <div class="detail-footer">
            <p class="reference">Página ${monster.pagina} do SRD</p>
        </div>
    `;
}

function buildClassDetailsHtml(classItem) {
    return `
        <div class="detail-header">
            <h2>${classItem.nome}</h2>
            <div class="detail-actions">
                <button class="favorite-btn" data-id="${classItem.id}" data-tipo="${classItem.tipo}">
                    <i class="${isFavorite(classItem.id, classItem.tipo) ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>
        <div class="class-meta">
            <p><strong>Dado de Vida:</strong> ${classItem.hit_dice}</p>
            <p><strong>Proficiências:</strong> ${classItem.proficiencias}</p>
        </div>
        <div class="class-description">
            ${formatDescription(classItem.descricao || 'Descrição não disponível.')}
        </div>
        <div class="detail-footer">
            <p class="reference">Página ${classItem.pagina_inicial} do SRD</p>
        </div>
    `;
}

function buildSpeciesDetailsHtml(species) {
    return `
        <div class="detail-header">
            <h2>${species.nome}</h2>
            <div class="detail-actions">
                <button class="favorite-btn" data-id="${species.id}" data-tipo="${species.tipo}">
                    <i class="${isFavorite(species.id, species.tipo) ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>
        <div class="species-meta">
            <p><strong>Tamanho:</strong> ${species.tamanho}</p>
            <p><strong>Velocidade:</strong> ${species.velocidade}</p>
        </div>
        <div class="species-traits">
            <h3>Traços Raciais</h3>
            ${formatDescription(species.habilidades || 'Informações não disponíveis.')}
        </div>
        <div class="species-description">
            ${formatDescription(species.descricao)}
        </div>
        <div class="detail-footer">
            <p class="reference">Página ${species.pagina} do SRD</p>
        </div>
    `;
}

function buildItemDetailsHtml(item) {
    let itemTypeInfo = '';
    
    if (item.tipo === 'item_magico') {
        itemTypeInfo = `
            <p><strong>Tipo:</strong> ${item.subtipo}</p>
            <p><strong>Raridade:</strong> ${item.raridade}</p>
            <p><strong>Requer Sintonia:</strong> ${item.requer_sintonia ? 'Sim' : 'Não'}</p>
        `;
    } else {
        itemTypeInfo = `
            <p><strong>Tipo:</strong> ${item.tipo}</p>
            <p><strong>Preço:</strong> ${item.preco}</p>
            <p><strong>Peso:</strong> ${item.peso}</p>
        `;
    }
    
    return `
        <div class="detail-header">
            <h2>${item.nome}</h2>
            <div class="detail-actions">
                <button class="favorite-btn" data-id="${item.id}" data-tipo="${item.tipo}">
                    <i class="${isFavorite(item.id, item.tipo) ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>
        <div class="item-meta">
            ${itemTypeInfo}
        </div>
        <div class="item-description">
            ${formatDescription(item.descricao || 'Descrição não disponível.')}
        </div>
        <div class="detail-footer">
            <p class="reference">Página ${item.pagina} do SRD</p>
        </div>
    `;
}

function buildGenericDetailsHtml(item) {
    return `
        <div class="detail-header">
            <h2>${item.nome}</h2>
            <div class="detail-actions">
                <button class="favorite-btn" data-id="${item.id}" data-tipo="${item.tipo}">
                    <i class="${isFavorite(item.id, item.tipo) ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>
        <div class="generic-description">
            ${formatDescription(item.descricao || 'Descrição não disponível.')}
        </div>
        <div class="detail-footer">
            <p class="reference">Página ${item.pagina} do SRD</p>
        </div>
    `;
}

// Função para formatar descrições
function formatDescription(description) {
    if (!description) return '';
    
    // Substituir quebras de linha por parágrafos
    let formatted = description.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    
    // Garantir que a descrição esteja envolvida em tags de parágrafo
    if (!formatted.startsWith('<p>')) {
        formatted = '<p>' + formatted;
    }
    if (!formatted.endsWith('</p>')) {
        formatted = formatted + '</p>';
    }
    
    return formatted;
}

// Função para configurar listeners de ações nos detalhes
function setupDetailActionListeners(item) {
    // Listener para botão de favorito
    const favoriteBtn = document.querySelector('.detail-header .favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            toggleFavorite(id, tipo);
            
            // Atualizar ícone
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
            }
        });
    }
    
    // Listener para botão de rolagem de dados de magia
    const rollSpellBtn = document.querySelector('.roll-spell-btn');
    if (rollSpellBtn && item.tipo === 'magia') {
        rollSpellBtn.addEventListener('click', function() {
            const spellId = this.getAttribute('data-spell');
            rollSpellDice(spellId);
        });
    }
}

// Função para alternar favorito
function toggleFavorite(id, tipo) {
    console.log(`Alternando favorito: ${id} (${tipo})`);
    
    // Obter favoritos atuais do armazenamento local
    let favorites = JSON.parse(localStorage.getItem('dnd_favorites') || '[]');
    
    // Verificar se o item já está nos favoritos
    const index = favorites.findIndex(fav => fav.id === id && fav.tipo === tipo);
    
    if (index === -1) {
        // Adicionar aos favoritos
        favorites.push({ id, tipo, timestamp: Date.now() });
        console.log('Item adicionado aos favoritos');
    } else {
        // Remover dos favoritos
        favorites.splice(index, 1);
        console.log('Item removido dos favoritos');
    }
    
    // Salvar favoritos atualizados
    localStorage.setItem('dnd_favorites', JSON.stringify(favorites));
    
    // Atualizar a exibição de favoritos se estiver na seção de favoritos
    if (document.getElementById('favoritos-section').classList.contains('active-section')) {
        loadFavorites();
    }
}

// Função para verificar se um item é favorito
function isFavorite(id, tipo) {
    const favorites = JSON.parse(localStorage.getItem('dnd_favorites') || '[]');
    return favorites.some(fav => fav.id === id && fav.tipo === tipo);
}

// Função para carregar favoritos
function loadFavorites() {
    console.log('Carregando favoritos...');
    
    const favorites = JSON.parse(localStorage.getItem('dnd_favorites') || '[]');
    const favoritesContainer = document.getElementById('favorites-container');
    const favoritesPreviewList = document.getElementById('favorites-preview-list');
    
    if (favoritesContainer) {
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = '<p class="empty-message">Você ainda não tem favoritos. Adicione itens aos favoritos clicando no ícone de estrela.</p>';
        } else {
            // Fazer requisição para obter detalhes dos favoritos
            fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(favorites)
            })
            .then(response => response.json())
            .then(data => {
                displayFavorites(data, favoritesContainer);
            })
            .catch(error => {
                console.error('Erro ao carregar favoritos:', error);
                favoritesContainer.innerHTML = '<p class="error-message">Erro ao carregar favoritos. Por favor, tente novamente.</p>';
            });
        }
    }
    
    // Atualizar a prévia de favoritos na página inicial
    if (favoritesPreviewList) {
        if (favorites.length === 0) {
            favoritesPreviewList.innerHTML = '<p class="empty-message">Seus itens favoritos aparecerão aqui</p>';
        } else {
            // Mostrar apenas os 5 favoritos mais recentes na prévia
            const recentFavorites = [...favorites].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
            
            fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recentFavorites)
            })
            .then(response => response.json())
            .then(data => {
                let html = '<ul>';
                data.forEach(item => {
                    html += `<li>
                        <a href="#" class="favorite-preview-item" data-id="${item.id}" data-tipo="${item.tipo}">
                            ${item.nome} <span class="item-type">(${getTipoLabel(item.tipo)})</span>
                        </a>
                    </li>`;
                });
                html += '</ul>';
                
                favoritesPreviewList.innerHTML = html;
                
                // Adicionar event listeners para os itens da prévia
                const favoritePreviewItems = document.querySelectorAll('.favorite-preview-item');
                favoritePreviewItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        const id = this.getAttribute('data-id');
                        const tipo = this.getAttribute('data-tipo');
                        viewItemDetails(id, tipo);
                    });
                });
            })
            .catch(error => {
                console.error('Erro ao carregar prévia de favoritos:', error);
                favoritesPreviewList.innerHTML = '<p class="error-message">Erro ao carregar favoritos</p>';
            });
        }
    }
}

// Função para exibir favoritos
function displayFavorites(favorites, container) {
    if (!container) return;
    
    // Agrupar favoritos por tipo
    const groupedFavorites = {};
    favorites.forEach(item => {
        if (!groupedFavorites[item.tipo]) {
            groupedFavorites[item.tipo] = [];
        }
        groupedFavorites[item.tipo].push(item);
    });
    
    let html = '';
    
    // Adicionar favoritos agrupados por tipo
    for (const tipo in groupedFavorites) {
        html += `<div class="favorites-group" data-type="${tipo}">
            <h3>${getTipoLabel(tipo)} (${groupedFavorites[tipo].length})</h3>
            <div class="favorites-list">`;
        
        groupedFavorites[tipo].forEach(item => {
            html += `<div class="favorite-item" data-id="${item.id}" data-tipo="${item.tipo}">
                <h4>${item.nome}</h4>
                <p>${item.descricao_curta || ''}</p>
                <div class="favorite-actions">
                    <button class="view-btn" data-id="${item.id}" data-tipo="${item.tipo}">Ver detalhes</button>
                    <button class="remove-favorite-btn" data-id="${item.id}" data-tipo="${item.tipo}" title="Remover dos favoritos">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        });
        
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
    
    // Adicionar event listeners para os botões
    const viewButtons = container.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            viewItemDetails(id, tipo);
        });
    });
    
    const removeFavoriteButtons = container.querySelectorAll('.remove-favorite-btn');
    removeFavoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            toggleFavorite(id, tipo);
            
            // Remover o item da exibição
            const favoriteItem = this.closest('.favorite-item');
            if (favoriteItem) {
                favoriteItem.remove();
            }
            
            // Verificar se o grupo está vazio
            const group = this.closest('.favorites-group');
            if (group) {
                const remainingItems = group.querySelectorAll('.favorite-item');
                if (remainingItems.length === 0) {
                    group.remove();
                } else {
                    // Atualizar contador
                    const heading = group.querySelector('h3');
                    if (heading) {
                        heading.textContent = `${getTipoLabel(tipo)} (${remainingItems.length})`;
                    }
                }
            }
            
            // Verificar se todos os favoritos foram removidos
            const remainingGroups = container.querySelectorAll('.favorites-group');
            if (remainingGroups.length === 0) {
                container.innerHTML = '<p class="empty-message">Você ainda não tem favoritos. Adicione itens aos favoritos clicando no ícone de estrela.</p>';
            }
        });
    });
}

// Função para adicionar à lista de buscas recentes
function addToRecentSearches(searchTerm) {
    // Obter buscas recentes do armazenamento local
    let recentSearches = JSON.parse(localStorage.getItem('dnd_recent_searches') || '[]');
    
    // Remover o termo de busca se já existir
    recentSearches = recentSearches.filter(search => search.term !== searchTerm);
    
    // Adicionar o termo de busca ao início da lista
    recentSearches.unshift({
        term: searchTerm,
        timestamp: Date.now()
    });
    
    // Limitar a 10 buscas recentes
    recentSearches = recentSearches.slice(0, 10);
    
    // Salvar buscas recentes atualizadas
    localStorage.setItem('dnd_recent_searches', JSON.stringify(recentSearches));
    
    // Atualizar a exibição de buscas recentes
    loadRecentSearches();
}

// Função para carregar buscas recentes
function loadRecentSearches() {
    const recentSearchesList = document.getElementById('recent-searches-list');
    if (!recentSearchesList) return;
    
    const recentSearches = JSON.parse(localStorage.getItem('dnd_recent_searches') || '[]');
    
    if (recentSearches.length === 0) {
        recentSearchesList.innerHTML = '<p class="empty-message">Suas buscas recentes aparecerão aqui</p>';
    } else {
        let html = '<ul>';
        recentSearches.forEach(search => {
            html += `<li>
                <a href="#" class="recent-search-item" data-term="${search.term}">
                    ${search.term}
                </a>
            </li>`;
        });
        html += '</ul>';
        
        recentSearchesList.innerHTML = html;
        
        // Adicionar event listeners para os itens de busca recente
        const recentSearchItems = recentSearchesList.querySelectorAll('.recent-search-item');
        recentSearchItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const term = this.getAttribute('data-term');
                document.getElementById('search-input').value = term;
                performSearch(term);
            });
        });
    }
}

// Função para configurar listeners de filtros
function setupFilterListeners() {
    // Filtros de resultados de busca
    const filterButtons = document.querySelectorAll('.filter-options .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe ativa ao botão clicado
            this.classList.add('active');
            
            // Aplicar filtro
            const filter = this.getAttribute('data-filter');
            applySearchFilter(filter);
        });
    });
    
    // Filtros de magias
    const spellLevelFilter = document.getElementById('spell-level-filter');
    const spellSchoolFilter = document.getElementById('spell-school-filter');
    const spellClassFilter = document.getElementById('spell-class-filter');
    
    if (spellLevelFilter && spellSchoolFilter && spellClassFilter) {
        [spellLevelFilter, spellSchoolFilter, spellClassFilter].forEach(filter => {
            filter.addEventListener('change', function() {
                applySpellFilters();
            });
        });
    }
    
    // Filtros de monstros
    const monsterCrFilter = document.getElementById('monster-cr-filter');
    const monsterTypeFilter = document.getElementById('monster-type-filter');
    
    if (monsterCrFilter && monsterTypeFilter) {
        [monsterCrFilter, monsterTypeFilter].forEach(filter => {
            filter.addEventListener('change', function() {
                applyMonsterFilters();
            });
        });
    }
    
    // Filtros de itens
    const itemTypeFilter = document.getElementById('item-type-filter');
    const magicItemRarityFilter = document.getElementById('magic-item-rarity-filter');
    
    if (itemTypeFilter) {
        itemTypeFilter.addEventListener('change', function() {
            applyItemFilters('normal');
        });
    }
    
    if (magicItemRarityFilter) {
        magicItemRarityFilter.addEventListener('change', function() {
            applyItemFilters('magic');
        });
    }
}

// Função para aplicar filtro de resultados de busca
function applySearchFilter(filter) {
    const resultGroups = document.querySelectorAll('.result-group');
    
    if (filter === 'all') {
        // Mostrar todos os grupos
        resultGroups.forEach(group => {
            group.style.display = 'block';
        });
    } else {
        // Mostrar apenas o grupo correspondente ao filtro
        resultGroups.forEach(group => {
            if (group.getAttribute('data-type') === filter) {
                group.style.display = 'block';
            } else {
                group.style.display = 'none';
            }
        });
    }
}

// Função para aplicar filtros de magias
function applySpellFilters() {
    const level = document.getElementById('spell-level-filter').value;
    const school = document.getElementById('spell-school-filter').value;
    const spellClass = document.getElementById('spell-class-filter').value;
    
    const spellItems = document.querySelectorAll('#spells-list .spell-item');
    
    spellItems.forEach(item => {
        const spellLevel = item.getAttribute('data-level');
        const spellSchool = item.getAttribute('data-school');
        const spellClasses = item.getAttribute('data-classes');
        
        let visible = true;
        
        if (level !== 'all' && spellLevel !== level) {
            visible = false;
        }
        
        if (school !== 'all' && spellSchool !== school) {
            visible = false;
        }
        
        if (spellClass !== 'all' && !spellClasses.includes(spellClass)) {
            visible = false;
        }
        
        item.style.display = visible ? 'block' : 'none';
    });
}

// Função para aplicar filtros de monstros
function applyMonsterFilters() {
    const cr = document.getElementById('monster-cr-filter').value;
    const type = document.getElementById('monster-type-filter').value;
    
    const monsterItems = document.querySelectorAll('#monsters-list .monster-item');
    
    monsterItems.forEach(item => {
        const monsterCr = item.getAttribute('data-cr');
        const monsterType = item.getAttribute('data-type');
        
        let visible = true;
        
        if (cr !== 'all') {
            if (cr.includes('+')) {
                // Filtro para CR maior ou igual
                const minCr = parseInt(cr);
                const itemCr = parseFloat(monsterCr.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                if (itemCr < minCr) {
                    visible = false;
                }
            } else if (monsterCr !== cr) {
                visible = false;
            }
        }
        
        if (type !== 'all' && monsterType !== type) {
            visible = false;
        }
        
        item.style.display = visible ? 'block' : 'none';
    });
}

// Função para aplicar filtros de itens
function applyItemFilters(itemCategory) {
    if (itemCategory === 'normal') {
        const type = document.getElementById('item-type-filter').value;
        const itemItems = document.querySelectorAll('#normal-items-list .item-item');
        
        itemItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            
            let visible = true;
            
            if (type !== 'all' && itemType !== type) {
                visible = false;
            }
            
            item.style.display = visible ? 'block' : 'none';
        });
    } else if (itemCategory === 'magic') {
        const rarity = document.getElementById('magic-item-rarity-filter').value;
        const magicItemItems = document.querySelectorAll('#magic-items-list .item-item');
        
        magicItemItems.forEach(item => {
            const itemRarity = item.getAttribute('data-rarity');
            
            let visible = true;
            
            if (rarity !== 'all' && itemRarity !== rarity) {
                visible = false;
            }
            
            item.style.display = visible ? 'block' : 'none';
        });
    }
}

// Função para configurar listeners de abas
function setupTabListeners() {
    // Abas de itens
    const itemTabButtons = document.querySelectorAll('.items-tabs .tab-btn');
    itemTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões
            itemTabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe ativa ao botão clicado
            this.classList.add('active');
            
            // Mostrar a aba correspondente
            const tabId = this.getAttribute('data-tab');
            
            // Esconder todas as abas
            document.querySelectorAll('.items-list').forEach(tab => {
                tab.classList.add('hidden-tab');
                tab.classList.remove('active-tab');
            });
            
            // Mostrar a aba selecionada
            const selectedTab = document.getElementById(`${tabId}-list`);
            if (selectedTab) {
                selectedTab.classList.remove('hidden-tab');
                selectedTab.classList.add('active-tab');
            }
            
            // Mostrar/esconder filtros correspondentes
            if (tabId === 'normal-items') {
                document.querySelector('.normal-items-filter').classList.remove('hidden');
                document.querySelector('.magic-items-filter').classList.add('hidden');
            } else if (tabId === 'magic-items') {
                document.querySelector('.normal-items-filter').classList.add('hidden');
                document.querySelector('.magic-items-filter').classList.remove('hidden');
            }
        });
    });
    
    // Abas de favoritos
    const favoriteTabButtons = document.querySelectorAll('.favorites-tabs .tab-btn');
    favoriteTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões
            favoriteTabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe ativa ao botão clicado
            this.classList.add('active');
            
            // Aplicar filtro de favoritos
            const filter = this.getAttribute('data-tab').replace('fav-', '');
            applyFavoritesFilter(filter);
        });
    });
}

// Função para aplicar filtro de favoritos
function applyFavoritesFilter(filter) {
    const favoriteGroups = document.querySelectorAll('.favorites-group');
    
    if (filter === 'all') {
        // Mostrar todos os grupos
        favoriteGroups.forEach(group => {
            group.style.display = 'block';
        });
    } else {
        // Mostrar apenas os grupos correspondentes ao filtro
        favoriteGroups.forEach(group => {
            const groupType = group.getAttribute('data-type');
            
            if (filter === 'spells' && groupType === 'magia') {
                group.style.display = 'block';
            } else if (filter === 'monsters' && groupType === 'monstro') {
                group.style.display = 'block';
            } else if (filter === 'items' && (groupType === 'item' || groupType === 'item_magico')) {
                group.style.display = 'block';
            } else {
                group.style.display = 'none';
            }
        });
    }
}

// Função para voltar à seção anterior
function goBack() {
    // Obter a seção anterior da URL ou voltar para a página inicial
    const urlParams = new URLSearchParams(window.location.search);
    const previousSection = urlParams.get('previous_section') || 'home';
    
    navigateToSection(previousSection);
}

// Função para atualizar parâmetro na URL
function updateUrlParameter(param, value) {
    const url = new URL(window.location);
    
    // Se estiver navegando para a visualização detalhada, salvar a seção atual como seção anterior
    if (param === 'section' && value === 'detail-view') {
        const currentSection = url.searchParams.get('section') || 'home';
        url.searchParams.set('previous_section', currentSection);
    }
    
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// Função para verificar parâmetros na URL
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    const searchTerm = urlParams.get('q');
    
    if (section) {
        navigateToSection(section);
    }
    
    if (searchTerm) {
        document.getElementById('search-input').value = searchTerm;
        performSearch(searchTerm);
    }
}

// Funções para buscar dados do banco de dados
function fetchClasses() {
    fetch('/api/classes')
        .then(response => response.json())
        .then(data => {
            displayClasses(data);
        })
        .catch(error => {
            console.error('Erro ao carregar classes:', error);
        });
}

function fetchSpells() {
    fetch('/api/spells')
        .then(response => response.json())
        .then(data => {
            displaySpells(data);
        })
        .catch(error => {
            console.error('Erro ao carregar magias:', error);
        });
}

function fetchMonsters() {
    fetch('/api/monsters')
        .then(response => response.json())
        .then(data => {
            displayMonsters(data);
        })
        .catch(error => {
            console.error('Erro ao carregar monstros:', error);
        });
}

function fetchItems() {
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            displayItems(data);
        })
        .catch(error => {
            console.error('Erro ao carregar itens:', error);
        });
}

// Funções para exibir dados
function displayClasses(classes) {
    const classesGrid = document.getElementById('classes-grid');
    if (!classesGrid) return;
    
    let html = '';
    
    classes.forEach(classItem => {
        html += `<div class="class-card" data-id="${classItem.id}">
            <h3>${classItem.nome}</h3>
            <p><strong>Dado de Vida:</strong> ${classItem.hit_dice}</p>
            <button class="view-class-btn" data-id="${classItem.id}">Ver Detalhes</button>
        </div>`;
    });
    
    classesGrid.innerHTML = html;
    
    // Adicionar event listeners para os botões de visualização
    const viewClassButtons = classesGrid.querySelectorAll('.view-class-btn');
    viewClassButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewItemDetails(id, 'classe');
        });
    });
}

function displaySpells(spells) {
    const spellsList = document.getElementById('spells-list');
    if (!spellsList) return;
    
    let html = '';
    
    spells.forEach(spell => {
        html += `<div class="spell-item" data-id="${spell.id}" data-level="${spell.nivel}" data-school="${spell.escola}" data-classes="${spell.classes || ''}">
            <h3>${spell.nome}</h3>
            <p class="spell-meta">${spell.escola} ${spell.nivel}</p>
            <p class="spell-casting-time"><strong>Tempo de Conjuração:</strong> ${spell.tempo_conjuracao}</p>
            <div class="spell-actions">
                <button class="view-spell-btn" data-id="${spell.id}">Ver Detalhes</button>
                <button class="favorite-btn" data-id="${spell.id}" data-tipo="magia" title="Adicionar aos favoritos">
                    <i class="${isFavorite(spell.id, 'magia') ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>`;
    });
    
    spellsList.innerHTML = html;
    
    // Adicionar event listeners para os botões
    const viewSpellButtons = spellsList.querySelectorAll('.view-spell-btn');
    viewSpellButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewItemDetails(id, 'magia');
        });
    });
    
    const favoriteButtons = spellsList.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            toggleFavorite(id, tipo);
            
            // Atualizar ícone
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
            }
        });
    });
}

function displayMonsters(monsters) {
    const monstersList = document.getElementById('monsters-list');
    if (!monstersList) return;
    
    let html = '';
    
    monsters.forEach(monster => {
        html += `<div class="monster-item" data-id="${monster.id}" data-cr="${monster.cr || '0'}" data-type="${monster.tipo}">
            <h3>${monster.nome}</h3>
            <p class="monster-meta">${monster.tamanho} ${monster.tipo}, ${monster.alinhamento}</p>
            <p class="monster-stats"><strong>CA:</strong> ${monster.ac}, <strong>HP:</strong> ${monster.hp}</p>
            <div class="monster-actions">
                <button class="view-monster-btn" data-id="${monster.id}">Ver Detalhes</button>
                <button class="favorite-btn" data-id="${monster.id}" data-tipo="monstro" title="Adicionar aos favoritos">
                    <i class="${isFavorite(monster.id, 'monstro') ? 'fas' : 'far'} fa-star"></i>
                </button>
            </div>
        </div>`;
    });
    
    monstersList.innerHTML = html;
    
    // Adicionar event listeners para os botões
    const viewMonsterButtons = monstersList.querySelectorAll('.view-monster-btn');
    viewMonsterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewItemDetails(id, 'monstro');
        });
    });
    
    const favoriteButtons = monstersList.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            toggleFavorite(id, tipo);
            
            // Atualizar ícone
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
            }
        });
    });
}

function displayItems(items) {
    const normalItemsList = document.getElementById('normal-items-list');
    const magicItemsList = document.getElementById('magic-items-list');
    
    if (!normalItemsList || !magicItemsList) return;
    
    let normalItemsHtml = '';
    let magicItemsHtml = '';
    
    items.forEach(item => {
        if (item.tipo === 'item_magico') {
            magicItemsHtml += `<div class="item-item" data-id="${item.id}" data-rarity="${item.raridade}">
                <h3>${item.nome}</h3>
                <p class="item-meta">${item.subtipo}, ${item.raridade}</p>
                <div class="item-actions">
                    <button class="view-item-btn" data-id="${item.id}" data-tipo="item_magico">Ver Detalhes</button>
                    <button class="favorite-btn" data-id="${item.id}" data-tipo="item_magico" title="Adicionar aos favoritos">
                        <i class="${isFavorite(item.id, 'item_magico') ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
            </div>`;
        } else {
            normalItemsHtml += `<div class="item-item" data-id="${item.id}" data-type="${item.tipo}">
                <h3>${item.nome}</h3>
                <p class="item-meta">${item.tipo}, ${item.preco}</p>
                <div class="item-actions">
                    <button class="view-item-btn" data-id="${item.id}" data-tipo="item">Ver Detalhes</button>
                    <button class="favorite-btn" data-id="${item.id}" data-tipo="item" title="Adicionar aos favoritos">
                        <i class="${isFavorite(item.id, 'item') ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
            </div>`;
        }
    });
    
    normalItemsList.innerHTML = normalItemsHtml || '<p class="empty-message">Nenhum item normal encontrado</p>';
    magicItemsList.innerHTML = magicItemsHtml || '<p class="empty-message">Nenhum item mágico encontrado</p>';
    
    // Adicionar event listeners para os botões
    const viewItemButtons = document.querySelectorAll('.view-item-btn');
    viewItemButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            viewItemDetails(id, tipo);
        });
    });
    
    const favoriteButtons = document.querySelectorAll('.item-item .favorite-btn');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            toggleFavorite(id, tipo);
            
            // Atualizar ícone
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
            }
        });
    });
}

// Função para mostrar formulário de criação de personagem
function showCreateCharacterForm() {
    const charactersSection = document.getElementById('personagens-section');
    if (!charactersSection) return;
    
    // HTML do formulário de criação de personagem
    const formHtml = `
        <div class="character-form-container">
            <h3>Criar Novo Personagem</h3>
            <form id="create-character-form">
                <div class="form-group">
                    <label for="character-name">Nome do Personagem:</label>
                    <input type="text" id="character-name" required>
                </div>
                <div class="form-group">
                    <label for="character-class">Classe:</label>
                    <select id="character-class" required>
                        <option value="">Selecione uma classe</option>
                        <!-- Opções serão preenchidas via JavaScript -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="character-species">Espécie:</label>
                    <select id="character-species" required>
                        <option value="">Selecione uma espécie</option>
                        <!-- Opções serão preenchidas via JavaScript -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="character-level">Nível:</label>
                    <input type="number" id="character-level" min="1" max="20" value="1" required>
                </div>
                <h4>Atributos</h4>
                <div class="attributes-container">
                    <div class="form-group">
                        <label for="character-str">Força:</label>
                        <input type="number" id="character-str" min="3" max="20" value="10" required>
                    </div>
                    <div class="form-group">
                        <label for="character-dex">Destreza:</label>
                        <input type="number" id="character-dex" min="3" max="20" value="10" required>
                    </div>
                    <div class="form-group">
                        <label for="character-con">Constituição:</label>
                        <input type="number" id="character-con" min="3" max="20" value="10" required>
                    </div>
                    <div class="form-group">
                        <label for="character-int">Inteligência:</label>
                        <input type="number" id="character-int" min="3" max="20" value="10" required>
                    </div>
                    <div class="form-group">
                        <label for="character-wis">Sabedoria:</label>
                        <input type="number" id="character-wis" min="3" max="20" value="10" required>
                    </div>
                    <div class="form-group">
                        <label for="character-cha">Carisma:</label>
                        <input type="number" id="character-cha" min="3" max="20" value="10" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="primary-btn">Criar Personagem</button>
                    <button type="button" id="cancel-character-btn" class="secondary-btn">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    // Adicionar o formulário à seção
    const formContainer = document.createElement('div');
    formContainer.id = 'character-form-wrapper';
    formContainer.innerHTML = formHtml;
    charactersSection.appendChild(formContainer);
    
    // Esconder a lista de personagens e o botão de criar
    document.getElementById('characters-list').style.display = 'none';
    document.getElementById('create-character-btn').style.display = 'none';
    
    // Preencher opções de classe e espécie
    fetchClassesForSelect();
    fetchSpeciesForSelect();
    
    // Adicionar event listener para o formulário
    const form = document.getElementById('create-character-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        createCharacter();
    });
    
    // Adicionar event listener para o botão de cancelar
    const cancelBtn = document.getElementById('cancel-character-btn');
    cancelBtn.addEventListener('click', function() {
        // Remover o formulário
        formContainer.remove();
        
        // Mostrar a lista de personagens e o botão de criar
        document.getElementById('characters-list').style.display = 'block';
        document.getElementById('create-character-btn').style.display = 'block';
    });
}

// Função para buscar classes para o select
function fetchClassesForSelect() {
    fetch('/api/classes')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('character-class');
            if (!select) return;
            
            data.forEach(classItem => {
                const option = document.createElement('option');
                option.value = classItem.id;
                option.textContent = classItem.nome;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar classes para o select:', error);
        });
}

// Função para buscar espécies para o select
function fetchSpeciesForSelect() {
    fetch('/api/species')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('character-species');
            if (!select) return;
            
            data.forEach(species => {
                const option = document.createElement('option');
                option.value = species.id;
                option.textContent = species.nome;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar espécies para o select:', error);
        });
}

// Função para criar personagem
function createCharacter() {
    const name = document.getElementById('character-name').value;
    const classId = document.getElementById('character-class').value;
    const speciesId = document.getElementById('character-species').value;
    const level = document.getElementById('character-level').value;
    const str = document.getElementById('character-str').value;
    const dex = document.getElementById('character-dex').value;
    const con = document.getElementById('character-con').value;
    const int = document.getElementById('character-int').value;
    const wis = document.getElementById('character-wis').value;
    const cha = document.getElementById('character-cha').value;
    
    // Criar objeto do personagem
    const character = {
        nome: name,
        classe_id: classId,
        especie_id: speciesId,
        nivel: level,
        forca: str,
        destreza: dex,
        constituicao: con,
        inteligencia: int,
        sabedoria: wis,
        carisma: cha
    };
    
    // Enviar para a API
    fetch('/api/characters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(character)
    })
    .then(response => response.json())
    .then(data => {
        // Remover o formulário
        const formContainer = document.getElementById('character-form-wrapper');
        if (formContainer) {
            formContainer.remove();
        }
        
        // Mostrar a lista de personagens e o botão de criar
        document.getElementById('characters-list').style.display = 'block';
        document.getElementById('create-character-btn').style.display = 'block';
        
        // Recarregar a lista de personagens
        loadCharacters();
    })
    .catch(error => {
        console.error('Erro ao criar personagem:', error);
        alert('Erro ao criar personagem. Por favor, tente novamente.');
    });
}

// Função para carregar personagens
function loadCharacters() {
    const charactersList = document.getElementById('characters-list');
    if (!charactersList) return;
    
    fetch('/api/characters')
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                charactersList.innerHTML = '<p class="empty-message">Você ainda não tem personagens. Crie um novo personagem para começar.</p>';
            } else {
                let html = '';
                
                data.forEach(character => {
                    html += `<div class="character-card" data-id="${character.id}">
                        <h3>${character.nome}</h3>
                        <p class="character-meta">${character.classe_nome} Nível ${character.nivel}</p>
                        <p class="character-species">${character.especie_nome}</p>
                        <div class="character-actions">
                            <button class="view-character-btn" data-id="${character.id}">Ver Detalhes</button>
                            <button class="edit-character-btn" data-id="${character.id}">Editar</button>
                            <button class="delete-character-btn" data-id="${character.id}">Excluir</button>
                        </div>
                    </div>`;
                });
                
                charactersList.innerHTML = html;
                
                // Adicionar event listeners para os botões
                setupCharacterButtonListeners();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar personagens:', error);
            charactersList.innerHTML = '<p class="error-message">Erro ao carregar personagens. Por favor, tente novamente.</p>';
        });
}

// Função para configurar listeners dos botões de personagem
function setupCharacterButtonListeners() {
    // Botões de visualização
    const viewButtons = document.querySelectorAll('.view-character-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewCharacterDetails(id);
        });
    });
    
    // Botões de edição
    const editButtons = document.querySelectorAll('.edit-character-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editCharacter(id);
        });
    });
    
    // Botões de exclusão
    const deleteButtons = document.querySelectorAll('.delete-character-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('Tem certeza que deseja excluir este personagem?')) {
                deleteCharacter(id);
            }
        });
    });
}

// Função para visualizar detalhes de um personagem
function viewCharacterDetails(id) {
    // Mostrar a seção de visualização detalhada
    navigateToSection('detail-view');
    
    // Limpar conteúdo anterior
    const detailContent = document.getElementById('detail-content');
    if (detailContent) {
        detailContent.innerHTML = '<p>Carregando...</p>';
    }
    
    // Fazer requisição para a API de detalhes do personagem
    fetch(`/api/characters/${id}`)
        .then(response => response.json())
        .then(data => {
            displayCharacterDetails(data);
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes do personagem:', error);
            if (detailContent) {
                detailContent.innerHTML = '<p class="error-message">Erro ao carregar detalhes do personagem. Por favor, tente novamente.</p>';
            }
        });
}

// Função para exibir detalhes de um personagem
function displayCharacterDetails(character) {
    const detailContent = document.getElementById('detail-content');
    if (!detailContent) return;
    
    const html = `
        <div class="character-detail-header">
            <h2>${character.nome}</h2>
            <p class="character-meta">${character.classe_nome} Nível ${character.nivel}</p>
            <p class="character-species">${character.especie_nome}</p>
        </div>
        <div class="character-attributes">
            <h3>Atributos</h3>
            <div class="attributes-grid">
                <div class="attribute-box">
                    <span class="attribute-label">FOR</span>
                    <span class="attribute-value">${character.forca}</span>
                    <span class="attribute-mod">${getAttributeModifier(character.forca)}</span>
                </div>
                <div class="attribute-box">
                    <span class="attribute-label">DES</span>
                    <span class="attribute-value">${character.destreza}</span>
                    <span class="attribute-mod">${getAttributeModifier(character.destreza)}</span>
                </div>
                <div class="attribute-box">
                    <span class="attribute-label">CON</span>
                    <span class="attribute-value">${character.constituicao}</span>
                    <span class="attribute-mod">${getAttributeModifier(character.constituicao)}</span>
                </div>
                <div class="attribute-box">
                    <span class="attribute-label">INT</span>
                    <span class="attribute-value">${character.inteligencia}</span>
                    <span class="attribute-mod">${getAttributeModifier(character.inteligencia)}</span>
                </div>
                <div class="attribute-box">
                    <span class="attribute-label">SAB</span>
                    <span class="attribute-value">${character.sabedoria}</span>
                    <span class="attribute-mod">${getAttributeModifier(character.sabedoria)}</span>
                </div>
                <div class="attribute-box">
                    <span class="attribute-label">CAR</span>
                    <span class="attribute-value">${character.carisma}</span>
                    <span class="attribute-mod">${getAttributeModifier(character.carisma)}</span>
                </div>
            </div>
        </div>
        <div class="character-stats">
            <h3>Estatísticas</h3>
            <p><strong>Pontos de Vida:</strong> ${character.hp_maximo}</p>
            <p><strong>Classe de Armadura:</strong> ${calculateAC(character)}</p>
            <p><strong>Bônus de Proficiência:</strong> +${getProficiencyBonus(character.nivel)}</p>
        </div>
        <div class="character-actions">
            <button class="edit-character-btn" data-id="${character.id}">Editar Personagem</button>
            <button class="level-up-btn" data-id="${character.id}">Subir de Nível</button>
        </div>
    `;
    
    detailContent.innerHTML = html;
    
    // Adicionar event listeners para os botões
    const editBtn = detailContent.querySelector('.edit-character-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editCharacter(id);
        });
    }
    
    const levelUpBtn = detailContent.querySelector('.level-up-btn');
    if (levelUpBtn) {
        levelUpBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            levelUpCharacter(id);
        });
    }
}

// Função para obter modificador de atributo
function getAttributeModifier(value) {
    const modifier = Math.floor((value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// Função para calcular CA
function calculateAC(character) {
    // Cálculo básico: 10 + modificador de Destreza
    const dexMod = Math.floor((character.destreza - 10) / 2);
    return 10 + dexMod;
}

// Função para obter bônus de proficiência
function getProficiencyBonus(level) {
    if (level <= 4) return 2;
    if (level <= 8) return 3;
    if (level <= 12) return 4;
    if (level <= 16) return 5;
    return 6;
}

// Função para editar personagem
function editCharacter(id) {
    // Implementação da edição de personagem
    console.log(`Editando personagem: ${id}`);
    // Esta funcionalidade seria implementada de forma semelhante à criação de personagem
}

// Função para excluir personagem
function deleteCharacter(id) {
    fetch(`/api/characters/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            // Recarregar a lista de personagens
            loadCharacters();
        } else {
            throw new Error('Erro ao excluir personagem');
        }
    })
    .catch(error => {
        console.error('Erro ao excluir personagem:', error);
        alert('Erro ao excluir personagem. Por favor, tente novamente.');
    });
}

// Função para subir de nível
function levelUpCharacter(id) {
    // Implementação da subida de nível
    console.log(`Subindo de nível o personagem: ${id}`);
    // Esta funcionalidade seria implementada com uma requisição para a API
}

// Função para rolar dados de magia
function rollSpellDice(spellId) {
    // Buscar informações da magia
    fetch(`/api/details?id=${spellId}&tipo=magia`)
        .then(response => response.json())
        .then(spell => {
            // Analisar a descrição da magia para encontrar dados a serem rolados
            const diceRegex = /(\d+)d(\d+)(?:\s*\+\s*(\d+))?/g;
            const matches = [...spell.descricao.matchAll(diceRegex)];
            
            if (matches.length === 0) {
                alert('Não foram encontrados dados para rolar nesta magia.');
                return;
            }
            
            // Se houver múltiplos conjuntos de dados, perguntar qual o usuário deseja rolar
            if (matches.length > 1) {
                const diceOptions = matches.map(match => match[0]);
                const selectedDice = prompt(`Escolha quais dados rolar:\n${diceOptions.join('\n')}`);
                
                if (!selectedDice) return;
                
                const selectedMatch = matches.find(match => match[0] === selectedDice);
                if (selectedMatch) {
                    rollDice(parseInt(selectedMatch[1]), parseInt(selectedMatch[2]), selectedMatch[3] ? parseInt(selectedMatch[3]) : 0, spell.nome);
                }
            } else {
                // Se houver apenas um conjunto de dados, rolá-lo diretamente
                const match = matches[0];
                rollDice(parseInt(match[1]), parseInt(match[2]), match[3] ? parseInt(match[3]) : 0, spell.nome);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar informações da magia:', error);
            alert('Erro ao buscar informações da magia. Por favor, tente novamente.');
        });
}
