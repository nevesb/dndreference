// Arquivo JavaScript para implementar funcionalidades adicionais
document.addEventListener('DOMContentLoaded', function() {
    initFavoritesSystem();
    initCharacterSystem();
    initDiceRollerEnhancements();
});

// Sistema de Favoritos
function initFavoritesSystem() {
    console.log('Inicializando sistema de favoritos...');
    
    // Carregar favoritos do localStorage
    loadFavoritesFromStorage();
    
    // Adicionar listeners para botões de favoritos que já existem na página
    setupFavoriteButtons();
    
    // Observar mudanças no DOM para adicionar listeners a novos botões de favoritos
    observeFavoritesButtons();
}

function loadFavoritesFromStorage() {
    // Verificar se há favoritos no localStorage
    if (!localStorage.getItem('dnd_favorites')) {
        // Inicializar com array vazio se não existir
        localStorage.setItem('dnd_favorites', JSON.stringify([]));
    }
    
    // Carregar favoritos na interface
    updateFavoritesUI();
}

function updateFavoritesUI() {
    const favorites = JSON.parse(localStorage.getItem('dnd_favorites') || '[]');
    const favoritesContainer = document.getElementById('favorites-container');
    const favoritesPreviewList = document.getElementById('favorites-preview-list');
    
    // Atualizar contagem de favoritos no menu
    const favoritesMenuCount = document.querySelector('.main-menu a[data-section="favoritos"] .count');
    if (favoritesMenuCount) {
        favoritesMenuCount.textContent = favorites.length;
    }
    
    // Atualizar lista de favoritos na seção de favoritos
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
    
    // Atualizar prévia de favoritos na página inicial
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
                let html = '<ul class="favorites-preview-items">';
                data.forEach(item => {
                    html += `<li>
                        <a href="#" class="favorite-preview-item" data-id="${item.id}" data-tipo="${item.tipo}">
                            <span class="favorite-name">${item.nome}</span>
                            <span class="favorite-type">${getTipoLabel(item.tipo)}</span>
                        </a>
                    </li>`;
                });
                html += '</ul>';
                
                favoritesPreviewList.innerHTML = html;
                
                // Adicionar event listeners para os itens da prévia
                setupFavoritePreviewListeners();
            })
            .catch(error => {
                console.error('Erro ao carregar prévia de favoritos:', error);
                favoritesPreviewList.innerHTML = '<p class="error-message">Erro ao carregar favoritos</p>';
            });
        }
    }
}

function setupFavoriteButtons() {
    // Adicionar listeners para todos os botões de favoritos existentes
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        if (!button.hasAttribute('data-favorite-initialized')) {
            button.setAttribute('data-favorite-initialized', 'true');
            button.addEventListener('click', handleFavoriteClick);
        }
    });
}

function handleFavoriteClick(event) {
    const button = event.currentTarget;
    const id = button.getAttribute('data-id');
    const tipo = button.getAttribute('data-tipo');
    
    if (!id || !tipo) return;
    
    toggleFavorite(id, tipo);
    
    // Atualizar ícone
    const icon = button.querySelector('i');
    if (icon) {
        icon.classList.toggle('far');
        icon.classList.toggle('fas');
    }
}

function toggleFavorite(id, tipo) {
    console.log(`Alternando favorito: ${id} (${tipo})`);
    
    // Obter favoritos atuais do localStorage
    let favorites = JSON.parse(localStorage.getItem('dnd_favorites') || '[]');
    
    // Verificar se o item já está nos favoritos
    const index = favorites.findIndex(fav => fav.id === id && fav.tipo === tipo);
    
    if (index === -1) {
        // Adicionar aos favoritos
        favorites.push({ id, tipo, timestamp: Date.now() });
        showNotification('Item adicionado aos favoritos');
    } else {
        // Remover dos favoritos
        favorites.splice(index, 1);
        showNotification('Item removido dos favoritos');
    }
    
    // Salvar favoritos atualizados
    localStorage.setItem('dnd_favorites', JSON.stringify(favorites));
    
    // Atualizar a interface
    updateFavoritesUI();
}

