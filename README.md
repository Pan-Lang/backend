# backend
Repository for the backend for API and MongoDB.

## Project Motivation
One of our team members currently volunteers at the Mckinley Foundation Food Pantry at the Garden Hills Elementary. He noticed that there were communication barriers between the pantry coordinator and the non-english speaking people. Our team decided to tackle this problem by creating a webapp and helping the food pantry coordinator with direct translations of stock items and common phrases/questions for multiple languages, while also keeping track of the stock of the food items.

## Tech Stack
The backend was built with:
  - [Google Cloud Translation API](https://cloud.google.com/translate/docs)
  - [Socket.io](https://socket.io/)
  - [Axios](https://github.com/axios/axios)
  - [Node.js](https://nodejs.org/en/)
  - [Express](https://expressjs.com/)
  - [MongoDB](https://www.mongodb.com/)
  - [Fast CSV](https://c2fo.io/fast-csv/)
  
  ## Features
  ![Home Screen](https://i.imgur.com/u7PRu0P.png)
  This is the Home Page of PanLang! From here, we are able to navigate to new pages that allow us to add patrons, edit stock, or download patron information.
  
  ![Order Page](https://i.imgur.com/9uHDO49.png)
  This is the Order Page of PanLang!
  
  ![Stock Page](https://i.imgur.com/FfRAhnb.png)
   This is the Stock Page of PanLang!
  
  ## Installation
  1. Make sure to have npm installed on your machine. Instructions for installing npm can be found [here](https://www.npmjs.com/get-npm).
  2. `git clone Pan-Lang` in the designated folder on your machine.
  3. `npm install` to install the project dependencies.
  4. The core component of this project makes use of the Google Cloud Translate API. If you want to use translation features, you'll have to make a new project on Google Cloud Platform and generate a new API key. Detailed instructions for this setup can be found [here](https://cloud.google.com/translate/docs/setup).
  
  

  




