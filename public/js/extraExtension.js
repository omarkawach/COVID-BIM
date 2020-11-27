/* 
  Author(s): 
    - Dr. Vinu Subashini Rajus
    - Omar Kawach 
    - Mitali Patel
    - Ryan Carriere
*/

/*
  Cell types:
    - AIR = -100
    - vp_SOURCE = -200
    - IMPERMEABLE_STRUCTURE = -300
    - DOOR = -400
    - TABLE = -500
    - VENTILATION = -600
    - CHAIR = -700
    - vp_RECEIVER = -800
    - INFECTED = -900 (Infected but not spreading)
*/

class MyAwesomeExtension extends Autodesk.Viewing.Extension {
  /**
   * @description Sets up visualization properties 
   * @param {*} viewer - Forge Viewer with a bunch of accessible properties
   * @param {*} options - Extensions set in ForgeViewer.js
   */
  constructor(viewer, options) {
    super(viewer, options);
    this._group = null;
    this._button = null;

    // The overview panel
    this._panel = null;
    // Tells us whether or not to start the simulation
    this._playViz = false;
    // D3 Legend whether visible or not
    this._legend = false;
    // The countdown in the overview panel
    this.time = "0:00";

    // PointCloud position properties 
    // The offsets are required for positioning

    // VSIM Lab
    // this.zaxisOffsetParticle = -4.5; 
    // this.zaxisOffsetHuman = -2;
    // this.xaxisOffset = -89.5;
    // this.yaxisOffset = -70;

    // Restaurant
    this.zaxisOffsetParticle = -2;
    this.zaxisOffsetHuman = -1;
    this.xaxisOffset = -13;
    this.yaxisOffset = -29;

    // Spritesheet
    this.texture = THREE.ImageUtils.loadTexture("../img/5_imgList.png");

    // Max number of particles in a space in our data
    // This number will need to be manually updated based on the max in the CSV
    this.maxState = 9;

    // For PointCloud colouring and D3 legend
    this.createColorScale()
  }
  
  load() {
    return true;
  }
  unload() {
    // Clean our UI elements if we added any
    if (this._group) {
      this._group.removeControl(this._button);
      if (this._group.getNumberOfControls() === 0) {
        this.viewer.toolbar.removeControl(this._group);
      }
    }
    return true;
  }

  /**
   * @description The colour scale is used for 
   * colouring the viral particles (PointClouds) 
   * and setting the D3 color legend (see the code in onToolbarCreated())
   */
  createColorScale(){
    this.colorScale = d3
      .scaleLinear()
      .domain([
        0,
        this.maxState * 0.1,
        this.maxState * 0.2,
        this.maxState * 0.3,
        this.maxState * 0.4,
        this.maxState * 0.5,
        this.maxState * 0.6,
        this.maxState * 0.7,
        this.maxState * 0.8,
        this.maxState * 0.9,
        this.maxState,
      ])
      .range([
        "#feed00",
        "#ffc801",
        "#ffb600",
        "#ffa401",
        "#ff9201",
        "#fd6d03",
        "#ff5c01",
        "#ff4900",
        "#ff3801",
        "#fc2501",
        "#fe0000",
      ]);
  }

    /**
   * @description Begins the simulation by reading simulation data 
   * (from a filepath you choose) and splits it into multiple CSVs 
   * based on the number of cells in a timestep. The data returned  
   * (csvSplitResponse) will contain the line limit and number of 
   * files created.
   */
  _beginSimulation() {
    let self = this;

    jQuery.get(
      "/api/forge/csvStreamer/streaming",
      {
        // Change the file path based on the CSV being read
        filepath: `./public/data/state_change_vent_on_same_wall.csv`,
        // What the split files will be called
        output: `state_change_split`
      },
      (csvSplitResponse) => {
        self._readCSVandRunViz(csvSplitResponse);
      }
    );
  }

