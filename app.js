const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());

const intializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server started successfull");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
intializeServer();

let convertToObject = (stateDetails) => {
  return {
    stateId: stateDetails.state_id,
    stateName: stateDetails.state_name,
    population: stateDetails.population,
  };
};

//get all states api

app.get("/states/", async (request, response) => {
  const query = `SELECT * FROM state ORDER BY state_id;`;
  let dbResponse = await db.all(query);
  response.send(
    dbResponse.map((stateDetails) => convertToObject(stateDetails))
  );
});

//get a particular state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT * FROM state WHERE state_id=${stateId};`;
  const dbResponse = await db.get(query);
  response.send(convertToObject(dbResponse));
});

//post a district in district table

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const query = `INSERT INTO district 
  (district_name,state_id,cases,cured,active,deaths)
  VALUES (
      "${districtName}",
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
  );`;
  console.log(query);
  await db.run(query);
  response.send("District Successfully Added");
});

const convertToObjectDistrict = (details) => {
  return {
    districtId: details.district_id,
    districtName: details.district_name,
    stateId: details.state_id,
    cases: details.cases,
    cured: details.cured,
    active: details.active,
    deaths: details.deaths,
  };
};

//get a particular district

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT * FROM district WHERE district_id=${districtId};`;
  const dbResponse = await db.get(query);
  response.send(convertToObjectDistrict(dbResponse));
});

//delete a district from district table

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(query);
  response.send("District Removed");
});

//update a district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const query = `UPDATE district SET 
  district_name="${districtName}",
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE district_id=${districtId};`;
  await db.run(query);
  response.send("District Details Updated");
});

//get stats of cases and cured of a state based on state_id

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM district WHERE state_id=${stateId}
    ORDER BY state_id;`;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT DISTINCT state_name FROM state INNER JOIN 
    district ON state.state_id=district.state_id
    WHERE district.district_id=${districtId};`;
  const dbResponse = await db.get(query);
  response.send({
    stateName: dbResponse.state_name,
  });
});

module.exports = app;
