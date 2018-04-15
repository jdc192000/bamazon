var inquirer = require("inquirer");
var mysql = require("mysql");
var columnify = require('columnify');
var clear = require('clear');
var figlet = require('figlet');

const keys = require("./keys");
var mysqlKeys = keys.mysqlKeys;

var connection = mysql.createConnection(mysqlKeys);

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    clear();
    mainMenu();
});

function cleanExit() {
    connection.end();
    process.exit();
}

function mainMenu() {

    inquirer
        .prompt([
            {
                type: "list",
                message: "Please select an option:",
                choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Exit"],
                name: "option"
            }
        ])
        .then(function (answer) {

            var option = answer.option;
            // viewProducts();

            switch (option) {

                case "View Products for Sale":
                    viewProducts();
                    break;

                case "View Low Inventory":
                    viewLowStock();
                    break;

                case "Add to Inventory":
                    addInventory();
                    break;

                case "Add New Product":
                    addNewProduct();
                    break;

                case "Exit":
                    cleanExit();
                    break;

                default:
                    console.log("Invalid command " + command);
                    break;
            };
        })
}

function viewProducts() {
    clear();
    var dummy = '';

    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        var columns = columnify(results, {
            // columns: ['item_id', 'product_name', 'price'],
            columnSplitter: ' | ',
            config: {
                item_id: {
                    headingTransform: function () {
                        return "ITEM #"
                    }
                },
                product_name: {
                    headingTransform: function () {
                        return "PRODUCT NAME"
                    }
                },
                department_name: {
                    headingTransform: function () {
                        return "DEPARTMENT"
                    }
                },
                stock_quantity: {
                    headingTransform: function () {
                        return "AMOUNT IN STOCK"
                    }
                }
            }
        });
        console.log("\n" + columns + "\n\n");
        mainMenu();
    });
}

function viewLowStock() {
    clear();

    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function (err, results) {
        if (err) throw err;
        var columns = columnify(results, {
            // columns: ['item_id', 'product_name', 'price'],
            columnSplitter: ' | ',
            config: {
                item_id: {
                    headingTransform: function () {
                        return "ITEM #"
                    }
                },
                product_name: {
                    headingTransform: function () {
                        return "PRODUCT NAME"
                    }
                },
                department_name: {
                    headingTransform: function () {
                        return "DEPARTMENT"
                    }
                },
                stock_quantity: {
                    headingTransform: function () {
                        return "AMOUNT IN STOCK"
                    }
                }
            }
        });
        console.log("\n" + columns + "\n\n");
        mainMenu();
    });
}

function addInventory() {
    var addStock = 0;
    clear();

    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        var columns = columnify(results, {
            // columns: ['item_id', 'product_name', 'price'],
            columnSplitter: ' | ',
            config: {
                item_id: {
                    headingTransform: function () {
                        return "ITEM #"
                    }
                },
                product_name: {
                    headingTransform: function () {
                        return "PRODUCT NAME"
                    }
                },
                department_name: {
                    headingTransform: function () {
                        return "DEPARTMENT"
                    }
                },
                stock_quantity: {
                    headingTransform: function () {
                        return "AMOUNT IN STOCK"
                    }
                }
            }
        });
        console.log("\n" + columns + "\n\n");
        inquirer
            .prompt([
                {
                    name: "item",
                    type: "input",
                    message: "Which item would you like to increase the stock? (Enter 'R' to return to main menu)",
                    validate: function (value) {
                        if (isNaN(value) === false) {
                            return true;
                        } else {
                            if (value.toUpperCase() === "R") {
                                clear();
                                setTimeout(function(){mainMenu()}, 1000);
                            } else {
                                return false;
                            }
                        }
                    }
                },
                {
                    name: "amount",
                    type: "input",
                    message: "How many would you like to add?"
                }
            ])
            .then(function (answer) {
                connection.query("SELECT * FROM products where ?", [{ item_id: answer.item }], function (err, results2) {
                    if (err) throw err;

                    addStock = parseFloat(results2[0].stock_quantity) + parseFloat(answer.amount);

                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stock_quantity: addStock
                            },
                            {
                                item_id: answer.item
                            }
                        ],
                        function (err) {
                            if (err) throw err;

                            console.log("\n\n" + answer.amount + " '" + results2[0].product_name + "' added");

                            setTimeout(addInventory, 1000 * 5);
                        }
                    );
                })
            });
    });
}

function addNewProduct() {
    clear();

    // Changed code from:
    // connection.query("select distinct department_name from products", function (err, results) {
    // to the following with the implementation of bamazonSupervisor.js

    connection.query("select department_name from departments", function (err, results) {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    name: "department",
                    type: "list",
                    message: "Add product to which department?",
                    choices: function () {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].department_name);
                        }
                        return choiceArray;
                    }

                },
                {
                    name: "newDescription",
                    type: "input",
                    message: "Product description?",
                },
                {
                    name: "newPrice",
                    type: "input",
                    message: "Product price?"
                },
                {
                    name: "newStock",
                    type: "input",
                    message: "Amount in stock?"
                }
            ])
            .then(function (answer) {
                connection.query(
                    "insert into products (product_name, department_name, price, stock_quantity) values (?, ?, ?, ?)", [answer.newDescription, answer.department, answer.newPrice, answer.newStock], function (err) {
                        if (err) throw err;
                        clear();
                        console.log("New product added!");

                        setTimeout(mainMenu, 1000 * 5);
                    }
                );
            });
    });
}
