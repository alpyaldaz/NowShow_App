"use strict";

// State management
let state = {
    players: [],
    questions: [],
    currentPlayer: 0,
    timePerQuestion: quizSettings.defaultTimePerQuestion,
    usedQuestions: new Set(),
    currentQuestionIndex: null
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Set initial values from appsettings
    const timeInput = document.getElementById('timePerQuestion');
    const playerInput = document.getElementById('playerCount');

    if (timeInput) {
        timeInput.value = quizSettings.defaultTimePerQuestion;  //sets 30 seconds from appsettings.js
        timeInput.min = quizSettings.minTimePerQuestion;
        timeInput.max = quizSettings.maxTimePerQuestion;
    }

    if (playerInput) {
        playerInput.value = 2;  // sets 2 players
        playerInput.max = quizSettings.maxPlayers;
        playerInput.min = quizSettings.minPlayers;
    }

    initializeState();
    updateQuestionList();
});


// Initialize state 
function initializeState() { //refresh the page
    const savedState = localStorage.getItem(quizSettings.storageKey);
    if (savedState) {
        try {
            state = JSON.parse(savedState);
            
        } catch (e) {
            console.error('Error loading saved state:', e);
            resetQuiz();
        }
    }
} 


function saveState() { //Saving current game to thebrowser storage
    try {
        const stateCopy = { ...state };
        stateCopy.usedQuestions = Array.from(state.usedQuestions);
        localStorage.setItem(quizSettings.storageKey, JSON.stringify(stateCopy)); 
    } catch (e) {
        console.error('Error saving state:', e);
    }
}



// Add a question
function addQuestion() {
    const questionInput = document.getElementById('questionInput');
    const answerInput = document.getElementById('answerInput');

    if (!questionInput || !answerInput) {
        console.error('Input elements not found');
        return;
    }

    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question || !answer) {
        alert('Please enter both question and answer');
        return;
    }

    if (state.questions.length >= quizSettings.maxQuestions) {
        alert(`Maximum ${quizSettings.maxQuestions} questions allowed`);
        return;
    }

    state.questions.push({ question, answer }); 
    updateQuestionList();
    saveState(); 

    questionInput.value = '';
    answerInput.value = '';
    console.log('Question added successfully');
}

// Import questions in bulk 'json'
function importQuestions() {
    const bulkInput = document.getElementById('bulkImport');
    if (!bulkInput || !bulkInput.value.trim()) {
        alert('Please enter JSON data');
        return;
    }

    try {
        const questions = JSON.parse(bulkInput.value);
        if (Array.isArray(questions)) {
            if (state.questions.length + questions.length > quizSettings.maxQuestions) {
                alert(`Can't import: would exceed maximum of ${quizSettings.maxQuestions} questions`);
                return;
            }
            state.questions = state.questions.concat(questions);
            updateQuestionList();
            saveState();
            bulkInput.value = '';
            console.log('Questions imported successfully');
        } else {
            alert('Please provide an array of questions');
        }
    } catch (error) {
        alert('Invalid JSON format');
        console.error('JSON parse error:', error);
    }
}

