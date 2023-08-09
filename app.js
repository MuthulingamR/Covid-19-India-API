const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBServerObjectToResponseObject1 = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDBServerObjectToResponseObject2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDBServerObjectToResponseObject3 = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};

// Get States Details API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * 
    FROM state
    ORDER BY state_id;`;
  const stateArray = await db.all(getStatesQuery);
  response.send(
    stateArray.map((eachObject) =>
      convertDBServerObjectToResponseObject1(eachObject)
    )
  );
});

//Get State Details API
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDBServerObjectToResponseObject1(state));
});

//Post District Details API
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
  const addDistrictDetails = `
    INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
        VALUES (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );`;
  await db.run(addDistrictDetails);
  response.send("District Successfully Added");
});

//Get District Details API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * 
    FROM district
    WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDBServerObjectToResponseObject2(district));
});

//Get Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const DeleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;
  await db.run(DeleteDistrictQuery);
  response.send("District Removed");
});

//Update District Details
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
  const updateDistrictQuery = `
  UPDATE district
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// Get Total cases API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalCaseDetailsOfState = `
    SELECT 
    SUM(cases) AS cases,
    SUM(cured) AS cured,
    SUM(active) AS active,
    SUM(deaths) As deaths
    FROM district
    WHERE state_id = ${stateId};`;
  const details = await db.get(getTotalCaseDetailsOfState);
  response.send(convertDBServerObjectToResponseObject3(details));
});

//Get StateName API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT state_name
    FROM state INNER JOIN district 
    ON state.state_id = district.state_id
    WHERE district_id = ${districtId};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(convertDBServerObjectToResponseObject1(stateName));
});

module.exports = app;
