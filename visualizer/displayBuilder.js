let mainTable;
let cellLocationLabel;

window.onload = () => {
  mainTable = document.getElementById("main-table");
  cellLocationLabel = document.getElementById("cell-location")
};

let graphicLog;

function loadLog(log) {
  graphicLog = log;
  let rowsCount = log.init.graphicMap.row;
  let colsCount = log.init.graphicMap.col;

  let pathsInCells = new Array(rowsCount);
  for (let i = 0; i < rowsCount; i++) {
    pathsInCells[i] = new Array(colsCount);
  }

  for (path of log.init.graphicMap.paths)
    for (cell of path.cells) {
      let inCell = pathsInCells[cell.row][cell.col];
      if (inCell == undefined) inCell = new Array();
      inCell.push(path.pathId);
      pathsInCells[cell.row][cell.col] = inCell;
    }

  const pathTable = document.getElementById("path-table");

  for (let i = 0; i < rowsCount; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < colsCount; j++) {
      const cell = document.createElement("td");
      if (pathsInCells[i][j]) {
        for (pathId of pathsInCells[i][j]) {
          const tile = document.createElement("div");
          tile.className = `path-cell path-${pathId}`;
          cell.appendChild(tile);
        }
      }
      row.appendChild(cell);
    }
    pathTable.appendChild(row);
  }

  mainTable.innerHTML = "";
  for (let i = 0; i < rowsCount; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < colsCount; j++) {
      const cell = document.createElement("td");
      cell.onmouseover = () => {
        cellLocationLabel.innerText = `(row: ${i}, col: ${j})`;
      }
      row.appendChild(cell);
    }
    mainTable.appendChild(row);
  }
}

function viewTurn(turnIndex) {
  let turn = graphicLog.turns[turnIndex];

  let rowsCount = graphicLog.init.graphicMap.row;
  let colsCount = graphicLog.init.graphicMap.col;

  let unitsInCells = new Array(rowsCount);
  for (let i = 0; i < rowsCount; i++) {
    unitsInCells[i] = new Array(colsCount);
  }

  const spellsOnUnits = {};

  for (let i = 0; i < turn.playerTurnEvents.length; i++) {
    const playerTurnEvent = turn.playerTurnEvents[i];
    const turnEvent = playerTurnEvent.turnEvent;
    if (turnEvent.isAlive) {
      const king = graphicLog.init.graphicMap.kings[i];
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++) {
          let inCell = unitsInCells[king.row + y][king.col + x];
          if (inCell == undefined) inCell = new Array([], [], [], [], []);
          inCell[4].push({ pId: playerTurnEvent.pId, hp: turnEvent.hp });
          unitsInCells[king.row + y][king.col + x] = inCell;
        }
    }
    for (const unit of turnEvent.units) {
      let inCell = unitsInCells[unit.row][unit.col];
      if (inCell == undefined) inCell = new Array([], [], [], [], []);
      inCell[playerTurnEvent.pId].push(unit);
      unitsInCells[unit.row][unit.col] = inCell;
    }

    for (const spell of turnEvent.mapSpells)
      for (const unitId of spell.unitIds) {
        if (spellsOnUnits[unitId] == undefined) {
          spellsOnUnits[unitId] = new Array();
        }
        spellsOnUnits[unitId].push(spell);
      }
  }

  const attacks = {}
  for (const attack of turn.turnAttacks) {

    const key = attack.attackerId.toString();
    if (!(key in attacks))
      attacks[key] = []

    attacks[key].push(attack.defenderId)
  }

  let row = mainTable.firstChild;
  for (let i = 0; i < rowsCount; i++) {
    let cell = row.firstChild;
    for (let j = 0; j < colsCount; j++) {
      cell.innerHTML = "";
      let inCell = unitsInCells[i][j];
      if (inCell != undefined) {
        if (inCell[4].length > 0) {
          const cellDiv = document.createElement("div");
          const innerCell = document.createElement("div");
          cellDiv.className = "king";
          const king = inCell[4][0];
          innerCell.innerText = king.pId;
          innerCell.title = JSON.stringify(king);
          innerCell.className = "player-" + king.pId;
          cellDiv.appendChild(innerCell);
          cell.appendChild(cellDiv);
        }
        if (inCell.some((value, index) => index < 4 && value.length > 0)) {
          const cellDiv = document.createElement("div");
          cellDiv.className = "units";
          for (let k = 0; k < 4; k++) {
            const innerCell = document.createElement("div");
            if (inCell[k].length > 0) {
              const allSpellsTypeIds = new Set();
              for (const unit of inCell[k]) {
                const spellsOnUnit = spellsOnUnits[unit.id];
                if (spellsOnUnit != undefined) {
                  unit.spells = spellsOnUnit;
                  for (const spell of spellsOnUnit)
                    allSpellsTypeIds.add(spell.typeId);
                }

                if (unit.id.toString() in attacks)
                  unit.attackTargets = attacks[unit.id.toString()]
              }
              for (const spellTypeId of allSpellsTypeIds)
                innerCell.classList.add("spell", `spell-${spellTypeId}`);

              innerCell.title = JSON.stringify(inCell[k], null, 2);
              innerCell.innerText = inCell[k].length;
              innerCell.classList.add("player-" + k);
            }
            cellDiv.appendChild(innerCell);
          }
          cell.appendChild(cellDiv);
        }
      }
      cell = cell.nextSibling;
    }
    row = row.nextSibling;
  }
}

let currentTurnIndex = -1;
let currentTurn = undefined;
function showNextTurn() {
  viewTurn(++currentTurnIndex);
  currentTurn = graphicLog.turns[currentTurnIndex];
  document.getElementById("turn-num").innerText = currentTurn.turnNum;
}

function showPreviousTurn() {
  viewTurn(--currentTurnIndex);
  currentTurn = graphicLog.turns[currentTurnIndex];
  document.getElementById("turn-num").innerText = currentTurn.turnNum;
}

function handleFiles(files) {
  const reader = new FileReader();
  reader.onload = function (e) {
    loadLog(JSON.parse(e.target.result));
  };
  reader.readAsText(files[0]);
}
