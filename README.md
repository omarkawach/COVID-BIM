# COVID-BIM

To run the app, clone the repository and run "npm install" to get the dependencies

Use your own Autodesk client credentials to run the app inside launch.json.

The csv files are too large to upload on github, If you need to run this project please email Vinu Subashini Rajus at vinu.rajus@carleton.ca

## Getting Started

#### Decide what you want to see 

In the index.html, you will need to comment out the script you aren't interested in. 

- boxGeometry.js
  - For running C02 simulation model
  - Requires data/boxGeometry_readData.js for reading CSV
- mixedGroup.js
  - For running virus particle spread model 
  - Requires data/mixedGroup_readData.js for reading CSV


## CO2 Simulation Model 

```<script src="./data/boxGeometry_readData.js"></script>```
```<script src="./js/boxGeometry.js"></script>```

## Virus Particle Spreader Model

```<script src="./data/mixedGroup_readData.js"></script>```
```<script src="./js/mixedGroup.js"></script> ```

## Important Links

[Cadmium simulator](https://github.com/SimulationEverywhere/Cell-DEVS-Cadmium-Simulation-Environment)

[CO2 model](https://github.com/SimulationEverywhere-Models/Cell-DEVS-CO2_spread_computer_lab)

[Indoor Virus Spread model](https://github.com/SimulationEverywhere-Models/indoor_virus_spread
)
