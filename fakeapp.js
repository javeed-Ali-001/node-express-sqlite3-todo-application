const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Running Server at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DataBase Error is: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
// Path: /todos/
// Method: GET
// Scenario 1

// Sample API /todos/?status=TO%20DO
// Description:

// Returns a list of all todos whose status is 'TO DO'
// app.get("/todos/", async (request, response) => {
//   const { status = "TO DO" } = request.query;
//   const getTodoQuery = `
//     SELECT
//         *
//     FROM
//         todo
//     WHERE
//       status = '${status}';`;
//   const getTodoQueryArray = await db.all(getTodoQuery);
//   response.send(hasPriorityAndStatusProperties(getTodoQueryArray));
// });

// Path: /todos/
// Method: GET
// Scenario 2

// Sample API /todos/?status=TO%20DO
// Description:

// Returns a list of all todos whose priority is 'HIGH'
// app.get("/todos/", async (request, response) => {
//   const { priority = "HIGH" } = request.query;
//   const getTodoPriorityQuery = `
//     SELECT
//         *
//     FROM
//         todo
//     WHERE
//       priority = '${priority}';`;
//   const getTodoPriorityQueryResponse = await db.all(getTodoPriorityQuery);
//   response.send(getTodoPriorityQueryResponse);
// });
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//GET API 1
const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id = '${todoId}';`;
  const getTodoQueryResponse = await db.get(getTodoQuery);
  response.send(outPutResult(getTodoQueryResponse));
});

//TODO API 3
// Path: /todos/
// Method: POST
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
  todo(id, todo, priority, status)
  VALUES(
      ${id},'${todo}','${priority}','${status}'
  );`;
  const postTodoQueryResponse = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});
//TO GET ALL data in TODODb
// app.get("/todos/", async (request, response) => {
//   const { todoId } = request.params;
//   const getAllTodoQuery = `
//     SELECT
//         *
//     FROM
//         todo;`;
//   const getAllTodoQueryResponse = await db.all(getAllTodoQuery);
//   response.send(outPutResult(getAllTodoQueryResponse));
// });
//PUT TODO API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  //   console.log(requestBody);
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `
  UPDATE 
    todo
  SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  `;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});
//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
