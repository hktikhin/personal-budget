# PERSONAL BUDGET 

## Project Overview
The purpose of this project is to build an API that allow user to 
create and manage a personal budget with Envelope Budgeting principles.

## How to use 
Before running this project, you need to install the following software:
- Node.js
- npm 
- Dependencies by using ```npm install``` command

You may also need to install [PostgreSQL](https://www.postgresql.org/download/) and create tables using the 
command from `sql-statement/create-table.sql`. 

As for the database connection, you need to create a `.env` file on root folder and provide the following infomation:

```
PGUSER="youruser" 
PGHOST="yourhost"
PGPASSWORD="yourpassword" 
PGDATABASE="yourdatabase"
PGPORT=5432 
```

Then, you can run this project using the following command.
```
npm run start
```

## API Endpoint 

I use [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) to host the documentation of the API. 

You can go to `localhost:3000/docs` to view the documentation after running the app.