  /**
   * @description Read the split CSVs one by one based on the interval settings
   * and begin rendering PointClouds to the Forge Viewer
   * @param {*} csvSplitResponse - An object {totalChunks: 3601, options: {…}}
   * where options holds {delimiter: '\n', lineLimit: 1652}
   */
  _readCSVandRunViz(csvSplitResponse){
    let self = this;

    // Set the number of files read to zero
    self.index = 0;

    var numFiles = csvSplitResponse.totalChunks; // 1 chunk is one file
    // How fast to read a file in milliseconds 
    // 1000ms is 1 second in real time, 100ms is 0.1 second in real time
    // Only use 100 or more or else you get errors
    var time = 100; 
    // Try multiplying by tens (1, 10, 100, etc.)
    // Ex. When speed = 10 then every 10th file is read
    var speed = 10

    self.realTime = (1000 * numFiles - 1000) / (speed);
    
    var interval = setInterval(() => {
      var file =
        `./public/data/output/state_change_split-` + self.index + ".csv";

      jQuery.get(
        "/api/forge/csvStreamer/reading",
        {
          filepath: file,
        },
        (data) => {
          self.data = data;
          self._getViz();

          // Exit if we've reached the max files to read or 
          // if the user has reset the visualization 
          if (self.index == numFiles - 1 || self._playViz == false) { 
            clearInterval(interval); 
          }

          self.index += speed;
          self._updateCountdown();
          self.realTime -= 1000;
        }
      );
    }, time);      
  }

  /**
   * @description If we're reading our first file, then generate
   * the PointClouds and add them to the Forge Viewer scene. 
   * Else update the existing PointClouds in the scene
   */
  _getViz() {
    if (this.index == 0) {
      this._renderCloud();
      
    } else {
      this._updatePointClouds();
    }
  }

  /**
   * @description Find the number of points needed for the visualization
   * and add PointClouds to scene / overlay of the Forge Viewer. For 
   * this visualization, humans and viral particles exist in their own
   * PointCloud.
   */
  _renderCloud() {
    // Row with the highest x coordinate value
    const maxRowX = this.data.reduce(function (prev, current) {
      return prev.x > current.x ? prev : current;
    });

    // // Row with the highest y coordinate value
    const maxRowY = this.data.reduce(function (prev, current) {
      return prev.y > current.y ? prev : current;
    });

    this.maxX = maxRowX.x + 1;
    this.maxY = maxRowY.y + 1;

    this.numPoints = this.maxX * this.maxY;

    this.pointsParticle = new THREE.PointCloud(
      this._generateGeometry(this.zaxisOffsetParticle, 0), 
      this._generateShaderMaterial(40, true)
      );
    this.viewer.impl.createOverlayScene("particles");
    this.viewer.impl.addOverlay("particles", this.pointsParticle);

    this.pointsHuman = new THREE.PointCloud(
      this._generateGeometry(this.zaxisOffsetHuman, 2), 
      this._generateShaderMaterial(70, true)
      );
    this.viewer.impl.createOverlayScene("humans");
    this.viewer.impl.addOverlay("humans", this.pointsHuman);
  }

  /**
   * @description Generate shader material for PointClouds
   * @param {number} pointSize - Size of the sprite 
   */
  _generateShaderMaterial(pointSize, transparent) {
    
    /*
      Definitions:
        - Uniform: Passed in from Shader Material into shaders
          - Only in fragment shader
        - Varying: Passed in from the Buffer Geometry into the shaders 
          - First vertex shader and then fragment shader

      Data types:
        - Scalar
          - bool, int, float, uint, double
        - Vector
          - vecn is a vector of single precision float-point #s
            - The n digit can be 2, 3, or 4
    */

   const vShader = `
    uniform float size;
    varying vec3 vColor;
    varying vec2 uVu;
    void main() {
        vColor = color;
        uVu = uv;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

        // Make changes to this
        gl_PointSize = size * ( size / (length(mvPosition.xyz) + 1.0) );

        gl_Position = projectionMatrix * mvPosition;
   }`;

   const fShader = `
    uniform sampler2D tex;

    // Holds rgb values
    varying vec3 vColor;

    // uVu.x holds the icon to access
    // uVu.y holds the opacity of the icon
    varying vec2 uVu;

    void main() {

        // Declare rgba
        gl_FragColor = vec4( vColor.x, vColor.y, vColor.z, uVu.y ); 

        // Divide by the number of icons in the sprite sheet after (gl_PointCoord.x+uVu.x*1.0)
        gl_FragColor = gl_FragColor * texture2D(tex, vec2((gl_PointCoord.x+uVu.x*1.0)/5.0, 1.0-gl_PointCoord.y));

        if (gl_FragColor.w < 0.5) discard;

   }`;

    // TODO: Try updating zBuffer so nothing renders behind
    return new THREE.ShaderMaterial({
      vertexColors: THREE.VertexColors,
      fragmentShader: fShader,
      vertexShader: vShader,
      // For a better result, compute transparency in fShader
      transparent: transparent,
      depthWrite: false,
      depthTest: true,
      // Pass uniforms into shader code
      uniforms: {
        size: { type: "f", value: pointSize },
        tex: { type: "t", value: this.texture },
      },
    });
  }
  
