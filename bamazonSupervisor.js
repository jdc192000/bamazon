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
                choices: ["View Product Sales by Department", "Create New Department", "Exit"],
                name: "option"
            }
        ])
        .then(function (answer) {

            var option = answer.option;

            switch (option) {

                case "View Product Sales by Department":
                    viewProductSales();
                    break;

                case "Create New Department":
                    addNewDepartment();
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

function viewProductSales() {
    clear();
    var sql1 = "DROP TEMPORARY TABLE IF EXISTS products_temp; ";

    var sql2 = "CREATE TEMPORARY TABLE products_temp AS ";
    sql2 += "SELECT *, SUM(product_sales) AS product_sales_sum ";
    sql2 += "FROM products GROUP BY department_name; ";
    
    var sql3 = "SELECT a.item_id, a.department_name, a.over_head_costs, b.product_sales_sum AS product_sales, ";
    sql3 += "SUM(b.product_sales_sum - a.over_head_costs) AS 'total_profits' ";
    sql3 += "FROM departments a LEFT JOIN products_temp b ";
    sql3 += "ON (a.department_name = b.department_name) ";
    sql3 += "GROUP BY a.department_name ";
    sql3 += "ORDER BY a.item_id;";

    connection.query(sql1, function (err, results) {
        // if (err) throw err;
        if (err) {
            console.log(err);
            throw err;
        }

        connection.query(sql2, function (err, results) {
            // if (err) throw err;
            if (err) {
                console.log(err);
                throw err;
            }

            connection.query(sql3, function (err, results) {
                // if (err) throw err;
                if (err) {
                    console.log(err);
                    throw err;
                }
                var columns = columnify(results, {
                    // columns: ['item_id', 'product_name', 'price'],
                    columnSplitter: ' | ',
                    config: {
                        item_id: {
                            headingTransform: function () {
                                return "DEPARTMENT #"
                            }
                        }
                    }
                })
                console.log("\n" + columns + "\n\n");

                mainMenu();
            });
        });
    });

}


function addNewDepartment() {
    clear();

    inquirer
        .prompt([
            {
                name: "department",
                type: "input",
                message: "Enter new department name:",
                validate: function validateDepartment(name) {
                    return name !== '';
                }
            }
        ])
        .then(function (answer) {
            connection.query(
                "insert into departments (department_name) values (?)", [answer.department], function (err) {
                    // if (err) throw err;
                    if (err) {
                        if (err.errno === 1062) {
                            console.log(answer.department + " already exists");
                            setTimeout(addNewDepartment, 1000 * 5);
                        } else {
                            throw err;
                        }
                    } else {
                        // clear();
                        console.log("New department added!");

                        setTimeout(function () {
                            clear();
                            mainMenu();
                        }, 1000 * 5);
                    };
                });
        });
}
