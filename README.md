# SOS Spark Arena

SOS Spark Arena is a browser-based implementation of the classic SOS pencil-and-paper game, built with HTML, CSS, and JavaScript and designed with an attractive UI that appeals to both kids and adults.[cite:2][cite:1] The game supports human vs AI play, configurable board sizes, live score tracking, and extra turns when a player scores.[cite:6][cite:5][cite:4]

## Features

- Configurable board size (e.g., 3x3 up to 8x8) chosen by the user before starting a game.[cite:6]  
- Human vs AI gameplay: the player chooses S or O, then the computer selects its move.[cite:6]  
- Scoring system that awards points only for exact `S-O-S` sequences formed by the latest move.[cite:5][cite:4]  
- Extra turn rule: when a player or the computer scores, they immediately get another chance to play.[cite:5][cite:4]  
- Live scoreboard with player and AI scores, current turn indicator, and final result shown when the board is full.[cite:6][cite:5]  
- Attractive **Spark** Arena theme UI with colorful board, clear controls, and responsive layout suitable for project demos and deployment.[cite:2][cite:1]

## Tech Stack

- **HTML5** – Page structure, controls, board container, score area, and layout.[cite:3][cite:6][cite:1]  
- **CSS3** – Visual styling, colors, typography, and responsive design for the Spark Arena UI.[cite:2][cite:3][cite:1]  
- **JavaScript** (Vanilla JS) – Game logic, board generation, scoring, AI moves, turn handling, and DOM interactions.[cite:6][cite:5][cite:4][cite:1]  
- (Optional) **Python + Flask** – Simple backend to serve the static files if you want to present the project as a Python web app.[cite:3][web:19]

## Project Structure

If you are using the single-file version:

```text
D:\DK\SOS\
└── sos-spark-arena.html
```

All HTML, CSS, and JavaScript are contained in `sos-spark-arena.html`, and you can open it directly in the browser.[cite:1]

If you are using the split frontend + optional backend version:

```text
D:\DK\SOS\
├── index.html    # Main page and UI structure
├── style.css     # Styles for Spark Arena theme
├── script.js     # Game and AI logic
└── app.py        # Optional Flask server (Python)
```

- `index.html` links to `style.css` and `script.js` and contains the main layout.[cite:3]  
- `style.css` defines the board appearance, buttons, score cards, and responsive design.[cite:3][cite:2]  
- `script.js` implements board setup, user input, scoring rules, turn management, and AI moves (with Minimax and alpha-beta pruning if enabled).[cite:6][cite:5][cite:4][web:10]  
- `app.py` is a minimal Flask app that serves `index.html` and static files.[cite:3][web:19]

## Game Rules

- Players place either `S` or `O` on an empty cell of the board during their turn.[cite:6][cite:1]  
- A point is awarded only when the latest move creates one or more exact `S-O-S` patterns horizontally, vertically, or diagonally.[cite:5][cite:4]  
- Each `S-O-S` found around the new letter counts as 1 point; multiple patterns from one move give multiple points.[cite:4]  
- If a player (human or AI) scores at least 1 point, they keep the turn and play again; otherwise, the turn passes to the other side.[cite:5][cite:4]  
- When all cells are filled, the game stops and shows the final scores and result (win, lose, or draw).[cite:6][cite:5]

## AI and Algorithms

The computer player is implemented as an AI agent that evaluates possible moves and tries to maximize its score while minimizing the human player’s score.[cite:6][cite:5]

- **Minimax algorithm**:  
  The game can be modeled as a two-player adversarial search problem where the AI assumes the opponent plays optimally and chooses moves that maximize its guaranteed outcome.[cite:8][web:11][web:13]  

- **Alpha-beta pruning** (optional optimization):  
  Alpha-beta pruning skips exploring branches of the game tree that cannot affect the final Minimax decision, reducing computation time without changing the chosen best move.[cite:8][web:10][web:17]  

- **Evaluation function** (example):  
  A common heuristic is `score = ai_score - human_score`, so the AI prefers board states where its lead is larger.[cite:8][web:10]  

You can tune depth limits, heuristics, or difficulty levels (e.g., Beginner, Smart, Genius) to control how strong the AI plays.[cite:2][web:10]

## Setup and Running

### 1. Single-file frontend (recommended for quick demo)

1. Place `sos-spark-arena.html` inside `D:\DK\SOS\`.[cite:1]  
2. Double-click the file or open it with any modern browser (Chrome, Edge, Firefox).  
3. Choose board size, start the game, and play against the AI.

### 2. Split files with Flask backend (optional)

1. Ensure you have Python 3 installed.  
2. Install Flask:

   ```bash
   pip install flask
   ```

3. Place `index.html`, `style.css`, `script.js`, and `app.py` inside `D:\DK\SOS\`.[cite:3]  
4. Run the Flask app:

   ```bash
   cd /d D:\DK\SOS
   python app.py
   ```

5. Open `http://127.0.0.1:5000` in your browser to play the game.[cite:3][web:19]

## How to Play

- Select the board size and start a new game.  
- Use the letter picker to choose `S` or `O` for your move.  
- Click on an empty cell to place your letter; the game will update the board, scores, and turn indicator automatically.[cite:6][cite:1]  
- Watch the AI respond with its own moves and keep track of points in the scoreboard.[cite:6][cite:5]  
- Continue until the board is full and see the final result message.

## Future Improvements

Some possible extensions and enhancements:

- Add sound effects and simple animations when cells are filled or points are scored.[cite:2]  
- Implement multiple difficulty levels by changing Minimax depth or heuristics.  
- Add a welcome screen, result popup, and game history panel for a more polished experience.[cite:2]  
- Integrate with a backend database (e.g., SQLite, MongoDB, Firebase) to store match results or leaderboards.  
- Deploy on GitHub Pages, Netlify, or Vercel for easy online access to the game.[cite:6][web:15]

## License

You can add your preferred license here (e.g., MIT) depending on whether you want to keep the code open-source for others to use and modify.

---
