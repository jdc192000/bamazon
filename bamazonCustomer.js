var inquirer = require("inquirer");
var mysql = require("mysql");
var columnify = require('columnify');
var clear = require('clear');
var figlet = require('figlet');

const keys = require("./keys");
var mysqlKeys = keys.mysqlKeys;
var display = "";

var connection = mysql.createConnection(mysqlKeys);

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    buyProducts();
});

function buyProducts() {
    var remainingStock = 0;
    clear();

    figlet('BAMAZON', function(err, data) {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data)
    });

    connection.query("SELECT * FROM products where stock_quantity > '0'", function (err, results) {
        if (err) throw err;
        var columns = columnify(results, {
            columns: ['item_id', 'product_name', 'price'],
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
                }
            }
        });
        console.log(columns + "\n");

        inquirer
            .prompt([
                {
                    name: "item",
                    type: "input",
                    message: "Which item you would like to buy? (Enter 'X' to exit)",
                    validate: function (value) {
                        if (isNaN(value) === false) {
                            return true;
                        } else {
                            if (value.toUpperCase() === "X") {
                                cleanExit();
                            } else {
                                return false;
                            }
                        }
                    }
                },
                {
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to buy?"
                }
            ])
            .then(function (answer) {


                connection.query("SELECT * FROM products where ?", [{ item_id: answer.item }], function (err, results2) {
                    if (err) throw err;

                    remainingStock = results2[0].stock_quantity - answer.quantity;

                    if (remainingStock >= 0) {
                        connection.query(
                            "UPDATE products SET ? WHERE ?",
                            [
                                {
                                    stock_quantity: remainingStock
                                },
                                {
                                    item_id: answer.item
                                }
                            ],
                            function (err) {
                                if (err) throw err;

                                var purchasePrice = answer.quantity * results2[0].price;

                                console.log("\n\n" + answer.quantity + " '" + results2[0].product_name + "' bought for $" + purchasePrice.toFixed(2));

                                setTimeout(buyProducts, 1000 * 5);
                            }
                        );
                    } else {
                        console.log("\n\nOnly " + results2[0].stock_quantity + " '" + results2[0].product_name + "' in stock!");

                        setTimeout(buyProducts, 1000 * 5);
                    }
                })
            });
    });
}

function cleanExit() {
    connection.end();
    process.exit();
}
