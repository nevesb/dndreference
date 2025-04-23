// Arquivo JavaScript para o rolador de dados
document.addEventListener('DOMContentLoaded', function() {
    initDiceRoller();
});

// Função para inicializar o rolador de dados
function initDiceRoller() {
    // Configurar o toggle do rolador de dados
    const diceRollerToggle = document.getElementById('dice-roller-toggle');
    const diceRoller = document.getElementById('dice-roller');
    
    if (diceRollerToggle && diceRoller) {
        diceRollerToggle.addEventListener('click', function() {
            diceRoller.classList.toggle('open');
        });
    }
    
    // Configurar os botões de dados
    const diceButtons = document.querySelectorAll('.dice-btn');
    diceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const diceType = this.getAttribute('data-dice');
            const sides = parseInt(diceType.replace('d', ''));
            rollDice(1, sides);
        });
    });
    
    // Configurar o botão de rolagem personalizada
    const rollCustomDiceBtn = document.getElementById('roll-custom-dice');
    if (rollCustomDiceBtn) {
        rollCustomDiceBtn.addEventListener('click', function() {
            const count = parseInt(document.getElementById('dice-count').value);
            const sides = parseInt(document.getElementById('dice-sides').value);
            
            if (isNaN(count) || isNaN(sides) || count < 1 || sides < 1) {
                alert('Por favor, insira valores válidos para os dados.');
                return;
            }
            
            rollDice(count, sides);
        });
    }
}

// Função para rolar dados
function rollDice(count, sides, modifier = 0, label = '') {
    console.log(`Rolando ${count}d${sides}${modifier ? ' + ' + modifier : ''}`);
    
    // Abrir o rolador de dados se estiver fechado
    const diceRoller = document.getElementById('dice-roller');
    if (diceRoller && !diceRoller.classList.contains('open')) {
        diceRoller.classList.add('open');
    }
    
    // Gerar resultados aleatórios
    let rolls = [];
    let total = 0;
    
    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    // Adicionar modificador
    total += modifier;
    
    // Exibir resultado
    const resultDisplay = document.getElementById('dice-result');
    if (resultDisplay) {
        resultDisplay.textContent = total;
    }
    
    // Adicionar ao histórico
    addToHistory(count, sides, rolls, total, modifier, label);
    
    return total;
}

// Função para adicionar ao histórico de rolagens
function addToHistory(count, sides, rolls, total, modifier, label) {
    const historyList = document.getElementById('dice-history-list');
    if (!historyList) return;
    
    // Criar item de histórico
    const historyItem = document.createElement('li');
    
    // Formatar texto do histórico
    let historyText = '';
    if (label) {
        historyText += `<strong>${label}:</strong> `;
    }
    
    historyText += `${count}d${sides}`;
    if (modifier) {
        historyText += ` + ${modifier}`;
    }
    
    historyText += ` = ${total} [${rolls.join(', ')}`;
    if (modifier) {
        historyText += ` + ${modifier}`;
    }
    historyText += ']';
    
    historyItem.innerHTML = historyText;
    
    // Adicionar ao início da lista
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }
    
    // Limitar o histórico a 10 itens
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}
