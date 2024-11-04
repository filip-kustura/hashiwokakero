$(document).ready(function(){
    let nameSelect = $('#puzzle-select');

    for (let i = 0; i < puzzle.length; ++i) {
        let option = $('<option>')
            .attr('value', i)
            .html(puzzle[i].name);
        nameSelect.append(option);
    }

    $('#puzzle-select').on('click', removeWarningMessage);
    $('#start-button').on('click', startGame);
});

let p, board, invalidlyClickedRow, invalidlyClickedCol;

/**
 * Starts the game by drawing an HTML table and a div with radio buttons.
 */
function startGame() {
    p = puzzle[$('#puzzle-select').val()];
    p.island_cnt = new Array(p.island_num.length).fill(0); // Array that will store the number of bridges that are connected to each island
    p.island_equ = new Array(p.island_num.length).fill(false); // Array that will store whether the number of bridges that are connected to an island match the number on that island
    
    $('div').html('');
    boardInitialized = false;
    invalidlyClickedRow = invalidlyClickedCol = undefined;
    removeWarningMessage();
    detectGameEnding(); // Deletes the 'congratulations' message if it is present
    displayTable();
    displayBridgeSelectionDiv();
}

/**
 * Checks if there is an island at the given coordinates (row, col).
 * If yes, returns the number of bridges that should eventually be connected to that island.
 * Otherwise, returns null.
 */
function checkForIsland(row, col) {
    let size = p.island_num.length;
    let island_row = p.island_row;
    let island_col = p.island_col;
    for (let i = 0; i < size; ++i) {
        if (island_row[i] !== row + 1) {
            continue;
        } else {
            if (island_col[i] === col + 1)
                return p.island_num[i];
        }
    }

    return null;
}

/**
 * Draws an HTML table with the state of the game.
 * Initializes the grid (HTML table) in a separate array if it is not already there.
 */
function displayTable() {
    $('#table').html('');

    let table = $('<table>');
    board = new Array();
    
    let size = p.size;
    for (let row = 0; row < size; ++row) {
        let tr = $('<tr>');
        let boardRow = new Array();

        for (let col = 0; col < size; ++col) {
            let td = $('<td>');

            let numberOfBridges = checkForIsland(row, col);
            if (numberOfBridges !== null) {
                td.html(numberOfBridges);
                boardRow.push(numberOfBridges);
            } else {
                td.on('click', function() {
                    drawBridgeIfPossible(row, col);
                });
                boardRow.push('');
            }
            
            tr.append(td);
        }

        table.append(tr);
        board.push(boardRow);
    }

    table.on('contextmenu', function() { return false; } );
    $('#table').append(table);
}

/**
 * Draws a div with radio buttons to select the bridge type.
 */
function displayBridgeSelectionDiv() {
    let bridgeSelectionDiv = $('#bridge-selection');
    bridgeSelectionDiv.html('Select the bridge type:').append($('<br>'));
    
    let radio, label;

    radio = $('<input>')
        .attr({
            'type': 'radio',
            'name': 'bridge',
            'id': 'single-horizontal',
            'value': 'single-horizontal',
        })
        .on('click', removeWarningMessage);
    label = $('<label>').attr('for', 'single-horizontal').html('-');
    bridgeSelectionDiv.append(radio).append(label).append($('<br>'));

    radio = $('<input>')
        .attr({
            'type': 'radio',
            'name': 'bridge',
            'id': 'double-horizontal',
            'value': 'double-horizontal',
        })
        .on('click', removeWarningMessage);
    label = $('<label>').attr('for', 'double-horizontal').html('=');
    bridgeSelectionDiv.append(radio).append(label).append($('<br>'));

    radio = $('<input>')
        .attr({
            'type': 'radio',
            'name': 'bridge',
            'id': 'single-vertical',
            'value': 'single-vertical',
        })
        .on('click', removeWarningMessage);
    label = $('<label>').attr('for', 'single-vertical').html('|');
    bridgeSelectionDiv.append(radio).append(label).append($('<br>'));

    radio = $('<input>')
        .attr({
            'type': 'radio',
            'name': 'bridge',
            'id': 'double-vertical',
            'value': 'double-vertical',
        })
        .on('click', removeWarningMessage);
    label = $('<label>').attr('for', 'double-vertical').html('||');
    bridgeSelectionDiv.append(radio).append(label).append($('<br>'));
}

