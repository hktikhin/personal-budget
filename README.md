# PERSONAL BUDGET 

## Project Overview
The purpose of this project is to build an API that allow user to 
create and manage a personal budget with Envelope Budgeting principles.

## How to use 
Before running this project, you need to install the following software:
- Node.js
- npm 
- Dependencies by using ```npm install``` command

Then, you can run this project using the following command.
```
npm run start
```

## API Endpoint 
- `/api/envelopes`
  - GET /api/envelopes :: to get an array of all envelopes.
  - POST /api/envelopes :: to create a new envelope and save it into array

    Expected body format:
    ```
    {
        "title": string,
        "budget": number,
    }
    ```
  - POST /api/envelopes/extract/:envelopeID :: to extract money from an envelope

    Expected body format:
    ```
    {
        "transactionAmount": number
    }
    ```
  - POST /api/envelopes/transfer/:fromEnvelopeID/:toEnvelopeID:: to trasfer money from an envelope to another one

    Expected body format:
    ```
    {
        "transactionAmount": number
    }
    ```
  - GET /api/envelopes/:envelopeID to get a single envelope by id.
  - PUT /api/envelopes/:envelopeID to update a single envelope by id.
  
    Expected body format:
    ```
    {   
        "id": number,
        "title": string,
        "budget": number,
    }
    ```
  - DELETE /api/envelopes/:envelopeID to delete a single envelope by id.