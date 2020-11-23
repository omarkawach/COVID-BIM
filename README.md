# COVID-BIM-V2

The CSV files are too large to upload on github, if you need to run this project please email Dr. Vinu Subashini Rajus at vinu.rajus@carleton.ca

## TODO

Fix the issue where this branch only works on MacOS

Save ```state_change.csv``` to ```public/data``` automatically after running Python script?

## Getting Started

###### Clone the repository

###### Get dependencies

```npm install```

```npm i -S fast-csv```

```npm install csv-split-stream```

###### Make a Forge Account 

[Autodesk Forge](https://forge.autodesk.com/)

###### Use Forge Credentials to Run the Application

See ```launch.json``` in the ```.vscode``` folder. Enter your client ID and secret there. 

###### Convert Simulation Results to CSV

Place your ```state.txt``` file into the ```scripts``` folder, then cd into the ```scripts``` folder and run the following command in terminal: 

```cat state.txt | python state_txt_to_csv-VCP.py```

This will output ```state_change.csv```

###### Create Folder(s) for Simulation Data

Create a folder in ```public``` called ```data``` and store your ```state_change.csv``` there. Next, create a folder in the ```data``` folder called ```output```. This is where the split CSVs will be stored.


## Important Links

[Cadmium simulator](https://github.com/SimulationEverywhere/Cell-DEVS-Cadmium-Simulation-Environment)

[CO2 model](https://github.com/SimulationEverywhere-Models/Cell-DEVS-CO2_spread_computer_lab)

[Indoor Virus Spread model](https://github.com/SimulationEverywhere-Models/indoor_virus_spread)

### Resources

[Graphics reference for shaders](http://what-when-how.com/Tutorial/topic-1779u1aung/Three-js-277.html) - Explains types of qualifiers (uniform, varying, etc.)

[3D Markup with icons and info-Card](https://forge.autodesk.com/blog/3d-markup-icons-and-info-card) - Discusses spritesheets and clickable geometries

[Using PointCloud in Forge Viewer](https://forge.autodesk.com/blog/using-pointcloud-forge-viewer) - Uses three.js (r71)

[Fast-CSV](https://c2fo.io/fast-csv/) - CSV Parser and Formatter

[csv-split-stream](https://www.npmjs.com/package/csv-split-stream) - Split a CSV read stream into multiple write streams
