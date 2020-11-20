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
    - vp_INFECTED = ... add later
    - IMPERMEABLE_STRUCTURE = -300
    - DOOR = -400
    - TABLE = -500
    - VENTILATION = -600
    - CHAIR = -700
    - vp_RECEIVER = -800
*/

let data;
let playGame = false;

class MyAwesomeExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this._group = null;
    this._button = null;

    this._panel = null;
    this._playGame = false;
    this._legend = false;

    // Timer properties
    this.timer = "0:00";

    // PointCloud position properties (VSIM)
    this.zaxisOffsetParticle = -4.5;
    this.zaxisOffsetHuman = -2;
    this.xaxisOffset = -89.5;
    this.yaxisOffset = -70;

    // Textures
    this.texture = THREE.ImageUtils.loadTexture("../img/5_imgList.png");

    this.colorScale = d3
      .scaleLinear()
      .domain([
        0,
        600 * 0.01,
        600 * 0.02,
        600 * 0.04,
        600 * 0.08,
        600 * 0.12,
        600 * 0.14,
        600 * 0.16,
        600 * 0.2,
        600 * 0.25,
        600 * 0.3,
        600 * 0.5,
        600,
      ])
      .range([
        "#feed00",
        "#ffdb00",
        "#ffc801",
        "#ffb600",
        "#ffa401",
        "#ff9201",
        "#fd6d03",
        "#ff5c01",
        "#ff4900",
        "#ff3801",
        "#fc2501",
        "#ff1200",
        "#fe0000",
      ]);
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

  _renderCloud() {
    this._generatePointCloudShaders();

    this._generatePointCloudMaterial();

    this._generatePointCloud();

    this.viewer.impl.createOverlayScene("pointclouds");
    this.viewer.impl.addOverlay("pointclouds", this.points);
  }

  _generatePointCloudShaders() {
    // Is there any way to stop the sprites from changing sizes when zooming in?
    // Maybe pass a size parameter?
    this.vShader = `
      uniform float size;
      varying vec3 vColor;
      varying vec2 uVu;
      void main() {
          vColor = color;
          uVu = uv;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_PointSize = size * ( size / (length(mvPosition.xyz) + 1.0) );
          gl_Position = projectionMatrix * mvPosition;
      }`;

    // To cut up the image
    // (gl_PointCoord.x+uVu.x*1.0) / x
    // Where x should be the number of icons
    this.fShader = `
      uniform sampler2D tex;
      varying vec3 vColor;
      varying vec2 uVu;
      void main() {
          // Get flags for WebGL errors
          //float transparency = 1.0 - 2.0 * distance(gl_PointCoord.xy, vec2(0.5, 0.5));
          gl_FragColor = vec4( vColor.x, vColor.y, vColor.z, uVu.y ); 
          gl_FragColor = gl_FragColor * texture2D(tex, vec2((gl_PointCoord.x+uVu.x*1.0)/5.0, 1.0-gl_PointCoord.y));
          
          // Transparency
          // Blending?
          // WebGL has method for distance between points to generate radial
          //gl_FragColor = vec4( 1,0,0, gl_PointCoord.y ); 
          if (gl_FragColor.w < 0.5) discard;
      }`;
  }

  _generatePointCloudMaterial() {
    // Material rendered with custom shaders and sprites
    this.material = new THREE.ShaderMaterial({
      vertexColors: THREE.VertexColors,
      fragmentShader: this.fShader,
      vertexShader: this.vShader,
      transparent: true,
      // If rendered, update zBuffer so nothing renders behind
      // Better result, compute transparency in fShader
      depthWrite: false,
      depthTest: true,
      // Pass uniforms into shader code
      uniforms: {
        size: { type: "f", value: 50 },
        tex: { type: "t", value: this.texture },
      },
    });
  }

  _generatePointCloud() {
    var geometry = this._generatePointCloudGeometry();

    this.points = new THREE.PointCloud(geometry, this.material);
  }

  _generatePointCloudGeometry() {
    let geometry = new THREE.BufferGeometry();

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

    let positions = new Float32Array(this.numPoints * 3);

    // Sprite colors
    let colors = new Float32Array(this.numPoints * 3);

    // Icon selection and opacity
    let icon = new Float32Array(this.numPoints * 2);

    for (var i = 0; i < this.data.length; i++) {
      var m = this.data[i];

      let k = m.x * this.maxY + m.y;
      let u = m.x + this.xaxisOffset;
      let v = m.y + this.yaxisOffset;

      positions[3 * k] = u;
      positions[3 * k + 1] = v;
      positions[3 * k + 2] = this.zaxisOffsetParticle;

      // If an air particle
      if (m.curr_type == -100 || m.curr_type == -200 || m.curr_type == -800) {
        icon[2 * k] = 0;
        icon[2 * k + 1] = 1;
      }
      // Hide if not an air particle
      else {
        icon[2 * k] = 0;
        icon[2 * k + 1] = 0;
      }
      let color = new THREE.Color(this.colorScale(m.current_state));
      color.toArray(colors, k * 3);
    }
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(icon, 2));

    geometry.computeBoundingBox();
    geometry.isPoints = true; // This flag will force Forge Viewer to render the geometry as gl.POINTS

    return geometry;
  }

  _updateRenderCloud() {
    let particleColors = this.points.geometry.attributes.color.array;
    let particleIconAndOpacity = this.points.geometry.attributes.uv.array;
    let particlePositions = this.points.geometry.attributes.position.array;

    for (var i = 0; i < this.data.length; i++) {
      var m = this.data[i];

      // Item to update
      let k = m.x * this.maxY + m.y;

      if (m.current_state > 0) {
        let x = particlePositions[3 * k];
        let y = particlePositions[3 * k + 1];
        let z = particlePositions[3 * k + 2];
      }

      // If an air particle and has viral load
      if (
        (m.curr_type == -100 || m.curr_type == -200 || m.curr_type == -800) &&
        m.current_state != 0
      ) {
        particleIconAndOpacity[2 * k] = 0;
        particleIconAndOpacity[2 * k + 1] = 0.7;
      } else {
        particleIconAndOpacity[2 * k] = 0;
        particleIconAndOpacity[2 * k + 1] = 0;
      }
      let color = new THREE.Color(this.colorScale(m.current_state));
      color.toArray(particleColors, k * 3);
    }

    this.points.geometry.attributes.uv.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    this.viewer.impl.invalidate(true, false, true);
  }

  // Find the max particles
  _startGame() {
    // To access things in jQuery
    let self = this;

    // Begin splitting the CSV data
    jQuery.get(
      "/api/forge/csvStreamer/streaming",
      {
        // Change file path as need
        filepath: `./public/data/output/state_change.csv`,
        output: `state_change_split`,
        view_name: "3D",
      },
      (result) => {
        readCSVs(result);
      }
    );

    function readCSVs(result) {
      var numFiles = result.totalChunks; // 1 chunk is one file
      var time = 1000; // 1000ms is 1 second in real time
      self.realTime = 1000 * numFiles - 1000;

      var interval = setInterval(() => {
        var file =
          `./public/data/output/state_change_split-` + self.index + ".csv";

        jQuery.get(
          "/api/forge/csvStreamer/reading",
          {
            filepath: file,
          },
          (result) => {
            self.data = result;
            self._getViz();

            if (self.index == numFiles - 1) { clearInterval(interval); }

            self.index++;
            self._updateCountdown();
            self.realTime -= 1000;
          }
        );
      }, time);
    }
  }

  _getViz() {
    if (this.index == 0) {
      this._renderCloud();
    } else {
      this._updateRenderCloud();
    }
  }

  _updateCountdown() {
    const minutes = Math.floor(
      (this.realTime % (1000 * 60 * 60)) / (1000 * 60)
    );
    let seconds = Math.floor((this.realTime % (1000 * 60)) / 1000);
    seconds = seconds < 10 ? "0" + seconds : seconds;
    this.timer = `${minutes}:${seconds}`;
    this._panel.highlightableElements[
      "Countdown0:00Time"
    ][1].innerText = `${minutes}:${seconds}`;
    countdown.innerHTML = `${minutes}:${seconds}`;
  }

  onToolbarCreated() {
    // Create a new toolbar group if it doesn't exist
    this._group = this.viewer.toolbar.getControl("allMyAwesomeExtensionsToolbar");
    if (!this._group) {
      this._group = new Autodesk.Viewing.UI.ControlGroup("allMyAwesomeExtensionsToolbar");
      this.viewer.toolbar.addControl(this._group);
    }

    ///////////////////////////////////////////////////////
    // Reset back to time-step one and remove all visuals
    ////////////////////////////////////////////////////////
    this._button = new Autodesk.Viewing.UI.Button("Reset");
    this._button.onClick = (ev) => {};
    this._button.setToolTip("Reset All");
    this._button.addClass("resetIcon");
    this._group.addControl(this._button);

    /////////////////
    // Simulation //
    ///////////////
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
      }

      // Show / hide docking panel
      this._panel.setVisible(!this._panel.isVisible());
      // If panel is NOT visible, exit the function
      if (!this._panel.isVisible()) return;

      if (this._playGame == false) {
        this._panel.addProperty("Countdown", this.timer, "Time");

        this._playGame = true;

        playGame = this._playGame;

        // Reset the number of files read back to zero
        this.index = 0;

        // Steps:
        // - Split CSVs
        // - Read CSVs
        // - Begin Visualization and share data throughout the program
        this._startGame();
      }
      this._panel.container.style.left = "10px";
      this._panel.container.style.top = "10px";
    };
    this._button.setToolTip("Run Simulation");
    this._button.addClass("pointCloudIcon");
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
            { offset: "0%", color: "#feed00" },
            { offset: "8%", color: "#ffdb00" },
            { offset: "16%", color: "#ffc801" },
            { offset: "24%", color: "#ffb600" },
            { offset: "32%", color: "#ffa401" },
            { offset: "40%", color: "#ff9201" },
            { offset: "48%", color: "#fd6d03" },
            { offset: "56%", color: "#ff5c01" },
            { offset: "64%", color: "#ff4900" },
            { offset: "72%", color: "#ff3801" },
            { offset: "80%", color: "#fc2501" },
            { offset: "88%", color: "#ff1200" },
            { offset: "100%", color: "#fe0000" },
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
          .domain([1, 300, 600])
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

        var keys = ["Susceptible", "Exposed", "Infected"];

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
          .style("fill", "#feed00");
        svgLegend
          .append("rect")
          .attr("x", 174)
          .attr("y", 50)
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", "#ff5c01");
        svgLegend
          .append("rect")
          .attr("x", 174)
          .attr("y", 70)
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", "#FF0000");

        let legend = document.getElementById("legend");
        let v2 = document.querySelector(".adsk-viewing-viewer");
        v2.appendChild(legend);
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
Autodesk.Viewing.theExtensionManager.registerExtension(
  "MyAwesomeExtension",
  MyAwesomeExtension
);