/**
 * If possible, it draws the selected bridge through the coordinates (row, col).
 */
function drawBridgeIfPossible(row, col) {
    if (invalidlyClickedRow !== undefined && invalidlyClickedCol !== undefined) {
        let invalidlyClickedTableCell = $('table tr:eq(' + invalidlyClickedRow + ') td:eq(' + invalidlyClickedCol + ')');
        invalidlyClickedTableCell.css('background-color', '#f2f2f2');
    }
    let clickedTableCell = $('table tr:eq(' + row + ') td:eq(' + col + ')'); // The clicked cell
    
    removeWarningMessage(); // Delete the residual warning message if it is present

    let selectedBridgeType = $("input[name='bridge']:checked").val();
    if (selectedBridgeType === undefined) { // The bridge type not selected
        displayWarningMessage('The bridge type is not selected!');
        return;
    }
    
    let islandsCoordinates = isBridgeValid(row, col);
    // Is the selected bridge allowed at this location?
    if (islandsCoordinates === null) { // The selected bridge is not allowed in this place, print the corresponding warning message if it is not already present
        if (!$('#warning-paragraph').length) // There is no warning message
            displayWarningMessage('It is <b>not</b> possible to construct the selected bridge type through this cell!');

            clickedTableCell.css('background-color', 'rgb(255, 200, 200)');

        invalidlyClickedRow = row;
        invalidlyClickedCol = col;
        
        return;
    }

    drawBridge(islandsCoordinates[0], islandsCoordinates[1]);
}

/**
 * Returns the coordinates of the islands if the selected bridge through coordinates (row, col) is allowed, otherwise it returns null.
 */
function isBridgeValid(row, col) {
    let selectedBridgeType = $("input[name='bridge']:checked").val();
    let bridgeDirection = selectedBridgeType.split('-')[1]; // horizontal/vertical

    let firstIslandFound = secondIslandFound = false;
    let islandsCoordinates = new Array();
    let puzzleSize = p.size;
    if (bridgeDirection === 'horizontal') {
        // Look for an available island to the left of the clicked cell
        for (let j = col - 1; j > -1; --j) {
            if (['|', '||'].includes(board[row][j])) // A bridge has been found so the construction of a new bridge is not allowed in this row
                break;
            
            if (typeof(board[row][j]) === 'number') { // An available island is found to the left of the clicked cell
                firstIslandFound = true;
                islandsCoordinates.push(new Array(row, j));
                break;
            }
        }

        // Look for an available island to the right of the clicked cell
        for (let j = col + 1; j < puzzleSize; ++j) {
            if (['|', '||'].includes(board[row][j])) // A bridge has been found so the construction of a new bridge is not allowed in this row
                break;
            
            if (typeof(board[row][j]) === 'number') { // An available island is found to the right of the clicked cell
                secondIslandFound = true;
                islandsCoordinates.push(new Array(row, j));
                break;
            }
        }
    } else { // bridgeDirection === 'vertical'
        // Look for an available island above the clicked cell
        for (let i = row - 1; i > -1; --i) {
            if (['-', '='].includes(board[i][col])) // A bridge has been found so the construction of a new bridge is not allowed in this column
                break;
            
            if (typeof(board[i][col]) === 'number') { // An available island is found above the clicked cell
                firstIslandFound = true;
                islandsCoordinates.push(new Array(i, col));
                break;
            }
        }

        // Look for an available island under the clicked cell
        for (let i = row + 1; i < puzzleSize; ++i) {
            if (['-', '='].includes(board[i][col])) // A bridge has been found so the construction of a new bridge is not allowed in this column
                break;
            
            if (typeof(board[i][col]) === 'number') { // An available island is found below the clicked cell
                secondIslandFound = true;
                islandsCoordinates.push(new Array(i, col));
                break;
            }
        }
    }

    if (firstIslandFound && secondIslandFound)
        return islandsCoordinates;
    else
        return null;
}

/**
 * Draws a bridge connecting the islands with the passed coordinates.
 */