function isFavorite(id, tipo) {
    const favorites = JSON.parse(localStorage.getItem('dnd_favorites') || '[]');
    return favorites.some(fav => fav.id === id && fav.tipo === tipo);
}

function observeFavoritesButtons() {
    // Usar MutationObserver para detectar novos botões de favoritos adicionados ao DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                // Verificar se há novos botões de favoritos
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('favorite-btn')) {
                        // Novo botão de favorito encontrado
                        if (!node.hasAttribute('data-favorite-initialized')) {
                            node.setAttribute('data-favorite-initialized', 'true');
                            node.addEventListener('click', handleFavoriteClick);
                        }
                    } else if (node.nodeType === 1) {
                        // Verificar filhos do nó adicionado
                        const buttons = node.querySelectorAll('.favorite-btn');
                        buttons.forEach(button => {
                            if (!button.hasAttribute('data-favorite-initialized')) {
                                button.setAttribute('data-favorite-initialized', 'true');
                                button.addEventListener('click', handleFavoriteClick);
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Observar todo o documento
    observer.observe(document.body, { childList: true, subtree: true });
}

function setupFavoritePreviewListeners() {
    const favoritePreviewItems = document.querySelectorAll('.favorite-preview-item');
    favoritePreviewItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('data-id');
            const tipo = this.getAttribute('data-tipo');
            viewItemDetails(id, tipo);
        });
    });
}

// Sistema de Personagens
function initCharacterSystem() {
    console.log('Inicializando sistema de personagens...');
    
    // Carregar personagens do servidor
    loadCharacters();
    
    // Adicionar listeners para botões de criação de personagem
    const createCharacterBtn = document.getElementById('create-character-btn');
    if (createCharacterBtn) {
        createCharacterBtn.addEventListener('click', showCreateCharacterForm);
    }
}

