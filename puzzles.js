/* Each element of this array describes an initial state of a puzzle: for each index `p`, `puzzle[p]` is an object with the following properties:
 * - `name`: a description of the puzzle (string);
 * - `size`: the dimension of the grid, i.e., the number of rows and columns (int);
 * - `island_row`, `island_col`, `island_num`: arrays of integers where index `j` represents:
        - the row of the grid where the `j`-th island is located,
        - the column of the grid where the `j`-th island is located,
        - the number of bridges that should eventually exit from the `j`-th island. (Rows and columns are numbered from 1 to `size`)
 */

const puzzle = [
    {
        name: "7x7 Easy",
        size: 7,
        island_row: [1, 1, 2, 2, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7],
        island_col: [2, 7, 1, 6, 1, 4, 7, 6, 1, 3, 7, 2, 4, 6],
        island_num: [2, 4, 4, 2, 6, 5, 6, 1, 3, 1, 2, 1, 4, 3]
    },
    {
        name: "10x10 Medium",
        size: 10,
        island_row: [1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 8, 8, 8, 10, 10, 10, 10, 10],
        island_col: [1, 6, 9, 3, 10, 1, 5, 8, 3, 6, 1, 8, 3, 6, 10, 8, 1, 6, 10, 1, 3, 6, 8, 10],
        island_num: [4, 4, 2, 4, 4, 4, 1, 2, 3, 1, 4, 3, 1, 2, 4, 1, 3, 4, 4, 1, 1, 3, 1, 1]
    },
];

console.log('puzzles.js loaded')