function drawBridge(firstIsland, secondIsland) {
    let selectedBridgeType = $("input[name='bridge']:checked").val();
    let bridgeQuantity = selectedBridgeType.split('-')[0]; // single/double
    let bridgeDirection = selectedBridgeType.split('-')[1]; // horizontal/vertical

    let bridgeLabel;
    let firstIslandIndex = getIslandIndex(firstIsland), secondIslandIndex = getIslandIndex(secondIsland);
    if (bridgeDirection === 'horizontal') {
        if (bridgeQuantity === 'single') {
            bridgeLabel = '-';
            increaseBridgeCount(firstIslandIndex, secondIslandIndex, 1);
        } else { // bridgeQuantity === 'double'
            bridgeLabel = '='
            increaseBridgeCount(firstIslandIndex, secondIslandIndex, 2);
        }

        let startingCoordinate = firstIsland[1] + 1, endingCoordinate = secondIsland[1] - 1;
        let row = firstIsland[0];
        for (let j = startingCoordinate; j <= endingCoordinate; ++j) {
            board[row][j] = bridgeLabel;

            let tableCell = $('table tr:eq(' + row + ') td:eq(' + j + ')');
            tableCell.off('click');
            tableCell.html(bridgeLabel);
            tableCell.on('contextmenu', function() {
                deleteBridge(firstIsland, secondIsland);
                removeWarningMessage();
            });
        }
    } else { // bridgeDirection === 'vertical'
        if (bridgeQuantity === 'single') {
            bridgeLabel = '|';
            increaseBridgeCount(firstIslandIndex, secondIslandIndex, 1);
        } else { // bridgeQuantity === 'double'
            bridgeLabel = '||';
            increaseBridgeCount(firstIslandIndex, secondIslandIndex, 2);
        }

        let startingCoordinate = firstIsland[0] + 1, endingCoordinate = secondIsland[0] - 1;
        let col = firstIsland[1];
        for (let i = startingCoordinate; i <= endingCoordinate; ++i) {
            board[i][col] = bridgeLabel;

            let tableCell = $('table tr:eq(' + i + ') td:eq(' + col + ')');
            tableCell.off('click');
            tableCell.html(bridgeLabel);
            tableCell.on('contextmenu', function() {
                deleteBridge(firstIsland, secondIsland);
                removeWarningMessage();
            });
        }
    }

    compareNumberOfBridges(firstIslandIndex);
    compareNumberOfBridges(secondIslandIndex);
}

/**
 * Displays a warning message in the form of a paragraph with red text.
 */
function displayWarningMessage(message) {
    let warningParagraph = $('<p>')
        .attr('id', 'warning-paragraph')
        .html(message)
        .css('color', 'red');
    $('body').append(warningParagraph); 
}

/**
 * Deletes the warning message if it is present.
 */
function removeWarningMessage() {
    if ($('#warning-paragraph').length) // The warning message is present
        $('#warning-paragraph').remove();

    if (invalidlyClickedRow !== undefined && invalidlyClickedCol !== undefined) {
        let invalidlyClickedTableCell = $('table tr:eq(' + invalidlyClickedRow + ') td:eq(' + invalidlyClickedCol + ')');
        invalidlyClickedTableCell.css('background-color', '#f2f2f2');
    }
}

/**
 * Deletes the entire bridge between the islands with the coordinates firstIsland and secondIsland.
 */
