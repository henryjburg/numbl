# numbl 🧮

A challenging number puzzle game where you fill a 4x4 grid to match row and column constraints. Think Wordle, but with numbers and constraints!

## 🎮 How to Play

**Goal**: Fill the 4x4 grid with numbers 1-9 so that each row and column satisfies its specific constraint.

### Basic Rules
1. **Fill the grid** with numbers 1-9 (no zeros!)
2. **Match the constraints** shown for each row and column
3. **Guess when ready** - press Enter or click "Guess" when a row/column is filled
4. **Get feedback** - see which numbers are correct, misplaced, or wrong
5. **Complete the puzzle** - solve all constraints to win!

## 🎯 Game Mechanics

### Constraint Types

#### **Sum Constraints** 🔢
- Numbers in the row/column must add up to the target value
- Example: "20" means the four numbers must sum to 20

#### **Odd/Even Constraints** 🔸🔹
- **Odd**: All numbers must be odd (1, 3, 5, 7, 9)
- **Even**: All numbers must be even (2, 4, 6, 8)

#### **Unique Constraints** ✨
- All numbers in the row/column must be different
- No duplicates allowed!

### Feedback System

After guessing a row or column, you'll get color-coded feedback:

- 🟢 **Green (Correct)**: Number is in the right position
- 🟡 **Yellow (Misplaced)**: Number exists in the puzzle but wrong position
- ⚪ **Gray (Wrong)**: Number doesn't belong anywhere in the puzzle

### Game Features

- **Auto-detection**: The game automatically detects when rows/columns are ready to guess
- **Duplicate highlighting**: Red highlighting shows duplicate numbers that prevent guessing
- **Locked cells**: Correct numbers become locked and can't be changed
- **Timer tracking**: See how long it takes you to solve each puzzle

## 🎮 Controls

### Mouse Controls
- **Click any cell** to select it
- **Click number buttons** (1-9) to fill the selected cell
- **Click "Guess"** when ready to check a row/column

### Keyboard Controls
- **Arrow keys** to navigate between cells
- **Number keys (1-9)** to fill the selected cell
- **Enter** to guess when rows/columns are ready
- **Backspace/Delete** to clear a cell and move left

## 🏆 Winning

When you complete the puzzle:
- **Puzzle ID** is shown for sharing
- **Share button** lets you share your result with friends

## 🚀 Quick Start

### For Players
```bash
# Clone and run
git clone <repository-url>
cd numbl
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) and start playing!

### For Developers
See the [Development](#development) section below for detailed setup and project structure.

## 🧩 Example Puzzle

Here's what a puzzle looks like:
- **Row 1**: Sum = 20
- **Row 2**: Sum = 20
- **Row 3**: Sum = 20
- **Row 4**: Sum = 19
- **Column 1**: All odd numbers
- **Column 2**: Sum = 23
- **Column 3**: All unique numbers
- **Column 4**: Sum = 19

## 🎨 Features

- **Beautiful UI** with smooth animations and modern design
- **Responsive layout** that works on desktop and mobile
- **Keyboard shortcuts** for power users
- **Visual feedback** with color-coded results
- **Timer tracking** to measure your performance
- **Share results** with friends
- **Confetti celebration** when you win!

## 🛠️ Development

### Project Structure
```
src/
├── components/     # React components
├── styles/        # CSS files
├── types/         # TypeScript definitions
├── utils/         # Game logic utilities
└── tests/         # Test files
```

### NPM Scripts
- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix auto-fixable linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

### Code Quality

This project uses ESLint and Prettier for code quality and formatting:

- **ESLint**: Catches potential errors and enforces coding standards
- **Prettier**: Ensures consistent code formatting
- **TypeScript**: Provides type safety and better developer experience

The linting configuration is set up to work with VS Code - install the ESLint and Prettier extensions for the best experience.
