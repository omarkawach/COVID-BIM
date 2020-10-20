// Author(s): Omar Kawach, Mitali Patel

/* Purpose: 
    - Display the correct geoemetries in the correct coordinates
    - Have geometries change colors and opacity based on certain factors
    - Have geoemtries animated when needed
*/

/* Useful links:
    - THREE.Group() https://threejs.org/docs/index.html#api/en/objects/Group
    - THREE.ShaderMaterial https://threejs.org/docs/#api/en/materials/ShaderMaterial
    - THREE.PointCloud() https://threejs.org/docs/#api/en/objects/Points 
        - We're using an outdated version. The new one is THREE.Points()
    - THREE.Matrix4() https://threejs.org/docs/index.html#api/en/math/Matrix4
*/

/* Problems:
    - Outdated version of Three.js
        - Forge Viewer runs modified r71
        - Current version of Three.JS as of Oct 2020 is r121
    - D3JS slows down Forge Viewer 
        - Should find a better way to read CSVs
    - Can't seem to create a BufferGeometry with 
        vertices and then put them in Group
    - Map is undefined in PointCloudMaterial
        - SOLVED with callback function but texture still doesn't appear
        - https://stackoverflow.com/questions/64395059/forge-viewer-autodesk-v7-three-material-map-parameter-is-undefined-in-three-p
    - Can't color BufferGeometry anything other than
        yellow, white, and blue
        - Try this: 
        https://stackoverflow.com/questions/64393641/forge-viewer-autodesk-v7-issues-with-recolouring-three-buffergeoemtry-when-using/64427108#64427108
*/

/* Cell types:
    - AIR = -100
    - vp_SOURCE = -200
    - IMPERMEABLE_STRUCTURE = -300
    - DOOR = -400
    - TABLE = -500
    - VENTILATION = -600
    - CHAIR = -700
    - vp_RECEIVER = -800
*/

// Will hold a group of various geometries
let group;

// Define the color range for the viral particles
let colorScale = d3.scaleLinear()
                // Based on min state and max state
                 .domain( [ 0, 4, 8, 12, 16, 20 ] )
                 .range( [ 
                     '#FFFFFF',
                     '#F6BDC0',
                     '#F1959B',
                     '#F07470',
                     '#EA4C46',
                     '#DC1C13' 
                    ] );

// Human sprite colors
// Set hue 
// Set saturation
// Set lightness
let color = new THREE.Color()

// White is unimpacted
let whiteBufferColor = color.setHSL(1.0, 1.0, 1.0)
// Red is infectious
let redBufferColor = color.setHSL(0, 1.0, 0.5)
// Almost red is infected 
let almostRedBufferColor = color.setHSL(0.0, 0.7, 0.4)
// Orange nearing infection
let orangeBufferColor = color.setHSL(0.1, 1.0, 0.4)


class ParticlesExtension extends Autodesk.Viewing.Extension {
    
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;

        // Restuarant
        // Negative values move down (depending on perspective)
        this.xaxisOffset = -13;
        // Negative values move to the right (depending on perspective)
        this.yaxisOffset = -29;
        // For human height
        this.zaxisOffset = -1;
        // For virus height
        this.zaxisOffsetVirus = -3;

