//
// MINESWEEPER CLASSES
//

class MineCell {
  // CLASS VARIABLES
  // int x, y, surrounding
  // bool isMine
  // STATE state

  static STATE_MINE = 'mine'; // As marked by the player.
  static STATE_UNCOVERED = 'uncovered';
  static STATE_COVERED = 'covered';

  constructor( x, y, isMine ) { // (int,int,bool)
    this.x = x;
    this.y = y;
    this.surrounding = 0;
    this.isMine = isMine;
    this.state = MineCell.STATE_COVERED;
  } // constructor

  //
  // GETTERS and SETTERS
  //

  get surroundingMines() { return this.surrounding; }
  get isAMine() { return this.isMine; }
  get isCovered() { return ( this.state === MineCell.STATE_COVERED ); }
  get isMarkedAsMine() { return ( this.state === MineCell.STATE_MINE ); }

  set isMarkedAsMine( val ) {
    this.state = val ? MineCell.STATE_MINE : MineCell.STATE_COVERED;
  } // set isMarkedAsMine

  //
  // INTERFACE METHODS
  //

  addToSurroundings() {
    ++this.surrounding;
  } // addToSurround

  uncover() {
    this.state = MineCell.STATE_UNCOVERED;
  } // uncover
} // MineCell

class Minesweeper {
  // CLASS VARIABLES
  // int width, height, mines
  // STATE state
  // int uncovered, minesMarked
  // [(int,int)] selectedMines
  // bool hasBoard
  // [[MineCell]] board

  static STATE_PROGRESS = "in-progress";
  static STATE_WIN = "win";
  static STATE_LOSS = "loss";

  constructor( width, height, mines ) {
    this.width = width;
    this.height = height;
    this.mines = mines;
    this.state = Minesweeper.STATE_PROGRESS;
    this.uncovered = 0;
    this.minesMarked = 0;
    this.hasBoard = false;
  } // constructor

  //
  // GETTERS and SETTERS
  //

  get isOver() { return ( this.state !== Minesweeper.STATE_PROGRESS ); }
  get isWin() { return ( this.state === Minesweeper.STATE_WIN ); }
  get isLoss() { return ( this.state === Minesweeper.STATE_LOSS ); }
  get uncoveredCells() { return this.uncovered; }
  get mineMarkedCells() { return this.minesMarked; }
  get totalMines() { return this.mines }

  //
  // HELPER METHODS
  //

  chooseMines( firstX, firstY ) {
    this.selectedMines = [];
    while( this.selectedMines.length < this.mines ) {
      // Randomly choose coordinates;
      const x = Math.floor( Math.random() * this.width );
      const y = Math.floor( Math.random() * this.height );

      // Prevent mines around first guess:
      if ( x >= firstX - 1 && x <= firstX + 1
        && y >= firstY - 1 && y <= firstY + 1
      ) continue;

      // Prevent selecting a coordinate twice.
      if ( !this.isChosen([x,y]) ) this.selectedMines.push([x,y]);
    } // while
  } // chooseMines

  isChosen( pos ) { // pos is of form [x,y]
    let posEq = ( a, b ) => {
      // Checks that pos a and b are equal.
      return ( a[0] === b[0] && a[1] === b[1] )
    } // posEq

    for ( let i=0; i < this.selectedMines.length; ++i ) {
      if ( posEq( this.selectedMines[i], pos ) ) return true;
    } // for
    return false;
  } // isChosen

  constructBoard( firstX, firstY ) {
    this.chooseMines( firstX, firstY );
    if ( this.hasBoard ) throw "Board already constructed.";

    // Board Construction
    this.board = [];
    let row = [];
    for ( let y = 0; y < this.height; ++y ) {
      for ( let x = 0; x < this.width; ++x ) {
        row.push( new MineCell( x, y, this.isChosen([x,y]) ) );
      } // for
      this.board.push( row );
      row = [];
    } // for

    // Set up mine counters:
    // For each selected mine location,
    for ( let i=0; i < this.selectedMines.length; ++i ) {
      // Add 1 to the surrounding mine counters of its neighbours.
      let mineX = this.selectedMines[i][0];
      let mineY = this.selectedMines[i][1];

      for ( let x = mineX-1; x <= mineX+1; ++x ) {
        for ( let y = mineY-1; y <= mineY+1; ++y ) {
          if ( x < 0 || x >= this.width ) continue;
          if ( y < 0 || y >= this.height ) continue;
          if ( x == mineX && y == mineY ) continue;
          this.board[y][x].addToSurroundings();
        } // for
      } // for
    } // for
    this.hasBoard = true;
  } // constructBoard

  checkWin() {
    let expected = this.width * this.height - this.mines;
    if ( this.uncovered === expected ) this.state = Minesweeper.STATE_WIN;
  } // checkWin

  lossGame() {
    this.state = Minesweeper.STATE_LOSS;
  } // lossGame

  //
  // INTERFACE METHODS
  //

  isCovered( x, y ) {
    return ( this.hasBoard ? this.board[y][x].isCovered : true );
  } // isUncovered

  isMarkedAsMine( x, y ) {
    return ( this.hasBoard ? this.board[y][x].isMarkedAsMine : false );
  } // isMarkedAsMine

  isUncovered( x, y ) {
    return !this.isCovered( x, y ) && !this.isMarkedAsMine( x, y );
  } // isUncovered

  getSurrounding( x, y ) {
    if ( !this.hasBoard ) throw 'Board not constructed yet.';
    return this.board[y][x].surroundingMines;
  } // getSurround

