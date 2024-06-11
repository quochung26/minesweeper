import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Modal from "react-modal";
import { Clock, Circle, Flag, XMark } from "./components/Icons";
import { map, checked, sweepers, modalData } from "./types";
import { convertCount } from "./until";
import "./App.css";

const MAP: map = {
  easy: { high: 8, length: 10, mine: 10 },
  medium: { high: 14, length: 18, mine: 40 },
  hard: { high: 20, length: 24, mine: 99 },
};

function Count({
  checked,
  explode,
  level,
  modalData,
  setResult,
}: {
  checked: checked;
  explode: boolean;
  level: string;
  modalData: modalData;
  setResult: (value: number) => void;
}) {
  const [count, setCount] = useState<number>(0);
  const { open } = modalData;

  const start = Object.keys(checked).length >= 1 && count <= 999 && !explode;

  useEffect(() => {
    let timer = 0;
    if (start) {
      timer = setTimeout(() => setCount(count + 1), 1000);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [start, count]);

  useEffect(() => {
    if (level && !open) setCount(0);
  }, [level, open]);

  useEffect(() => {
    if (open) setResult(count);
  }, [open, setResult, count]);

  return (
    <div className="info-wrap">
      <div className="icon">
        <Clock />
      </div>
      <div className="number">{convertCount(count)}</div>
    </div>
  );
}

function checkMine(
  checkRow: number,
  checkCol: number,
  checked: checked,
  board: Array<Array<number>>
) {
  if (board[checkRow][checkCol] === 1) {
    return false;
  }

  if (checked[`${checkRow}-${checkCol}`] !== undefined) {
    return true;
  }

  const directions = [
    { row: checkRow + 1, col: checkCol },
    { row: checkRow + 1, col: checkCol + 1 },
    { row: checkRow + 1, col: checkCol - 1 },
    { row: checkRow - 1, col: checkCol },
    { row: checkRow - 1, col: checkCol + 1 },
    { row: checkRow - 1, col: checkCol - 1 },
    { row: checkRow, col: checkCol - 1 },
    { row: checkRow, col: checkCol + 1 },
  ];

  let count = 0;
  const next = [];

  for (let i = 0; i < directions.length; i++) {
    const { row, col } = directions[i];
    const position = `${row}-${col}`;
    if (
      row < 0 ||
      col < 0 ||
      row > board.length - 1 ||
      col > board[0].length - 1 ||
      checked[position] !== undefined
    )
      continue;
    if (board[row][col] === 1) {
      count += 1;
    } else {
      next.push({ row, col });
    }
  }

  checked[`${checkRow}-${checkCol}`] = count;

  if (count === 0 && next.length > 0) {
    next.forEach(({ row, col }) => checkMine(row, col, checked, board));
  }

  return true;
}

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

function App() {
  const [level, setLevel] = useState<string>("medium");
  const [checked, setChecked] = useState<checked>({});
  const [sweepers, setSweepers] = useState<sweepers>({});
  const [explode, setExplode] = useState(false);
  const [modalData, setModalData] = useState<modalData>({
    open: false,
    playTime: 0,
    mineRemoved: 0,
    newGame: 0,
  });
  const { high, length, mine } = MAP[level] || MAP["medium"];

  const { newGame, open, playTime, mineRemoved } = modalData;

  const board = useMemo(() => {
    const array = Array.from({ length: high }, () =>
      Array.from({ length }, () => 0 * newGame)
    );

    let count = 0;
    while (count <= mine) {
      const i = Math.floor(Math.random() * high);
      const j = Math.floor(Math.random() * length);
      if (array[i][j] === 0) {
        count++;
        array[i][j] = 1;
      }
    }

    return array;
  }, [high, length, mine, newGame]);

  useEffect(() => {
    let count = 0;
    for (const i in sweepers) {
      const position = i.split("-");
      if (board[parseInt(position[0])][parseInt(position[1])] === 1) {
        count++;
      }
    }

    if (explode || count === mine) {
      setModalData((preState) => {
        return { ...preState, open: true, mineRemoved: count };
      });
    }
  }, [explode, board, mine, sweepers]);

  const handleSetResult = useCallback((value: number) => {
    setModalData((preState) => {
      return { ...preState, playTime: value };
    });
  }, []);

  const handleOnClick = (row: number, col: number) => {
    const cloneChecked = { ...checked };
    if (!sweepers[`${row}-${col}`] && !explode) {
      if (checkMine(row, col, cloneChecked, board)) {
        setChecked(cloneChecked);
      } else {
        setExplode(true);
      }
    }
  };

  const handleOnContextMenu = (row: number, col: number) => {
    const cloneSweepers = { ...sweepers };
    const position = `${row}-${col}`;
    if (
      !explode &&
      !checked[position] &&
      Object.keys(cloneSweepers).length <= mine
    ) {
      if (cloneSweepers[position]) {
        delete cloneSweepers[position];
      } else {
        cloneSweepers[position] = 1;
      }
      setSweepers(cloneSweepers);
    }
  };

  const handleChangeLevel = (e: ChangeEvent<HTMLSelectElement>) => {
    setLevel(e.target.value);
    setChecked({});
    setSweepers({});
    setExplode(false);
  };

  const handleClose = () => {
    setModalData({
      open: false,
      playTime: 0,
      mineRemoved: 0,
      newGame: 0,
    });
    setChecked({});
    setSweepers({});
    setExplode(false);
  };

  const boardHtml = board.map((rowArr, i) => {
    return rowArr.map((value, j) => {
      const position = `${i}-${j}`;
      const number = checked[position];
      const sweeper = sweepers[position];
      const className = number !== undefined ? "mine-" + number : "";
      let squareValue: number | string | ReactNode = number || "";
      if (sweeper) {
        squareValue = <Flag />;
      }
      if (explode && value === 1) {
        squareValue = sweeper ? <XMark /> : <Circle />;
      }

      return (
        <div
          key={i + j}
          className={`square ${className}`}
          onClick={() => handleOnClick(i, j)}
          onContextMenu={() => handleOnContextMenu(i, j)}
        >
          {squareValue}
        </div>
      );
    });
  });

  return (
    <div className="container">
      <h1 className="title">Minesweeper</h1>
      <div className="info">
        <div className="select">
          <select
            name="difficult"
            id="difficult"
            value={level}
            onChange={handleChangeLevel}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="info-wrap">
          <div className="icon">
            <Flag />
          </div>
          <div className="number">{mine - Object.keys(sweepers).length}</div>
        </div>
        <Count
          checked={checked}
          explode={explode}
          level={level}
          modalData={modalData}
          setResult={handleSetResult}
        />
      </div>
      <div className="wrap">
        <div
          className={`squares ${level}`}
          onContextMenu={(e) => e.preventDefault()}
        >
          {boardHtml}
        </div>
      </div>
      <Modal isOpen={open} style={customStyles} onRequestClose={handleClose}>
        <div className="info">
          <div className="info-wrap">
            <div className="icon">
              <XMark />
            </div>
            <div className="number">{mineRemoved}</div>
          </div>
          <div className="info-wrap">
            <div className="icon">
              <Flag />
            </div>
            <div className="number">{mine - mineRemoved}</div>
          </div>
          <div className="info-wrap">
            <div className="icon">
              <Clock />
            </div>
            <div className="number">{convertCount(playTime)}</div>
          </div>
        </div>
        <div className="result">
          {explode ? "You lose!!!!!" : "You win!!!!!"}
        </div>
        <button className="btn" onClick={handleClose}>
          Play again
        </button>
      </Modal>
    </div>
  );
}

export default App;
