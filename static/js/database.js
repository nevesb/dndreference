// Arquivo JavaScript para carregar dados do banco de dados
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados do JSON
    loadDatabaseData();
});

// Função para carregar dados do banco de dados
async function loadDatabaseData() {
    try {
        // Carregar dados de classes
        const classesResponse = await fetch('data/classes.json');
        const classes = await classesResponse.json();
        window.dndData = window.dndData || {};
        window.dndData.classes = classes;
        
        // Carregar dados de magias
        const spellsResponse = await fetch('data/spells.json');
        const spells = await spellsResponse.json();
        window.dndData.spells = spells;
        
        // Carregar dados de monstros
        const monstersResponse = await fetch('data/monsters.json');
        const monsters = await monstersResponse.json();
        window.dndData.monsters = monsters;
        
        // Carregar dados de espécies
        const speciesResponse = await fetch('data/species.json');
        const species = await speciesResponse.json();
        window.dndData.species = species;
        
        // Carregar dados de itens
        const itemsResponse = await fetch('data/items.json');
        const items = await itemsResponse.json();
        window.dndData.items = items;
        
        // Carregar dados de itens mágicos
        const magicItemsResponse = await fetch('data/magic_items.json');
        const magicItems = await magicItemsResponse.json();
        window.dndData.magicItems = magicItems;
        
        // Carregar dados de regras
        const rulesResponse = await fetch('data/rules.json');
        const rules = await rulesResponse.json();
        window.dndData.rules = rules;
        
        console.log('Todos os dados carregados com sucesso');
        
        // Inicializar a busca unificada
        initializeSearch();
        
        // Remover a tela de carregamento
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container">
                    <h2>Erro ao carregar dados</h2>
                    <p>Ocorreu um erro ao carregar os dados do site. Por favor, tente novamente mais tarde.</p>
                    <p>Detalhes do erro: ${error.message}</p>
                    <button onclick="location.reload()">Tentar Novamente</button>
                </div>
            `;
        }
    }
}

// Função para inicializar a busca unificada
function initializeSearch() {
    // Criar índice de busca unificada
    window.searchIndex = [];
    
    // Adicionar classes ao índice de busca
    if (window.dndData.classes) {
        window.dndData.classes.forEach(item => {
            window.searchIndex.push({
                id: item.id,
                tipo: 'classe',
                nome: item.nome,
                descricao: `Dado de Vida: ${item.hit_dice}. Proficiências: ${item.proficiencias}`,
                pagina: item.pagina_inicial
            });
        });
    }
    
    // Adicionar magias ao índice de busca
    if (window.dndData.spells) {
        window.dndData.spells.forEach(item => {
            window.searchIndex.push({
                id: item.id,
                tipo: 'magia',
                nome: item.nome,
                descricao: `${item.escola} ${item.nivel}. ${item.tempo_conjuracao}, ${item.alcance}, ${item.componentes}, ${item.duracao}`,
                pagina: item.pagina
            });
        });
    }
    
    // Adicionar monstros ao índice de busca
    if (window.dndData.monsters) {
        window.dndData.monsters.forEach(item => {
            window.searchIndex.push({
                id: item.id,
                tipo: 'monstro',
                nome: item.nome,
                descricao: `${item.tamanho} ${item.tipo}, ${item.alinhamento}. AC: ${item.ac}, HP: ${item.hp}, Velocidade: ${item.velocidade}`,
                pagina: item.pagina
            });
        });
    }
    
    // Adicionar espécies ao índice de busca
    if (window.dndData.species) {
        window.dndData.species.forEach(item => {
            window.searchIndex.push({
                id: item.id,
                tipo: 'especie',
                nome: item.nome,
                descricao: `${item.tamanho}`,
                pagina: item.pagina
            });
        });
    }
    
    // Adicionar itens ao índice de busca
    if (window.dndData.items) {
        window.dndData.items.forEach(item => {
            window.searchIndex.push({
                id: item.id,
                tipo: 'item',
                nome: item.nome,
                descricao: `${item.tipo}, Preço: ${item.preco}, Peso: ${item.peso}`,
                pagina: item.pagina
            });
        });
    }
    
    // Adicionar itens mágicos ao índice de busca
    if (window.dndData.magicItems) {
        window.dndData.magicItems.forEach(item => {
            window.searchIndex.push({
                id: item.id,
                tipo: 'item_magico',
                nome: item.nome,
                descricao: `${item.subtipo}, ${item.raridade}`,
                pagina: item.pagina
            });
        });
    }
    
    // Adicionar regras ao índice de busca
    if (window.dndData.rules) {
        window.dndData.rules.forEach(item => {
            window.searchIndex.push({
                id: item.id,
                tipo: 'regra',
                nome: item.titulo,
                descricao: item.descricao_curta,
                pagina: item.pagina
            });
        });
    }
    
    console.log(`Índice de busca criado com ${window.searchIndex.length} itens`);
}

// Função para realizar busca unificada
function searchUnified(query) {
    if (!query || query.length < 2 || !window.searchIndex) {
        return [];
    }
    
    query = query.toLowerCase();
    
    // Realizar busca no índice
    const results = window.searchIndex.filter(item => {
        // Buscar no nome (peso maior)
        if (item.nome.toLowerCase().includes(query)) {
            return true;
        }
        
        // Buscar na descrição
        if (item.descricao && item.descricao.toLowerCase().includes(query)) {
            return true;
        }
        
        return false;
    });
    
    // Ordenar resultados: primeiro os que têm correspondência no nome
    results.sort((a, b) => {
        const aNameMatch = a.nome.toLowerCase().includes(query);
        const bNameMatch = b.nome.toLowerCase().includes(query);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Se ambos correspondem (ou não correspondem) no nome, ordenar alfabeticamente
        return a.nome.localeCompare(b.nome);
    });
    
    return results.slice(0, 50); // Limitar a 50 resultados
}

// Função para obter detalhes de um item
function getItemDetails(id, tipo) {
    if (!window.dndData) {
        return null;
    }
    
    let item = null;
    
    switch (tipo) {
        case 'classe':
            item = window.dndData.classes.find(i => i.id === id);
            break;
        case 'magia':
            item = window.dndData.spells.find(i => i.id === id);
            break;
        case 'monstro':
            item = window.dndData.monsters.find(i => i.id === id);
            break;
        case 'especie':
            item = window.dndData.species.find(i => i.id === id);
            break;
        case 'item':
            item = window.dndData.items.find(i => i.id === id);
            break;
        case 'item_magico':
            item = window.dndData.magicItems.find(i => i.id === id);
            break;
        case 'regra':
            item = window.dndData.rules.find(i => i.id === id);
            break;
    }
    
    return item;
}

// Função para obter favoritos
function getFavorites() {
    const favorites = JSON.parse(localStorage.getItem('dnd_favorites') || '[]');
    
    if (!favorites.length || !window.dndData) {
        return [];
    }
    
    const results = [];
    
    favorites.forEach(favorite => {
        const item = getItemDetails(favorite.id, favorite.tipo);
        
        if (item) {
            let descricao_curta = '';
            
            switch (favorite.tipo) {
                case 'classe':
                    descricao_curta = `Dado de Vida: ${item.hit_dice}`;
                    break;
                case 'magia':
                    descricao_curta = `${item.escola} ${item.nivel}`;
                    break;
                case 'monstro':
                    descricao_curta = `${item.tamanho} ${item.tipo}, ${item.alinhamento}`;
                    break;
                case 'especie':
                    descricao_curta = `${item.tamanho}`;
                    break;
                case 'item':
                    descricao_curta = `${item.tipo}, ${item.preco}`;
                    break;
                case 'item_magico':
                    descricao_curta = `${item.subtipo}, ${item.raridade}`;
                    break;
                case 'regra':
                    descricao_curta = item.descricao_curta;
                    break;
            }
            
            results.push({
                id: item.id,
                nome: item.nome,
                tipo: favorite.tipo,
                descricao_curta: descricao_curta,
                pagina: item.pagina || item.pagina_inicial
            });
        }
    });
    
    return results;
}