  uncover( x, y ) {
    if ( this.isOver ) throw 'Game is over.';
    if ( !this.hasBoard ) this.constructBoard( x, y );

    // Check if allowed:
    if ( !this.isCovered( x, y ) ) return;
    if ( this.board[y][x].isMine ) this.lossGame();

    // Uncover mine:
    // If the cell has 0 neighbours, need to uncover neighbours as well.

    let queue = [[x,y]]; // Holds list of coordintes to uncover.

    // Loop for as long as there are items in the queue.
    while ( queue.length ) {
      // Remove first item:
      let curX = queue[0][0];
      let curY = queue[0][1];
      queue.shift();

      // Check cell validity:
      if ( curX < 0 || curX >= this.width ) continue;
      if ( curY < 0 || curY >= this.height ) continue;
      if ( this.isUncovered( curX, curY ) ) continue;

      // Queue neighbours if necessary:
      if ( this.getSurrounding( curX, curY ) === 0 ) {
        for ( let i=curX-1; i <= curX+1; ++i ) {
          for ( let j=curY-1; j <= curY+1; ++j ) queue.push([i,j]);
        } // for
      } // if

      // Uncover cell:
      this.board[curY][curX].uncover();
      ++this.uncovered;
    } // while

    this.checkWin();
  } // uncover

  markAsMine( x, y ) {
    // Check if allowed:
    if ( this.isOver ) throw 'Game is over.';
    if ( !this.hasBoard ) return;
    if ( this.isUncovered( x, y ) || this.isMarkedAsMine( x, y ) ) return;

    // Mark as mine:
    this.board[y][x].isMarkedAsMine = true;
    ++this.minesMarked;
  } // markAsMine

  unmarkAsMine( x, y ) {
    // Check if allowed:
    if ( this.isOver ) throw 'Game is over.';
    if ( !this.isMarkedAsMine( x, y ) ) return;

    // Unmark as mine.
    this.board[y][x].isMarkedAsMine = false;
    --this.minesMarked;
  } // unmarkAsMine

  isMine( x, y ) {
    if ( !this.isOver ) throw 'Can\'t check; game not over.';
    return this.board[y][x].isAMine; 
  } // isMine

} // Minesweeper

//
// REACT CLASSES
//

function Square(props) {
  // RELEVANT VARS:
  const x = props.x;
  const y = props.y;
  const isOver = props.game.isOver;
  const isCovered = props.game.isCovered( x, y );

  // Defaults:
  let text = isCovered ? "." : props.game.getSurrounding( x, y );
  let type = isCovered ? "" : `uncovered uncovered${text}`;

  // Mine cases:
  if ( isOver && props.game.isMine( x, y ) ) {
    text = "*";
    type = "mine";
  } else if ( props.game.isMarkedAsMine( x, y ) ) {
    // If the game is over, the cell must not be a mine.
    // If it is not, then we mark it as a mine as specified.
    text = isOver ? "." : "*";
    type = isOver ? "wrongMine" : "markedMine";
  } // if

  return (
    <button
      className={`cell ${type}`}
      onClick={ props.onClick }
      onContextMenu={ props.onContextMenu }
    >
      {text}
    </button>
  ) // return
} // Square

function Scoreboard(props) {
  let text;
  if ( props.game.isOver ) {
    text = props.game.isWin ? "You won!" : "You lost :("
  } else {
    const minesLeft = props.game.totalMines - props.game.mineMarkedCells;
    text = `${minesLeft} mines left.`
  } // if

  return (
    <p className="scoreboard">
      {text}
    </p>
  ); // return
} // Scoreboard

function Board(props) {
  let squares = [];
  let row = [];
  
  // Iterate through rows:
  for ( let y=0; y < props.height; ++y ) {
    // Iterate through items per row:
    for ( let x=0; x < props.width; ++x ) {
      const handleContextMenu = (e) => {
        props.onContextMenu( x, y );
        e.preventDefault();
      } // handleContextMenu

      row.push(<Square
        x={x} y={y}
        onClick={ () => { props.onClick( x, y ) } }
        onContextMenu={ handleContextMenu }
        game={props.game}
      />);
    } // for
    // Add the row to the board:
    squares.push( <div className="row">{row}</div> );
    row = [];
  } // for

  return squares;
} // Board

class Game extends React.Component {
  static defaultProps = {
    width: 20,
    height: 20,
    mines: 40
  } // defaultProps

  constructor(props) {
    super(props);
    this.state = {
      game: new Minesweeper(
        this.props.width,
        this.props.height,
        this.props.mines
      ) // new Minesweeper
    } // state
  } // constructor

  handleClick( x, y ) {
    let updatedGame = this.state.game;
    updatedGame.uncover( x, y );
    this.setState({ game: updatedGame });
  } // handleClick

  handleContextMenu( x, y ) {
    let updatedGame = this.state.game;
    if ( updatedGame.isMarkedAsMine( x, y ) ) {
      updatedGame.unmarkAsMine( x, y );
    } else updatedGame.markAsMine( x, y );
    this.setState({ game: updatedGame });
  } // handleContextMenu

  render() {
    return (
      <div className="container" >
        <Scoreboard game = { this.state.game } />
        <Board
          width = { this.props.width }
          height = { this.props.height }
          mines = { this.props.mines }
          onClick = { (x,y) => this.handleClick(x,y) }
          onContextMenu = { (x,y) => this.handleContextMenu( x, y ) }
          game = { this.state.game }
        />
      </div>
    ); // return
  } // render
} // Game

//
// RENDERING
//

const params = new URLSearchParams(  window.location.search );
const width = params.get("w");
const height = params.get("h");
const mines = params.get("m");

ReactDOM.render(
  <Game
    width={ width ? width : 20 }
    height={height ? height : 20 }
    mines={ mines ? mines : 40 }
  />,
  document.getElementById("root")
);