// Export questions
function exportQuestions() {
    const jsonStr = JSON.stringify(state.questions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}




// Question list display
function updateQuestionList() {
    const list = document.getElementById('questionList');
    if (!list) {
        console.error('Question list element not found');
        return;
    }

    if (!state.questions || state.questions.length === 0) {
        list.innerHTML = '<p>No questions added yet</p>';
        return;
    }

    list.innerHTML = state.questions.map((q, i) =>
        `<div class="question-item">
            ${i + 1}. Q: ${q.question}<br>
            A: ${q.answer}
        </div>`
    ).join('');
}



// Reset everything
function resetQuiz() {
    if (confirm('Are you sure you want to reset everything? This cannot be undone.')) {
        localStorage.clear();
        state = {
            players: [],
            questions: [],
            currentPlayer: 0,
            timePerQuestion: quizSettings.defaultTimePerQuestion,
            usedQuestions: new Set(),
            currentQuestionIndex: null
        };
        updateQuestionList();
        showScreen('configScreen');
        console.log('Quiz reset successfully');
    }
}




// Show specific screen
function showScreen(screenId) {
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
        console.error('Screen not found:', screenId);
        return;
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    targetScreen.classList.add('active');
}





function startShow() {
    const playerCount = parseInt(document.getElementById('playerCount').value);
    const timeInput = document.getElementById('timePerQuestion');

    if (!playerCount || isNaN(playerCount) || playerCount < quizSettings.minPlayers || playerCount > quizSettings.maxPlayers) {
        alert(`Please enter a valid number of players (${quizSettings.minPlayers}-${quizSettings.maxPlayers})`);
        return;
    }

    const timePerQuestion = parseInt(timeInput.value);
    if (isNaN(timePerQuestion) || timePerQuestion < quizSettings.minTimePerQuestion || timePerQuestion > quizSettings.maxTimePerQuestion) {
        alert(`Please enter a valid time per question (${quizSettings.minTimePerQuestion}-${quizSettings.maxTimePerQuestion} seconds)`);
        return;
    }

    if (!state.questions || state.questions.length === 0) {
        alert('Please add some questions first');
        return;
    }



    
    const savedState = localStorage.getItem(quizSettings.storageKey);// Check if theres an existing game
    if (savedState) {
        
        if (confirm('Do you want to continue the previous game?')) {//  if players wanna continue the previous game
            try {
                state = JSON.parse(savedState);
                state.usedQuestions = new Set(state.usedQuestions);
            } catch (e) {
                console.error('Error loading saved state:', e);
            }
        } else {
            
            state.players = Array(playerCount).fill(0);  // if players dont wanna continue
            state.timePerQuestion = timePerQuestion;
            state.usedQuestions = new Set();
            state.currentPlayer = 0;
        }
    } else {


        // starts new game
        state.players = Array(playerCount).fill(0);
        state.timePerQuestion = timePerQuestion;
        state.usedQuestions = new Set();
        state.currentPlayer = 0;
    }

    saveState();
    showScreen('splashScreen');

    setTimeout(() => {
        showPlayersScreen();
    }, quizSettings.splashScreenDuration);
}




// timer functionality
let timerInterval;
function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = state.timePerQuestion;
    const timerDisplay = document.getElementById('timer');

    if (!timerDisplay) {
        console.error('Timer element not found');
        return;
    }

    timerDisplay.textContent = `Time: ${timeLeft}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = 'Time is up!';
        }
    }, 1000);
}




// Show players screen
function showPlayersScreen() {
    const scoresDiv = document.getElementById('playerScores');
    const selectionDiv = document.getElementById('playerSelection');

    if (!scoresDiv || !selectionDiv) {
        console.error('Player screen elements not found');
        return;
    }

    // scores display per persom
    scoresDiv.innerHTML = state.players.map((score, i) => `
        <div class="player-score ${i === state.currentPlayer ? 'current-player' : ''}">
            Player ${i + 1}: ${score} points
        </div>
    `).join('');

    // player selection button
    selectionDiv.innerHTML = state.players.map((_, i) => `
        <button 
            onclick="selectPlayer(${i})" 
            class="player-button ${i === state.currentPlayer ? 'selected' : ''}"
        >
            Player ${i + 1}
        </button>
    `).join('');

    showScreen('playersScreen');
}



// Back to menu function
function backToMenu() {
    if (confirm('Are you sure you want to return to the menu?')) {
        showScreen('configScreen');
    }
}

// Handle player selection
function selectPlayer(playerIndex) {
    if (playerIndex < 0 || playerIndex >= state.players.length) {
        console.error('Invalid player index');
        return;
    }

    state.currentPlayer = playerIndex;
    saveState();
    
    // Update UI
    document.querySelectorAll('.player-button').forEach((btn, i) => {
        btn.classList.toggle('selected', i === playerIndex);
    });
    
    document.querySelectorAll('.player-score').forEach((div, i) => {
        div.classList.toggle('current-player', i === playerIndex);
    });
}

// Show question selection screen
function showSelectionScreen() {
    const questionsDiv = document.getElementById('availableQuestions');
    if (!questionsDiv) {
        console.error('Questions div not found');
        return;
    }

    const unusedQuestions = state.questions.filter((_, i) => !state.usedQuestions.has(i));
    
    if (unusedQuestions.length === 0) {
        alert('No more questions available! Game Over!');
        return;
    }
    
    questionsDiv.innerHTML = state.questions.map((_, i) => 
     
     //check if question used
        ` 
        <button 
            onclick="selectQuestion(${i})"
            class="${state.usedQuestions.has(i) ? 'used-question' : ''}" 
            ${state.usedQuestions.has(i) ? 'disabled' : ''}  
        >
            ${i + 1}
        </button>
    `).join('');
    
    showScreen('selectionScreen');
}

// select and display a question
function selectQuestion(index) {
    if (state.usedQuestions.has(index)) { 
        console.log('Question already used');
        return;
    }
    
    state.currentQuestionIndex = index;
    const question = state.questions[index];
    
    const elements = {
        questionDisplay: document.getElementById('currentQuestion'),
        answerDisplay: document.getElementById('currentAnswer'),
        answerSection: document.getElementById('answerSection')
    };

    // Update UI
    if (elements.questionDisplay) elements.questionDisplay.textContent = question.question;
    if (elements.answerDisplay) elements.answerDisplay.textContent = question.answer;
    if (elements.answerSection) elements.answerSection.style.display = 'none';
    
    startTimer();
    showScreen('questionScreen');
}

// Show answer
function showAnswer() {
    clearInterval(timerInterval);
    const answerSection = document.getElementById('answerSection');
    if (answerSection) {
        answerSection.style.display = 'block';
    }
}

// Return to players screen
function returnToPlayers() {
    clearInterval(timerInterval);
    if (state.currentQuestionIndex !== null) {
        state.usedQuestions.add(state.currentQuestionIndex);
    }
    saveState();
    showPlayersScreen();
}


// Award points
function awardPoints() {
    state.players[state.currentPlayer] += quizSettings.pointsPerQuestion;
    if (state.currentQuestionIndex !== null) {
        state.usedQuestions.add(state.currentQuestionIndex);  // shows question as used
    }
    saveState();
    showPlayersScreen();
}


// Next player function
function nextPlayer() {
    if (state.currentQuestionIndex !== null) {
        state.usedQuestions.add(state.currentQuestionIndex);  // shows question as used
    }
    saveState();
    showPlayersScreen();
}

// Log initial load
console.log('Quiz application initialized');