function loadCharacters() {
    const charactersList = document.getElementById('characters-list');
    if (!charactersList) return;
    
    fetch('/api/characters')
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                charactersList.innerHTML = '<p class="empty-message">Você ainda não tem personagens. Crie um novo personagem para começar.</p>';
            } else {
                let html = '<div class="characters-grid">';
                
                data.forEach(character => {
                    html += `<div class="character-card" data-id="${character.id}">
                        <div class="character-header">
                            <h3>${character.nome}</h3>
                            <span class="character-level">Nível ${character.nivel}</span>
                        </div>
                        <div class="character-info">
                            <p class="character-class">${character.classe_nome || 'Classe desconhecida'}</p>
                            <p class="character-species">${character.especie_nome || 'Espécie desconhecida'}</p>
                        </div>
                        <div class="character-stats">
                            <div class="character-hp">
                                <span class="stat-label">HP</span>
                                <span class="stat-value">${character.hp_atual}/${character.hp_maximo}</span>
                            </div>
                            <div class="character-attributes">
                                <div class="attribute">
                                    <span class="attribute-label">FOR</span>
                                    <span class="attribute-value">${character.forca}</span>
                                </div>
                                <div class="attribute">
                                    <span class="attribute-label">DES</span>
                                    <span class="attribute-value">${character.destreza}</span>
                                </div>
                                <div class="attribute">
                                    <span class="attribute-label">CON</span>
                                    <span class="attribute-value">${character.constituicao}</span>
                                </div>
                                <div class="attribute">
                                    <span class="attribute-label">INT</span>
                                    <span class="attribute-value">${character.inteligencia}</span>
                                </div>
                                <div class="attribute">
                                    <span class="attribute-label">SAB</span>
                                    <span class="attribute-value">${character.sabedoria}</span>
                                </div>
                                <div class="attribute">
                                    <span class="attribute-label">CAR</span>
                                    <span class="attribute-value">${character.carisma}</span>
                                </div>
                            </div>
                        </div>
                        <div class="character-actions">
                            <button class="view-character-btn" data-id="${character.id}">Ver Detalhes</button>
                            <button class="edit-character-btn" data-id="${character.id}">Editar</button>
                            <button class="delete-character-btn" data-id="${character.id}">Excluir</button>
                        </div>
                    </div>`;
                });
                
                html += '</div>';
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

function showCreateCharacterForm() {
    const charactersSection = document.getElementById('personagens-section');
    if (!charactersSection) return;
    
    // HTML do formulário de criação de personagem
    const formHtml = `
        <div class="character-form-container">
            <h3>Criar Novo Personagem</h3>
            <form id="create-character-form" class="character-form">
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
    
    // Validar dados
    if (!name || !classId || !speciesId) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
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
        if (data.success) {
            showNotification('Personagem criado com sucesso!');
            
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
        } else {
            showNotification('Erro ao criar personagem: ' + (data.error || 'Erro desconhecido'), 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao criar personagem:', error);
        showNotification('Erro ao criar personagem. Por favor, tente novamente.', 'error');
    });
}

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

function displayCharacterDetails(character) {
    const detailContent = document.getElementById('detail-content');
    if (!detailContent) return;
    
    const html = `
        <div class="character-detail">
            <div class="character-detail-header">
                <h2>${character.nome}</h2>
                <p class="character-meta">${character.classe_nome || 'Classe desconhecida'} Nível ${character.nivel}</p>
                <p class="character-species">${character.especie_nome || 'Espécie desconhecida'}</p>
            </div>
            
            <div class="character-sheet">
                <div class="character-attributes-section">
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
                
                <div class="character-stats-section">
                    <h3>Estatísticas</h3>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <span class="stat-label">Pontos de Vida</span>
                            <span class="stat-value">${character.hp_atual}/${character.hp_maximo}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Classe de Armadura</span>
                            <span class="stat-value">${calculateAC(character)}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Bônus de Proficiência</span>
                            <span class="stat-value">+${getProficiencyBonus(character.nivel)}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Iniciativa</span>
                            <span class="stat-value">${getAttributeModifier(character.destreza)}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">Percepção Passiva</span>
                            <span class="stat-value">${10 + parseInt(getAttributeModifier(character.sabedoria))}</span>
                        </div>
                    </div>
                </div>
                
                <div class="character-actions-section">
                    <button class="edit-character-btn primary-btn" data-id="${character.id}">Editar Personagem</button>
                    <button class="level-up-btn primary-btn" data-id="${character.id}">Subir de Nível</button>
                    <button class="roll-dice-btn secondary-btn" data-character="${character.id}">Rolar Dados</button>
                </div>
            </div>
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
    
    const rollDiceBtn = detailContent.querySelector('.roll-dice-btn');
    if (rollDiceBtn) {
        rollDiceBtn.addEventListener('click', function() {
            const characterId = this.getAttribute('data-character');
            showCharacterDiceRoller(characterId);
        });
    }
}

function getAttributeModifier(value) {
    const modifier = Math.floor((value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

function calculateAC(character) {
    // Cálculo básico: 10 + modificador de Destreza
    const dexMod = Math.floor((character.destreza - 10) / 2);
    return 10 + dexMod;
}

function getProficiencyBonus(level) {
    if (level <= 4) return 2;
    if (level <= 8) return 3;
    if (level <= 12) return 4;
    if (level <= 16) return 5;
    return 6;
}

function editCharacter(id) {
    // Implementação da edição de personagem
    console.log(`Editando personagem: ${id}`);
    showNotification('Funcionalidade de edição de personagem em desenvolvimento.');
}

function deleteCharacter(id) {
    fetch(`/api/characters/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            showNotification('Personagem excluído com sucesso!');
            // Recarregar a lista de personagens
            loadCharacters();
        } else {
            throw new Error('Erro ao excluir personagem');
        }
    })
    .catch(error => {
        console.error('Erro ao excluir personagem:', error);
        showNotification('Erro ao excluir personagem. Por favor, tente novamente.', 'error');
    });
}

function levelUpCharacter(id) {
    // Implementação da subida de nível
    console.log(`Subindo de nível o personagem: ${id}`);
    showNotification('Funcionalidade de subir de nível em desenvolvimento.');
}

function showCharacterDiceRoller(characterId) {
    // Abrir o rolador de dados
    const diceRoller = document.getElementById('dice-roller');
    if (diceRoller) {
        diceRoller.classList.add('open');
    }
    
    // Mostrar opções específicas para o personagem
    fetch(`/api/characters/${characterId}`)
        .then(response => response.json())
        .then(character => {
            // Adicionar botões específicos para o personagem
            const diceButtons = document.querySelector('.dice-buttons');
            if (diceButtons) {
                // Adicionar botão para teste de atributo
                const attributeRollBtn = document.createElement('button');
                attributeRollBtn.className = 'dice-btn character-dice-btn';
                attributeRollBtn.textContent = 'Teste de Atributo';
                attributeRollBtn.addEventListener('click', function() {
                    showAttributeRollOptions(character);
                });
                diceButtons.appendChild(attributeRollBtn);
                
                // Adicionar botão para teste de resistência
                const savingThrowBtn = document.createElement('button');
                savingThrowBtn.className = 'dice-btn character-dice-btn';
                savingThrowBtn.textContent = 'Teste de Resistência';
                savingThrowBtn.addEventListener('click', function() {
                    showSavingThrowOptions(character);
                });
                diceButtons.appendChild(savingThrowBtn);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados do personagem para o rolador de dados:', error);
        });
}

function showAttributeRollOptions(character) {
    const attributes = [
        { name: 'Força', value: character.forca, abbr: 'FOR' },
        { name: 'Destreza', value: character.destreza, abbr: 'DES' },
        { name: 'Constituição', value: character.constituicao, abbr: 'CON' },
        { name: 'Inteligência', value: character.inteligencia, abbr: 'INT' },
        { name: 'Sabedoria', value: character.sabedoria, abbr: 'SAB' },
        { name: 'Carisma', value: character.carisma, abbr: 'CAR' }
    ];
    
    // Criar diálogo para seleção de atributo
    const dialog = document.createElement('div');
    dialog.className = 'dice-dialog';
    dialog.innerHTML = `
        <div class="dice-dialog-content">
            <h3>Selecione o Atributo</h3>
            <div class="attribute-buttons">
                ${attributes.map(attr => `
                    <button class="attribute-btn" data-attribute="${attr.abbr}" data-value="${attr.value}">
                        ${attr.abbr} (${attr.value})
                    </button>
                `).join('')}
            </div>
            <button class="cancel-btn">Cancelar</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Adicionar event listeners para os botões
    const attributeButtons = dialog.querySelectorAll('.attribute-btn');
    attributeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const attribute = this.getAttribute('data-attribute');
            const value = parseInt(this.getAttribute('data-value'));
            const modifier = Math.floor((value - 10) / 2);
            
            // Rolar d20 + modificador
            rollDice(1, 20, modifier, `Teste de ${attribute}`);
            
            // Fechar o diálogo
            dialog.remove();
        });
    });
    
    // Adicionar event listener para o botão de cancelar
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', function() {
        dialog.remove();
    });
}