  /**
   * @description Generate a BufferGeometry with various attributes 
   * for PointClouds and Shader Material
   * @param {number} zOffset - Offset for the sprite on the z-axis
   * @param {number} iconSelection - The desired icon from the spritesheet
   * @returns {BufferGeometry} 
   */
  _generateGeometry(zOffset, iconSelection){
    let geometry = new THREE.BufferGeometry();

    let positions = new Float32Array(this.numPoints * 3);
    let colors = new Float32Array(this.numPoints * 3);
    let icon = new Float32Array(this.numPoints * 2);

    for (var i = 0; i < this.data.length; i++) {
      var m = this.data[i];

      let k = m.x * this.maxY + m.y;
      let u = m.x + this.xaxisOffset;
      let v = m.y + this.yaxisOffset;

      positions[3 * k] = u;
      positions[3 * k + 1] = v;
      positions[3 * k + 2] = zOffset;

      // Select particle icon and set opacity 
      icon[2 * k] = iconSelection;
      icon[2 * k + 1] = 0;
      
      // Color doesn't matter yet 
      let color = new THREE.Color(0xFFFFFF);

      color.toArray(colors, k * 3);
    }

    // These are all passed into the shader material when creating PointClouds
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(icon, 2));

    geometry.computeBoundingBox();
    geometry.isPoints = true; // This flag will force Forge Viewer to render the geometry as gl.POINTS

