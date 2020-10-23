# COVID-BIM

To run the app, clone the repository and run "npm install" to get the dependencies

Use your own Autodesk client credentials to run the app inside launch.json.

JS Files...
1) boxGeometry.js
2) mixedGroup.js

READ DATA...
1) data/boxGeometry_readData.js
2) data/mixedGroup_readData.js

INDEX.HTML FILE...
   NOTE: USE ONE JS AT A TIME(COMMENT THE OTHER in index.html)

   TO RUN THE CO2 SIMULATION MODEL

    <script src="./data/boxGeometry_readData.js"></script>
    <script src="./js/boxGeometry.js"></script> 

   TO RUN THE VIRUS PARTICLE SPREADER MODEL

    <script src="./data/mixedGroup_readData.js"></script>
    <script src="./js/mixedGroup.js"></script> 