function showSavingThrowOptions(character) {
    const attributes = [
        { name: 'Força', value: character.forca, abbr: 'FOR' },
        { name: 'Destreza', value: character.destreza, abbr: 'DES' },
        { name: 'Constituição', value: character.constituicao, abbr: 'CON' },
        { name: 'Inteligência', value: character.inteligencia, abbr: 'INT' },
        { name: 'Sabedoria', value: character.sabedoria, abbr: 'SAB' },
        { name: 'Carisma', value: character.carisma, abbr: 'CAR' }
    ];
    
    // Criar diálogo para seleção de atributo
    const dialog = document.createElement('div');
    dialog.className = 'dice-dialog';
    dialog.innerHTML = `
        <div class="dice-dialog-content">
            <h3>Selecione o Teste de Resistência</h3>
            <div class="attribute-buttons">
                ${attributes.map(attr => `
                    <button class="attribute-btn" data-attribute="${attr.abbr}" data-value="${attr.value}">
                        ${attr.abbr} (${attr.value})
                    </button>
                `).join('')}
            </div>
            <button class="cancel-btn">Cancelar</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Adicionar event listeners para os botões
    const attributeButtons = dialog.querySelectorAll('.attribute-btn');
    attributeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const attribute = this.getAttribute('data-attribute');
            const value = parseInt(this.getAttribute('data-value'));
            const modifier = Math.floor((value - 10) / 2);
            const profBonus = getProficiencyBonus(character.nivel);
            
            // Verificar se o personagem é proficiente neste teste de resistência
            // Simplificação: assumir que o personagem é proficiente em testes de resistência baseados nos atributos principais da classe
            let isProficient = false;
            if (character.classe_nome) {
                const classSavingThrows = {
                    'Bárbaro': ['FOR', 'CON'],
                    'Bardo': ['DES', 'CAR'],
                    'Clérigo': ['SAB', 'CAR'],
                    'Druida': ['INT', 'SAB'],
                    'Guerreiro': ['FOR', 'CON'],
                    'Monge': ['FOR', 'DES'],
                    'Paladino': ['SAB', 'CAR'],
                    'Patrulheiro': ['FOR', 'DES'],
                    'Ladino': ['DES', 'INT'],
                    'Feiticeiro': ['CON', 'CAR'],
                    'Bruxo': ['SAB', 'CAR'],
                    'Mago': ['INT', 'SAB']
                };
                
                if (classSavingThrows[character.classe_nome] && classSavingThrows[character.classe_nome].includes(attribute)) {
                    isProficient = true;
                }
            }
            
            // Rolar d20 + modificador + bônus de proficiência (se aplicável)
            const totalModifier = modifier + (isProficient ? profBonus : 0);
            rollDice(1, 20, totalModifier, `Resistência de ${attribute}${isProficient ? ' (Proficiente)' : ''}`);
            
            // Fechar o diálogo
            dialog.remove();
        });
    });
    
    // Adicionar event listener para o botão de cancelar
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', function() {
        dialog.remove();
    });
}

// Melhorias no Rolador de Dados
function initDiceRollerEnhancements() {
    console.log('Inicializando melhorias no rolador de dados...');
    
    // Adicionar botões para rolagens comuns de D&D
    addCommonDndRolls();
    
    // Melhorar a exibição de resultados
    enhanceDiceResultDisplay();
}

function addCommonDndRolls() {
    const diceRollerContent = document.querySelector('.dice-roller-content');
    if (!diceRollerContent) return;
    
    // Adicionar seção para rolagens comuns
    const commonRollsSection = document.createElement('div');
    commonRollsSection.className = 'common-rolls-section';
    commonRollsSection.innerHTML = `
        <h4>Rolagens Comuns</h4>
        <div class="common-rolls-buttons">
            <button class="common-roll-btn" data-roll="attack">Ataque</button>
            <button class="common-roll-btn" data-roll="damage">Dano</button>
            <button class="common-roll-btn" data-roll="skill">Perícia</button>
            <button class="common-roll-btn" data-roll="initiative">Iniciativa</button>
        </div>
    `;
    
    // Inserir após os botões de dados
    const diceButtons = diceRollerContent.querySelector('.dice-buttons');
    if (diceButtons) {
        diceButtons.parentNode.insertBefore(commonRollsSection, diceButtons.nextSibling);
    } else {
        diceRollerContent.appendChild(commonRollsSection);
    }
    
    // Adicionar event listeners para os botões de rolagens comuns
    const commonRollButtons = commonRollsSection.querySelectorAll('.common-roll-btn');
    commonRollButtons.forEach(button => {
        button.addEventListener('click', function() {
            const rollType = this.getAttribute('data-roll');
            handleCommonRoll(rollType);
        });
    });
}

function handleCommonRoll(rollType) {
    switch (rollType) {
        case 'attack':
            showAttackRollDialog();
            break;
        case 'damage':
            showDamageRollDialog();
            break;
        case 'skill':
            showSkillRollDialog();
            break;
        case 'initiative':
            // Rolagem simples de iniciativa (d20)
            rollDice(1, 20, 0, 'Iniciativa');
            break;
    }
}

function showAttackRollDialog() {
    // Criar diálogo para rolagem de ataque
    const dialog = document.createElement('div');
    dialog.className = 'dice-dialog';
    dialog.innerHTML = `
        <div class="dice-dialog-content">
            <h3>Rolagem de Ataque</h3>
            <div class="form-group">
                <label for="attack-bonus">Bônus de Ataque:</label>
                <input type="number" id="attack-bonus" value="0" min="-5" max="20">
            </div>
            <div class="form-group">
                <label for="attack-advantage">Vantagem/Desvantagem:</label>
                <select id="attack-advantage">
                    <option value="normal">Normal</option>
                    <option value="advantage">Vantagem</option>
                    <option value="disadvantage">Desvantagem</option>
                </select>
            </div>
            <div class="form-actions">
                <button id="roll-attack-btn" class="primary-btn">Rolar</button>
                <button class="cancel-btn">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Adicionar event listener para o botão de rolagem
    const rollAttackBtn = dialog.querySelector('#roll-attack-btn');
    rollAttackBtn.addEventListener('click', function() {
        const bonus = parseInt(document.getElementById('attack-bonus').value) || 0;
        const advantage = document.getElementById('attack-advantage').value;
        
        if (advantage === 'normal') {
            // Rolagem normal: 1d20 + bônus
            rollDice(1, 20, bonus, 'Ataque');
        } else if (advantage === 'advantage') {
            // Vantagem: rolar 2d20 e pegar o maior
            const roll1 = Math.floor(Math.random() * 20) + 1;
            const roll2 = Math.floor(Math.random() * 20) + 1;
            const highestRoll = Math.max(roll1, roll2);
            const total = highestRoll + bonus;
            
            // Exibir resultado
            const resultDisplay = document.getElementById('dice-result');
            if (resultDisplay) {
                resultDisplay.textContent = total;
            }
            
            // Adicionar ao histórico
            addToHistory(2, 20, [roll1, roll2], total, bonus, 'Ataque com Vantagem');
        } else if (advantage === 'disadvantage') {
            // Desvantagem: rolar 2d20 e pegar o menor
            const roll1 = Math.floor(Math.random() * 20) + 1;
            const roll2 = Math.floor(Math.random() * 20) + 1;
            const lowestRoll = Math.min(roll1, roll2);
            const total = lowestRoll + bonus;
            
            // Exibir resultado
            const resultDisplay = document.getElementById('dice-result');
            if (resultDisplay) {
                resultDisplay.textContent = total;
            }
            
            // Adicionar ao histórico
            addToHistory(2, 20, [roll1, roll2], total, bonus, 'Ataque com Desvantagem');
        }
        
        // Fechar o diálogo
        dialog.remove();
    });
    
    // Adicionar event listener para o botão de cancelar
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', function() {
        dialog.remove();
    });
}