function deleteBridge(firstIsland, secondIsland) {
    let firstIslandIndex = getIslandIndex(firstIsland), secondIslandIndex = getIslandIndex(secondIsland);

    if (firstIsland[0] === secondIsland[0]) { // It is a horizontal bridge
        let startingCoordinate = firstIsland[1] + 1, endingCoordinate = secondIsland[1] - 1;
        let row = firstIsland[0];
        
        let bridgeType = board[row][startingCoordinate];
        if (bridgeType === '-')
            decreaseBridgeCount(firstIslandIndex, secondIslandIndex, 1);
        else // bridgeType === '='
            decreaseBridgeCount(firstIslandIndex, secondIslandIndex, 2);
        
        for (let j = startingCoordinate; j <= endingCoordinate; ++j) {
            board[row][j] = '';

            let tableCell = $('table tr:eq(' + row + ') td:eq(' + j + ')');
            tableCell.off('contextmenu');
            tableCell.html('');
            tableCell.on('click', function() {
                drawBridgeIfPossible(row, j);
            });
        }
    } else { // It is a vertical bridge
        let startingCoordinate = firstIsland[0] + 1, endingCoordinate = secondIsland[0] - 1;
        let col = firstIsland[1];

        let bridgeType = board[startingCoordinate][col];
        if (bridgeType === '|')
            decreaseBridgeCount(firstIslandIndex, secondIslandIndex, 1);
        else // bridgeType === '='
            decreaseBridgeCount(firstIslandIndex, secondIslandIndex, 2);

        for (let i = startingCoordinate; i <= endingCoordinate; ++i) {
            board[i][col] = '';

            let tableCell = $('table tr:eq(' + i + ') td:eq(' + col + ')');
            tableCell.off('contextmenu');
            tableCell.html('');
            tableCell.on('click', function() {
                drawBridgeIfPossible(i, col);
            });
        }
    }

    compareNumberOfBridges(firstIslandIndex);
    compareNumberOfBridges(secondIslandIndex);
}

/**
 * Compares the number of bridges connected to the island with the number on that island.
 * According to the result of the comparison, sets the background color of the island if necessary.
 */
function compareNumberOfBridges(islandIndex) {
    if (p.island_cnt[islandIndex] === p.island_num[islandIndex]) {
        p.island_equ[islandIndex] = true; // The number of bridges connected to the island with the given index matches the number on that island
        
        let row = p.island_row[islandIndex];
        let col = p.island_col[islandIndex];

        let tableCell = $('table tr:eq(' + (row - 1) + ') td:eq(' + (col - 1) + ')'); // A cell containing the given island with index islandIndex
        tableCell.css('background-color', 'rgb(200, 255, 200)');
    } else { // p.island_cnt[islandIndex] !== p.island_num[islandIndex]
        p.island_equ[islandIndex] = false; // The number of bridges connected to the island with the given index don't match the number on that island

        let row = p.island_row[islandIndex];
        let col = p.island_col[islandIndex];

        let tableCell = $('table tr:eq(' + (row - 1) + ') td:eq(' + (col - 1) + ')'); // A cell containing the given island with index islandIndex
        tableCell.css('background-color', '#f2f2f2');
    }

    detectGameEnding();
}

/**
 * Returns the index of the island with coordinates islandCoordinates.
 */
function getIslandIndex(islandCoordinates) {
    let row = islandCoordinates[0], col = islandCoordinates[1]
    let size = p.island_num.length;
    let island_row = p.island_row;
    let island_col = p.island_col;
    for (let i = 0; i < size; ++i) {
        if (island_row[i] !== row + 1) {
            continue;
        } else {
            if (island_col[i] === col + 1)
                return i;
        }
    }

    throw new Error('Island with coordinates (' + row + ', ' + col + ') not found!');
}

/**
 * In the designated array, increases the number of bridges connected to the islands with the given indices.
 */
function increaseBridgeCount(firstIslandIndex, secondIslandIndex, numberOfBridges) {
    p.island_cnt[firstIslandIndex] += numberOfBridges;
    p.island_cnt[secondIslandIndex] += numberOfBridges;
}

/**
 * In the designated array, decreases the number of bridges connected to the islands with the given indices.
 */
function decreaseBridgeCount(firstIslandIndex, secondIslandIndex, numberOfBridges) {
    p.island_cnt[firstIslandIndex] -= numberOfBridges;
    p.island_cnt[secondIslandIndex] -= numberOfBridges;
}

/**
 * Detects the successful completion of the game and displays the appropriate message.
 */
function detectGameEnding() {
    let allTrue = p.island_equ.every(value => value === true);

    if (allTrue) { // The game has ended
        if (!$('#congratulations').length) { // The 'congratulations' message is not present
            let congratulations = $('<h2>')
                .attr('id', 'congratulations')
                .html('Congratulations! You have solved the puzzle.')
                .css('color', 'green');
            $('body').append(congratulations); // Display the message
        }
    } else {
        if ($('#congratulations').length) // The 'congratulations' message is present
            $('#congratulations').remove(); // Delete the message
    }
}

console.log('hashiwokakero.js loaded')