    return geometry;
  }

  /**
   * @description Update the human and viral particles
   * PointClouds based on the new data 
   */
  _updatePointClouds() {

    this._updateParticles()
    this.pointsParticle.geometry.attributes.uv.needsUpdate = true;
    this.pointsParticle.geometry.attributes.color.needsUpdate = true;

    this._updateHumans()
    this.pointsHuman.geometry.attributes.uv.needsUpdate = true;
    this.pointsHuman.geometry.attributes.color.needsUpdate = true;

    this.viewer.impl.invalidate(true, false, true);
    
  }

  /**
   * @description If a cell now has more than zero viral particles
   * then it is updated based on the color scale. If the cell has zero viral particles
   * then it is hidden from view by setting the opacity to 0
   */
  _updateParticles(){
    let particleColors = this.pointsParticle.geometry.attributes.color.array;
    let particleIconAndOpacity = this.pointsParticle.geometry.attributes.uv.array;

    for (var i = 0; i < this.data.length; i++) {
      var m = this.data[i];

      // Item to update
      let k = m.x * this.maxY + m.y;

      // If an air particle and has viral load
      if (
        (m.curr_type == -100 || m.curr_type == -200 || m.curr_type == -800) &&
        m.current_state != 0
      ) {
        particleIconAndOpacity[2 * k + 1] = 0.7;
      } else {
        particleIconAndOpacity[2 * k + 1] = 0;
      }
      let color = new THREE.Color(this.colorScale(m.current_state));
      color.toArray(particleColors, k * 3);
    }
  }

  /**
   * @description If a cell has a human (curr_type -200, -800, -900) then it is 
   * coloured based on its type. -200 is coloured red since that is the original infected.
   * -800 is coloured because they are susceptible, and the susceptible color changes
   * based on whether or not viral particles are being inhaled. -900 is similar to -200 
   * but they are newly infected and not yet infectious. The opacity is only set to zero
   * when a cell does not hold a human.
   */
  _updateHumans(){
    let humanColors = this.pointsHuman.geometry.attributes.color.array;
    let humanIconAndOpacity = this.pointsHuman.geometry.attributes.uv.array;

    for (var i = 0; i < this.data.length; i++) {
      var m = this.data[i];

      // Item to update
      let k = m.x * this.maxY + m.y;

      let color;

      if (m.curr_type == -200 || m.curr_type == -800 || m.curr_type == -900) {
        // Make visible
        humanIconAndOpacity[2 * k + 1] = 1;

        if (m.curr_type == -200) {
          color = new THREE.Color(0xff0000);
        } else if (m.curr_type == -800) {
          color =
            m.curr_inhaled > 0
              ? new THREE.Color(0xffebcc)
              : new THREE.Color(0xffffff);
        } else if (m.curr_type == -900) {
          color = new THREE.Color(0xa35050);
        }
      } else {
        humanIconAndOpacity[2 * k + 1] = 0;
        color = new THREE.Color(0xffffff);
      }
      color.toArray(humanColors, k * 3);
    }
  }


  /**
   * @description Update the countdown time in the overview panel.
   * The time decrements as the simulation goes on. Once the 
   * simulation dies off, the countdown is reset or stopped 
   * entirely. 
   */
  _updateCountdown() {
    if (this._playViz == false) { this.time = "0:00"; } 
    else {
      let minutes = Math.floor(
        (this.realTime % (1000 * 60 * 60)) / (1000 * 60)
      );
      let seconds = Math.floor((this.realTime % (1000 * 60)) / 1000);
      seconds = seconds < 10 ? "0" + seconds : seconds;
      this.time = `${minutes}:${seconds}`;
    }
    this._panel.highlightableElements[
      "Countdown0:00Time"
    ][1].innerText = this.time;
  }

  /**
   * @description Keep the legend in the Forge Viewer when going
   * full screen. You can reuse this code to keep other HTML elements
   * in the Forge Viewer when going full screen.
   */
  _keepLegendInForgeViewer(){
    let legend = document.getElementById("legend");
    let v2 = document.querySelector(".adsk-viewing-viewer");
    v2.appendChild(legend);
  }

  onToolbarCreated() {
    // Create a new toolbar group if it doesn't exist
    this._group = this.viewer.toolbar.getControl("allMyAwesomeExtensionsToolbar");
    if (!this._group) {
      this._group = new Autodesk.Viewing.UI.ControlGroup("allMyAwesomeExtensionsToolbar");
      this.viewer.toolbar.addControl(this._group);
    }

    /////////////////////////////////////////////////
    // Reset simulation and remove all visuals /////
    ///////////////////////////////////////////////
    this._button = new Autodesk.Viewing.UI.Button("Reset");
    this._button.onClick = (ev) => {

      this._playViz = false

      if(this.pointsParticle != undefined){
        this.pointsParticle.visible = false;
        this.pointsHuman.visible = false;
      }

      if(this._panel != null){
        // Show / hide docking panel
        this._panel.setVisible(!this._panel.isVisible());
        // If panel is NOT visible, exit the function
        if (!this._panel.isVisible()) return;
      }

    };
    this._button.setToolTip("Reset All");
    this._button.addClass("resetIcon");
    this._group.addControl(this._button);

    ////////////////////
    // Run Simulation //
    ///////////////////
    this._button = new Autodesk.Viewing.UI.Button("Run Simulation");
    this._button.onClick = (ev) => {
      // Check if the panel is created or not
      if (this._panel == null) {
        this._panel = new ModelSummaryPanel(
          this.viewer,
          this.viewer.container,
          "modelSummaryPanel",
          "Overview"
        );
        this._panel.addProperty("Countdown", this.time, "Time");
      }

      // Show / hide docking panel
      this._panel.setVisible(!this._panel.isVisible());
      // If panel is NOT visible, exit the function
      if (!this._panel.isVisible()) return;

      if (this._playViz == false) {

        this._playViz = true;

        this._beginSimulation();
      }
      this._panel.container.style.left = "10px";
      this._panel.container.style.top = "10px";
    };
    this._button.setToolTip("Run Simulation");
    this._button.addClass("pointCloudIcon");
    this._group.addControl(this._button);

    ////////////////////////////////////////
    // Turn Point Cloud Visual On or Off //
    //////////////////////////////////////
    this._button = new Autodesk.Viewing.UI.Button("PointCloud ON / OFF");
    this._button.onClick = (ev) => {};
    this._button.setToolTip("PointCloud ON / OFF");
    this._button.addClass("playIcon");
    this._group.addControl(this._button);

    ////////////
    // Legend //
    ///////////
    this._button = new Autodesk.Viewing.UI.Button("Legend ON/OFF");
    this._button.onClick = (ev) => {
      if (this._legend == false) {
        this._legend = true;
        // append a defs (for definition) element to your SVG
        var svgLegend = d3.select("#legend").append("svg");
        var defs = svgLegend.append("defs");

        // append a linearGradient element to the defs and give it a unique id
        var linearGradient = defs
          .append("linearGradient")
          .attr("id", "linear-gradient");

        // horizontal gradient
        linearGradient
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%");

        // append multiple color stops by using D3's data/enter step
        linearGradient
          .selectAll("stop")
          .data([
            { offset: "0%", color: this.colorScale.range()[0] },
            { offset: "10%", color: this.colorScale.range()[1] },
            { offset: "20%", color: this.colorScale.range()[2] },
            { offset: "30%", color: this.colorScale.range()[3] },
            { offset: "40%", color: this.colorScale.range()[4] },
            { offset: "50%", color: this.colorScale.range()[5] },
            { offset: "60%", color: this.colorScale.range()[6] },
            { offset: "70%", color: this.colorScale.range()[7] },
            { offset: "80%", color: this.colorScale.range()[8] },
            { offset: "90%", color: this.colorScale.range()[9] },
            { offset: "100%", color: this.colorScale.range()[10] },
          ])
          .enter()
          .append("stop")
          .attr("offset", function (d) {
            return d.offset;
          })
          .attr("stop-color", function (d) {
            return d.color;
          });

        // append title
        svgLegend
          .append("text")
          .attr("class", "legendTitle")
          .attr("x", 5)
          .attr("y", 20)
          .style("text-anchor", "mid")
          .text("Viral Aerosol Conc.");

        // draw the rectangle and fill with gradient
        svgLegend
          .append("rect")
          .attr("x", 5)
          .attr("y", 30)
          .attr("width", 140)
          .attr("height", 15)
          .style("fill", "url(#linear-gradient)");

        //create tick marks
        var xLeg = d3.scale
          .ordinal()
          .domain([1, this.maxState/2, this.maxState])
          .range([0, 135 / 2, 135]);

        var axisLeg = d3.axisBottom(xLeg);

        svgLegend
          .attr("class", "axis")
          .append("g")
          .attr("transform", "translate(10, 40)")
          .call(axisLeg);

        // append title
        svgLegend
          .append("text")
          .attr("class", "legendTitle")
          .attr("x", 175)
          .attr("y", 20)
          .style("text-anchor", "mid")
          .text("Condition");

        var keys = ["Susceptible", "Exposed", "Infected", "Newly Infected"];

        // Add one dot in the legend for each name.
        svgLegend
          .selectAll("labels")
          .data(keys)
          .enter()
          .append("text")
          .attr("x", 195)
          .attr("y", function (d, i) {
            return 40 + i * 20;
          })
          .text(function (d) {
            return d;
          })
          .attr("text-anchor", "left")
          .style("alignment-baseline", "middle");

        // Squares
        svgLegend
          .append("rect")
          .attr("x", 174)
          .attr("y", 30)
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", "#ffffff");
      svgLegend
          .append("rect")
          .attr("x", 174)
          .attr("y", 50)
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", "#ffebcc");
      svgLegend
          .append("rect")
          .attr("x", 174)
          .attr("y", 70)
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", "#ff0000");
        
      svgLegend
          .append("rect")
          .attr("x", 174)
          .attr("y", 90)
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", "#a35050");
        
        
        this._keepLegendInForgeViewer()

      } else {
        // Delete legend
        this._legend = false;
        var svg = d3.select("#legend");
        svg.selectAll("*").remove();
      }
    };

    this._button.setToolTip("Legend");
    this._button.addClass("legendIcon");
    this._group.addControl(this._button);
  }
}


class ModelSummaryPanel extends Autodesk.Viewing.UI.PropertyPanel {
  constructor(viewer, container, id, title, options) {
    super(container, id, title, options);
    this.viewer = viewer;
  }
}
Autodesk.Viewing.theExtensionManager.registerExtension("MyAwesomeExtension", MyAwesomeExtension);