function showDamageRollDialog() {
    // Criar diálogo para rolagem de dano
    const dialog = document.createElement('div');
    dialog.className = 'dice-dialog';
    dialog.innerHTML = `
        <div class="dice-dialog-content">
            <h3>Rolagem de Dano</h3>
            <div class="form-group">
                <label for="damage-dice-count">Número de Dados:</label>
                <input type="number" id="damage-dice-count" value="1" min="1" max="10">
            </div>
            <div class="form-group">
                <label for="damage-dice-type">Tipo de Dado:</label>
                <select id="damage-dice-type">
                    <option value="4">d4</option>
                    <option value="6">d6</option>
                    <option value="8">d8</option>
                    <option value="10">d10</option>
                    <option value="12">d12</option>
                    <option value="20">d20</option>
                </select>
            </div>
            <div class="form-group">
                <label for="damage-bonus">Bônus de Dano:</label>
                <input type="number" id="damage-bonus" value="0" min="0" max="20">
            </div>
            <div class="form-group">
                <label for="damage-type">Tipo de Dano:</label>
                <select id="damage-type">
                    <option value="Cortante">Cortante</option>
                    <option value="Perfurante">Perfurante</option>
                    <option value="Contundente">Contundente</option>
                    <option value="Ácido">Ácido</option>
                    <option value="Frio">Frio</option>
                    <option value="Fogo">Fogo</option>
                    <option value="Força">Força</option>
                    <option value="Elétrico">Elétrico</option>
                    <option value="Necrótico">Necrótico</option>
                    <option value="Psíquico">Psíquico</option>
                    <option value="Radiante">Radiante</option>
                    <option value="Trovão">Trovão</option>
                    <option value="Veneno">Veneno</option>
                </select>
            </div>
            <div class="form-actions">
                <button id="roll-damage-btn" class="primary-btn">Rolar</button>
                <button class="cancel-btn">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Adicionar event listener para o botão de rolagem
    const rollDamageBtn = dialog.querySelector('#roll-damage-btn');
    rollDamageBtn.addEventListener('click', function() {
        const diceCount = parseInt(document.getElementById('damage-dice-count').value) || 1;
        const diceType = parseInt(document.getElementById('damage-dice-type').value) || 6;
        const bonus = parseInt(document.getElementById('damage-bonus').value) || 0;
        const damageType = document.getElementById('damage-type').value;
        
        // Rolar dados de dano
        rollDice(diceCount, diceType, bonus, `Dano ${damageType}`);
        
        // Fechar o diálogo
        dialog.remove();
    });
    
    // Adicionar event listener para o botão de cancelar
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', function() {
        dialog.remove();
    });
}

function showSkillRollDialog() {
    // Lista de perícias do D&D 5e
    const skills = [
        { name: 'Acrobacia', ability: 'DES' },
        { name: 'Arcanismo', ability: 'INT' },
        { name: 'Atletismo', ability: 'FOR' },
        { name: 'Atuação', ability: 'CAR' },
        { name: 'Enganação', ability: 'CAR' },
        { name: 'Furtividade', ability: 'DES' },
        { name: 'História', ability: 'INT' },
        { name: 'Intimidação', ability: 'CAR' },
        { name: 'Intuição', ability: 'SAB' },
        { name: 'Investigação', ability: 'INT' },
        { name: 'Lidar com Animais', ability: 'SAB' },
        { name: 'Medicina', ability: 'SAB' },
        { name: 'Natureza', ability: 'INT' },
        { name: 'Percepção', ability: 'SAB' },
        { name: 'Persuasão', ability: 'CAR' },
        { name: 'Prestidigitação', ability: 'DES' },
        { name: 'Religião', ability: 'INT' },
        { name: 'Sobrevivência', ability: 'SAB' }
    ];
    
    // Criar diálogo para rolagem de perícia
    const dialog = document.createElement('div');
    dialog.className = 'dice-dialog';
    dialog.innerHTML = `
        <div class="dice-dialog-content">
            <h3>Teste de Perícia</h3>
            <div class="form-group">
                <label for="skill-select">Perícia:</label>
                <select id="skill-select">
                    ${skills.map(skill => `<option value="${skill.name}" data-ability="${skill.ability}">${skill.name} (${skill.ability})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="skill-bonus">Bônus Total:</label>
                <input type="number" id="skill-bonus" value="0" min="-5" max="20">
            </div>
            <div class="form-group">
                <label for="skill-advantage">Vantagem/Desvantagem:</label>
                <select id="skill-advantage">
                    <option value="normal">Normal</option>
                    <option value="advantage">Vantagem</option>
                    <option value="disadvantage">Desvantagem</option>
                </select>
            </div>
            <div class="form-actions">
                <button id="roll-skill-btn" class="primary-btn">Rolar</button>
                <button class="cancel-btn">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Adicionar event listener para o botão de rolagem
    const rollSkillBtn = dialog.querySelector('#roll-skill-btn');
    rollSkillBtn.addEventListener('click', function() {
        const skillSelect = document.getElementById('skill-select');
        const skillName = skillSelect.value;
        const abilityName = skillSelect.options[skillSelect.selectedIndex].getAttribute('data-ability');
        const bonus = parseInt(document.getElementById('skill-bonus').value) || 0;
        const advantage = document.getElementById('skill-advantage').value;
        
        if (advantage === 'normal') {
            // Rolagem normal: 1d20 + bônus
            rollDice(1, 20, bonus, `Perícia: ${skillName} (${abilityName})`);
        } else if (advantage === 'advantage') {
            // Vantagem: rolar 2d20 e pegar o maior
            const roll1 = Math.floor(Math.random() * 20) + 1;
            const roll2 = Math.floor(Math.random() * 20) + 1;
            const highestRoll = Math.max(roll1, roll2);
            const total = highestRoll + bonus;
            
            // Exibir resultado
            const resultDisplay = document.getElementById('dice-result');
            if (resultDisplay) {
                resultDisplay.textContent = total;
            }
            
            // Adicionar ao histórico
            addToHistory(2, 20, [roll1, roll2], total, bonus, `Perícia: ${skillName} (${abilityName}) com Vantagem`);
        } else if (advantage === 'disadvantage') {
            // Desvantagem: rolar 2d20 e pegar o menor
            const roll1 = Math.floor(Math.random() * 20) + 1;
            const roll2 = Math.floor(Math.random() * 20) + 1;
            const lowestRoll = Math.min(roll1, roll2);
            const total = lowestRoll + bonus;
            
            // Exibir resultado
            const resultDisplay = document.getElementById('dice-result');
            if (resultDisplay) {
                resultDisplay.textContent = total;
            }
            
            // Adicionar ao histórico
            addToHistory(2, 20, [roll1, roll2], total, bonus, `Perícia: ${skillName} (${abilityName}) com Desvantagem`);
        }
        
        // Fechar o diálogo
        dialog.remove();
    });
    
    // Adicionar event listener para o botão de cancelar
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', function() {
        dialog.remove();
    });
}

function enhanceDiceResultDisplay() {
    const diceResultDisplay = document.getElementById('dice-result-display');
    if (!diceResultDisplay) return;
    
    // Adicionar animação de rolagem
    const originalAddToHistory = window.addToHistory;
    window.addToHistory = function(count, sides, rolls, total, modifier, label) {
        // Mostrar animação de rolagem
        if (diceResultDisplay) {
            const resultSpan = document.getElementById('dice-result');
            if (resultSpan) {
                // Animação simples de rolagem
                let animationFrames = 10;
                let animationInterval = setInterval(() => {
                    resultSpan.textContent = Math.floor(Math.random() * (sides * count)) + 1;
                    animationFrames--;
                    
                    if (animationFrames <= 0) {
                        clearInterval(animationInterval);
                        resultSpan.textContent = total;
                        
                        // Adicionar classe para destacar o resultado
                        resultSpan.classList.add('dice-result-highlight');
                        setTimeout(() => {
                            resultSpan.classList.remove('dice-result-highlight');
                        }, 1000);
                    }
                }, 50);
            }
        }
        
        // Chamar a função original
        originalAddToHistory(count, sides, rolls, total, modifier, label);
    };
}

// Funções utilitárias
function showNotification(message, type = 'success') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adicionar ao corpo do documento
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover após alguns segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function getTipoLabel(tipo) {
    const labels = {
        'regra': 'Regra',
        'classe': 'Classe',
        'subclasse': 'Subclasse',
        'especie': 'Espécie',
        'magia': 'Magia',
        'monstro': 'Monstro',
        'item': 'Item',
        'item_magico': 'Item Mágico'
    };
    
    return labels[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
