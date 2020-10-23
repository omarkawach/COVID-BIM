# COVID-BIM

To run the app, clone the repository and run "npm install" to get the dependencies

Use your own Autodesk client credentials to run the app inside launch.json.

The csv files are too large to upload on github, If you need to run this project please email Vinu Subashini Rajus at vinu.rajus@carleton.ca

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

For the Cadmium simulator, please consult the following link: https://github.com/SimulationEverywhere/Cell-DEVS-Cadmium-Simulation-Environment

For the CO2 model, please consult the following link: https://github.com/SimulationEverywhere-Models/Cell-DEVS-CO2_spread_computer_lab

For the Indoor Virus Spread model, please consult the following link: https://github.com/SimulationEverywhere-Models/indoor_virus_spread

