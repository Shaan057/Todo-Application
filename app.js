const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

var { format, isMatch } = require("date-fns");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Returns Query

let errorMessage1;
let errorStatus1;

let getQuery = (object) => {
  const { id, todo, status, priority, category, search_q } = object;
  let getToDoQuery;
  if (
    status !== undefined &&
    priority === undefined &&
    search_q === undefined &&
    category === undefined
  ) {
    let b = status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE";
    if (b) {
      errorStatus1 = 400;
      errorMessage1 = "Invalid Todo Status";
    } else {
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    status = '${status}'
    ORDER BY
    id;`;
    }
  } else if (
    status === undefined &&
    priority !== undefined &&
    search_q === undefined &&
    category === undefined
  ) {
    let b1 = priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW";
    if (b1) {
      errorStatus1 = 400;
      errorMessage1 = "Invalid Todo Priority";
    } else {
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    priority = '${priority}'
    ORDER BY
    id;`;
    }
  } else if (
    status !== undefined &&
    priority !== undefined &&
    search_q === undefined &&
    category === undefined
  ) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      errorMessage1 = "Invalid Todo Status";
      errorStatus1 = 400;
    } else if (
      priority !== "HIGH" &&
      priority !== "MEDIUM" &&
      priority !== "LOW"
    ) {
      errorMessage1 = "Invalid Todo Priority";
      errorStatus1 = 400;
    } else {
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    (status = '${status}') AND
    (priority = '${priority}')
    ORDER BY
    id;`;
    }
  } else if (
    status === undefined &&
    priority === undefined &&
    search_q !== undefined &&
    category === undefined
  ) {
    getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    todo LIKE '%${search_q}%'
    ORDER BY
    id;`;
  } else if (
    status !== undefined &&
    priority === undefined &&
    search_q === undefined &&
    category !== undefined
  ) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      errorMessage1 = "Invalid Todo Category";
      errorStatus1 = 400;
    } else if (
      status !== "TO DO" &&
      status !== "IN PROGRESS" &&
      status !== "DONE"
    ) {
      errorStatus1 = 400;
      errorMessage1 = "Invalid Todo Status";
    } else {
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    category = '${category}' AND
    status = '${status}'
    ORDER BY
    id;`;
    }
  } else if (
    status === undefined &&
    priority === undefined &&
    search_q === undefined &&
    category !== undefined
  ) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      errorStatus1 = 400;
      errorMessage1 = "Invalid Todo Category";
    } else {
      getToDoQuery = `
        SELECT *
        FROM todo
        WHERE
        category = '${category}'
        ORDER BY
        id;`;
    }
  } else if (
    status === undefined &&
    priority !== undefined &&
    search_q === undefined &&
    category !== undefined
  ) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      errorStatus1 = 400;
      errorMessage1 = "Invalid Todo Category";
    } else if (
      priority !== "HIGH" &&
      priority !== "MEDIUM" &&
      priority !== "LOW"
    ) {
      errorStatus1 = 400;
      errorMessage1 = "Invalid Todo Status";
    } else {
      getToDoQuery = `
    SELECT *
    FROM todo
    WHERE
    category = '${category}' and
    priority = '${priority}'
    ORDER BY
    id;`;
    }
  }

  //   console.log(getToDoQuery);
  return getToDoQuery;
};

const getCamelCase = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

//Returns a list of all todos whose status is 'TO DO'

app.get("/todos/", async (request, response) => {
  const getToDoQuery = await getQuery(request.query);
  if (getToDoQuery !== undefined) {
    const toDo = await db.all(getToDoQuery);
    // console.log(typeof toDo);
    response.send(toDo.map((each) => getCamelCase(each)));
    // console.log(typeof response);
  } else {
    response.status(errorStatus1);
    response.send(errorMessage1);
  }
});

//Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoByIdQuery = `
SELECT * FROM todo
WHERE id = ${todoId};`;
  const todo = await db.get(getTodoByIdQuery);
  //   console.log(typeof request);
  //   console.log(typeof response);
  response.send(getCamelCase(todo));
});

//GET Agenda
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let isValidDate = isMatch(date, "yyyy-MM-dd");
  if (isValidDate === false) {
    response.status(400);
    // console.log(false, date);
    response.send("Invalid Due Date");
  } else {
    var getDate = format(new Date(date), "yyyy-MM-dd");
    // console.log(true, date, getDate);
    const getAgendaQuery = `SELECT * FROM todo
    WHERE due_date = '${getDate}';`;
    const agendaList = await db.all(getAgendaQuery);
    response.send(agendaList.map((each) => getCamelCase(each)));
  }
});

//Create a todo in the todo table

app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  let isValidDate = isMatch(dueDate, "yyyy-MM-dd");
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValidDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    var result = format(new Date(dueDate), "yyyy-MM-dd");
    dueDate = result;
    const postTodoDetailsQuery = `
  INSERT INTO todo (id,todo,priority,status,category, due_Date)
  VALUES (
      ${id},
      '${todo}',
      '${priority}',
      '${status}',
      '${category}',
      '${dueDate}'
  );`;
    await db.run(postTodoDetailsQuery);
    response.send("Todo Successfully Added");
  }
});

//Returns path parameters
let pathParameters = (object, todoId) => {
  let [key] = Object.keys(object);
  let value = object[key];
  let parameter = "";

  switch (key) {
    case `status`:
      if (value === "TO DO" || value === "IN PROGRESS" || value === "DONE") {
        responseMessage = "Status Updated";
        parameter = `status`;
      } else {
        responseMessage = "Invalid Todo Status";
        return undefined;
      }
      break;

    case `priority`:
      if (value === "HIGH" || value === "MEDIUM" || value === "LOW") {
        responseMessage = "Priority Updated";
        parameter = `priority`;
      } else {
        responseMessage = "Invalid Todo Priority";
        return undefined;
      }

      break;
    case `todo`:
      responseMessage = "Todo Updated";
      parameter = `todo`;
      break;

    case `category`:
      if (value === "WORK" || value === "HOME" || value === "LEARNING") {
        responseMessage = "Category Updated";
        parameter = `category`;
      } else {
        responseMessage = "Invalid Todo Category";
        return undefined;
      }
      break;
    case `dueDate`:
      //   console.log(typeof value);
      let isValidDate = isMatch(value, "yyyy-MM-dd");
      if (isValidDate) {
        var result = format(new Date(value), "yyyy-MM-dd");
        value = result;
        // console.log("req", result);
        responseMessage = "Due Date Updated";
        parameter = "due_date";
      } else {
        responseMessage = "Invalid Due Date";
        return undefined;
      }

      break;
    default:
      break;
  }
  let updateDetailsQuery = `UPDATE todo SET
            ${parameter} = '${value}'
                WHERE id = ${todoId};`;

  //   console.log("err", parameter);
  //   console.log(updateDetailsQuery);
  return updateDetailsQuery;
};

//Updates the details of a specific todo based on the todo ID
let responseMessage = "";
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const object = request.body;
  let result = await pathParameters(object, todoId);
  if (result === undefined) {
    response.status(400);
    response.send(responseMessage);
  } else {
    await db.run(result);
    response.send(responseMessage);
  }
});

//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