        // House
        // Move right (+ve) to left (-ve) when North facing
        // this.xaxisOffset = 0;
        // this.yaxisOffset = 0;
        // this.zaxisOffset = 0;
        // // Move up (+ve) and move up (-ve)
        // this.zaxisOffsetVirus = -7;
    }

    load() {
        // Before we get started with data visualization
        this._createShaders()
        this._createMaterials()
        // Show the geometries in Forge Viewer
        this._renderCloud(0);
        return true;
    }

    _createShaders() {
        // Is there any way to stop the sprites from changing sizes when zooming in?
        this.vShader = `uniform float size;
        varying vec3 vColor;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size * ( size / (length(mvPosition.xyz) + 0.00001) );
            gl_Position = projectionMatrix * mvPosition;
        }`
        //The coloring problem is probably here
        // https://threejs.org/examples/?q=att#webgl_custom_attributes_points3
        // http://bl.ocks.org/duhaime/822f81a578b47d6fd0be523e6f7efc78
        // vec4(1.0, 0.0, 0.0, 1.0) to color sprites red
        this.fShader = ` varying vec3 vColor;
        uniform sampler2D sprite;
        void main() {
            gl_FragColor = vec4(vColor, 1.0) * texture2D( sprite, gl_PointCoord );
            if (gl_FragColor.x < 0.2) discard;
        }`
    }

    _createMaterials() {
        
        // Material that is supposed to accept textures 
        var virusPointMaterial = new THREE.PointCloudMaterial({
            color: 0xFF0000,
            size: 5,
            map: ""
        })
        new THREE.TextureLoader().load( '../img/epidemics.png', function onLoad(tex) {
            virusPointMaterial.map = tex;
          });
        this.virusPointMaterial = virusPointMaterial
        
        // Material rendered with custom shaders and sprites
        // Figure out how to change colors
        this.humanMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                size: { type: 'f', value: 70},
                sprite: { type: 't', value: THREE.ImageUtils.loadTexture( "../img/human2.png" ) },
            },
            vertexShader: this.vShader,
            fragmentShader: this.fShader,
            transparent: true,
            vertexColors: true,
        });
    }

    _renderCloud( time ) {
        group = this._generateGroupOfPointClouds( time );
        this.viewer.impl.createOverlayScene( 'custom-scene' );
        this.viewer.impl.addOverlay( 'custom-scene', group );
    }

    _bufferGeometryToPointCloud( m, material ) {
        let geometry = new THREE.BufferGeometry();

        // Create end points and add to geometry
        const vertices = new Float32Array( [ 1, 1, 1 ] );
        geometry.addAttribute('position', new THREE.BufferAttribute( vertices, 3 ));

        // Create colors of each end point (vertex) and add to geometry
        let colors;
        if(m.type == -200){
            colors = new Float32Array( [ 1.0, 0.0, 0.0 ] );
        }else{
            // X.Color {}
            let color = new THREE.Color();
            color.setHSL(0.5, 0.5, 0.5)
            colors = new Float32Array( 3 );
            colors[0] = color.r // 0.25
            colors[1] = color.g // 0.75
            colors[2] = color.b //0.75
        }
        geometry.addAttribute('color', new THREE.BufferAttribute( colors, 3 ));

        // Is this line really needed?
        // Should probably use this after modifications?
        geometry.computeBoundingBox();

        // DO NOT REMOVE THIS
        geometry.isPoints = true; // gl.POINTS, needed for Forge Viewer

        return this._createPointCloud( geometry, material, this.zaxisOffset, m)
        
    }

    _createPointCloud( geometry, material, offset, m ) {
        let pointCloud = new THREE.PointCloud( geometry, material )

        // Move to correct coordinate 
        // .makeTranslation ( x : Float, y : Float, z : Float ) : this
        // x - the amount to translate in the X axis. 
        // y - the amount to translate in the Y axis.
        // z - the amount to translate in the Z axis
        pointCloud.applyMatrix( new THREE.Matrix4().makeTranslation( 
            m.x + this.xaxisOffset, 
            m.y + this.yaxisOffset,
            offset
        ) );

        return pointCloud
    }

    _geometryToPointCloud( m, material ) {
        let geometry = new THREE.Geometry( 1, 1, 1 );

        let vertex = new THREE.Vector3();

        vertex.x = 0 //Math.random() * ((0.5 + m.x / max_x) - (0.5 - m.x / max_x)) + (0.5 - m.x / max_x);
        vertex.y = 0 //Math.random() * ((0.5 + m.y / max_y) - (0.5 - m.y / max_y)) + (0.5 - m.y / max_y);
        vertex.z = 0 //Math.random() * ((5) - (0)) + (0);
        
        geometry.vertices.push( vertex );

        let pointCloud = this._createPointCloud( geometry, material, this.zaxisOffsetVirus, m)

        // DO NOT REMOVE THIS
        pointCloud.material = pointCloud.material.clone(); // Will let us choose colors

        // Assign color to particles
        pointCloud.material.color = this._getColor( m.state )

        // Turn the opacity to 0 if the state is 0
        if(m.state == 0){ pointCloud.material.opacity = 1}
        else{ pointCloud.material.opacity = 1 }

        return pointCloud
    }

    _getColor( state ) {
        // Convert rgb string from d3
        let stringColor = colorScale( state ) 
        let threeColor = new THREE.Color( stringColor )
        return threeColor
    }

    _generateGroupOfPointClouds( time ) {
        // Group to hold various geometries
        var groupOfPointClouds = new THREE.Group();

        for ( var i = 0; i < data[time].length; i++ ){
            let messages = data[time],
                m = messages[i],
                    pointCloud;

            if ( m.type == -200 ) {  pointCloud = this._bufferGeometryToPointCloud( m, this.humanMaterial ) }
            else { pointCloud = this._geometryToPointCloud( m, this.virusPointMaterial ) }

            groupOfPointClouds.add( pointCloud )
        }
        return groupOfPointClouds;
    }

    unload() {
        // Clean our UI elements if we added any
        if ( this._group ) {
            this._group.removeControl( this._button );
            if ( this._group.getNumberOfControls() === 0 ) {
                this.viewer.toolbar.removeControl( this._group );
            }
        }
        console.log('ParticlesExtensions has been unloaded');
        return true;
    }

    _updatePointCloudGeometry( messages, i ) {
        // Number of inhaled particles they become infected at a threshold 
        for ( let index = 0; index < group.children.length; index++ ) { 
            let particles = group.children[index]
            let m = messages[index]

            // Check if type changed to human (therefore remove particles and add human)
            if ( ( m!= undefined ) && ( m.type == -200 || m.type == -800 ) && ( m.type != m.prev_type ) ) {
                console.log("particle to human")

                particles = this._bufferGeometryToPointCloud( m, this.humanMaterial )

                group.children[index] = particles

            }
            // Check if type changed to particles (therefore remove human and add particles)
            else if ( ( m!= undefined ) && ( m.prev_type == -200 || m.type == -800) && ( m.type != m.prev_type ) ) {
                console.log("human to particle")

                particles = this._geometryToPointCloud( m, this.virusPointMaterial )

                group.children[index] = particles
            }
            else if ( ( m!= undefined ) && ( particles.geometry.type == "Geometry" ) ) {
                
                group.children[index].position.x = 
                    Math.random() * 
                    ((0.2 + m.x + this.xaxisOffset) - (m.x + this.xaxisOffset - 0.2)) + 
                    (m.x + this.xaxisOffset - 0.2);

                group.children[index].position.y = 
                    Math.random() * 
                    ((0.2 + m.y + this.yaxisOffset) - (m.y + this.yaxisOffset - 0.2 )) + 
                    (m.y + this.yaxisOffset - 0.2);

                group.children[index].position.z = Math.random() * ((this.zaxisOffsetVirus) - (0)) + (0);
                
                // Change opacity
                if( m.state == 0 ){
                    group.children[index].material.opacity = 0
                }else{
                    group.children[index].material.opacity = 1
                }

                // Change color of particles
                group.children[index].material.color = this._getColor( m.state )
            }
        }
        

        // for ( let index = 0; index < group.children.length; index++ ) {

        //     // For making edits (scale, position, rotation)
        //     // The object will no longer be static, so it will stay true
        //     group.children[index].matrixAutoUpdate = true;

        //     let typeOfGeometry = group.children[index].type;

        //     // Geometry and BufferGeometry use different approaches for coloring
        //     if ( typeOfGeometry == "PointCloud" ) 
        //     {
        //          // Change size of particles
        //         //group_of_particles.children[index].material.uniforms.size.value = Math.random() * ((50) - (40)) + (40);

        //         // Change position
        //         //group_of_particles.children[0].geometry.attributes.position.array[0] += 0.5
        //         //group_of_particles.children[0].geometry.attributes.position.needsUpdate = true
                
        //         // Change color of particle
        //         // if( messages[index].state < 10 )
        //         // {
        //         //     // Works for yellow [1,1,0], white [1,1,1] and red [1,0,0]
        //         //     group.children[index].geometry.attributes.color.array = new Float32Array( [ 1, 1, 1 ] )
        //         // }
        //         // else { group.children[index].geometry.attributes.color.array = new Float32Array( [ 1, 0, 0 ] ) }
                
        //         // group.children[index].geometry.attributes.color.needsUpdate = true
        //     }
        //}

        // Show the changes
        this.viewer.impl.invalidate( true, false, true );
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('ParticlesExtensionsToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('ParticlesExtensionsToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('ParticlesExtensionButton');
        this._button.onClick = (ev) => {
            ////////////////////////////
            // Execute an action here //
            ///////////////////////////
            if(window.legendOFF){
                this._appearLegend();
                window.legendOFF = false;
            }

            var i = 0;
            var interval = setInterval(() => {
                this._updatePointCloudGeometry(data[i], i);
                if (++i == data.length) window.clearInterval(interval);
            }, 0.5);
            
        };
        this._button.setToolTip('My Particles Extension');
        this._button.addClass('pointcloudIcon');
        this._group.addControl(this._button);
    }

    _appearLegend(){
        // append a defs (for definition) element to your SVG
        var svgLegend = d3.select('#legend').append('svg');
        var defs = svgLegend.append('defs');
    
        // append a linearGradient element to the defs and give it a unique id
        var linearGradient = defs.append('linearGradient')
            .attr('id', 'linear-gradient');
    
        // horizontal gradient
        linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
    
        // append multiple color stops by using D3's data/enter step
        linearGradient.selectAll("stop")
            .data([
                {offset: "0%", color: '#FFFFFF'},
                {offset: "20%", color: '#F6BDC0'},
                {offset: "40%", color: '#F1959B'},
                {offset: "60%", color: '#F07470'},
                {offset: "80%", color: '#EA4C46'},
                {offset: "100%", color: '#DC1C13'}
            ])
            .enter().append("stop")
            .attr("offset", function(d) { 
                return d.offset; 
            })
            .attr("stop-color", function(d) { 
                return d.color; 
            });
    
        // append title
        svgLegend.append("text")
            .attr("class", "legendTitle")
            .attr("x", 0)
            .attr("y", 20)
            .style("text-anchor", "mid")
            .text("Viral Particle Count");
    
        // draw the rectangle and fill with gradient
        svgLegend.append("rect")
            .attr("x", 0)
            .attr("y", 30)
            .attr("width", 300)
            .attr("height", 15)
            .style("fill", "url(#linear-gradient)");
    
            //create tick marks
            var xLeg = d3.scale.ordinal()
            .domain([20])
            .range([290])

            var axisLeg = d3.axisBottom(xLeg);

            svgLegend
                .attr("class", "axis")
                .append("g")
                .attr("transform", "translate(10, 40)")
                .call(axisLeg);
        }

    
}

Autodesk.Viewing.theExtensionManager.registerExtension('ParticlesExtension', ParticlesExtension);
