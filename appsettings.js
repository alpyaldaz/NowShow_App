const quizSettings = {
    // Points settings
    pointsPerQuestion: 100,      
    pointsPenalty: 0,          
    
    // Time settings
    defaultTimePerQuestion: 30,  
    minTimePerQuestion: 5,     
    maxTimePerQuestion: 120,   
    
    // Player settings
    maxPlayers: 8,             // Max numplayers
    minPlayers: 1,             // Min num players
    
    // Question settings
    maxQuestions: 64,          
    randomizeQuestions: true,  // Whether to randomize question order
    
    // Display settings
    splashScreenDuration: 1000,  
           
    
    // Storage settings
    storageKey: 'quizState',    // Key for localStorage
    
    // UI settings
    themes: {
        primary: '#3498db',
        secondary: '#2ecc71',
        danger: '#e74c3c',
        warning: '#f1c40f'
    }
};

// Export the settings
if (typeof module !== 'undefined' && module.exports) {
    module.exports = quizSettings;
} else {
    window.quizSettings = quizSettings;
}