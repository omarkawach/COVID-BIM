// Author(s): Omar Kawach, Mitali Patel

//////////////////////////////////////////////
// This file is for creating groups of //////
// groups composed of various geometries ///
// & displaying them in Forge Viewer //////
//////////////////////////////////////////

/* Problems:
    - Outdated version of Three.js
        - Forge Viewer runs modified r71
        - Current version of Three.JS as of Oct 2020 is r121
    - D3JS slows down Forge Viewer 
        - Should find a better way to read CSVs
    - Can't seem to create a BufferGeometry with 
        vertices and then put them in Group
    - Map is undefined in PointCloudMaterial
    - Can't color BufferGeometry anything other than
        yellow, white, and blue
*/

// Will hold a group of Point Clouds
// Notice that this is different than _group
let group;
let colorScale = d3.scaleLinear()
                 .domain([0, 20])
                 .range(['#FFE5E5 ','#FC0101']);

let opac  = d3.scaleLinear()
                .domain([0,20])
                .range([0,1]);

class ParticlesExtension extends Autodesk.Viewing.Extension {
    
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;

        // Max data are from readdata.js
        // Not sure if we actually need this data
        this.max_x = max_x;
        this.max_y = max_y;

        // First floor in the house house
        this.zaxisOffset = -6.0;

        // Size of the sprite
        this.pointSize = 80;
    }

    load() {
        // Show the geometries in Forge Viewer
        this._renderCloud();
        return true;
    }

    _renderCloud(){



        group = this._generatePointCloud();
        // if (!viewer.overlays.hasScene('custom-scene')) {
        //     viewer.overlays.addScene('custom-scene');
        // }
        //this.viewer.overlays.addMesh(group, 'custom-scene');
        this.viewer.impl.createOverlayScene( 'custom-scene' );
        this.viewer.impl.addOverlay( 'custom-scene', group );
        // this.viewer.impl.sceneAfter.skipDepthTarget = true;
        // this.viewer.impl.sceneAfter.skipIdTarget = true;
    }

    
    _generatePointCloud(){
        var vShader = `uniform float size;
        varying vec3 vColor;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size * ( size / (length(mvPosition.xyz) + 0.00001) );
            gl_Position = projectionMatrix * mvPosition;
        }`
        var fShader = `varying vec3 vColor;
        uniform sampler2D sprite;
        void main() {
            gl_FragColor = vec4(vColor, 1.0 ) * texture2D( sprite, gl_PointCoord );
            if (gl_FragColor.x < 0.2) discard;
        }`

        // Material rendered with custom shaders
        // https://threejs.org/docs/#api/en/materials/ShaderMaterial
        var materialForBuffers = new THREE.ShaderMaterial( {
            uniforms: {
                size: { type: 'f', value: this.pointSize},
                sprite: { type: 't', value: THREE.ImageUtils.loadTexture("../img/human2.png") },
            },
            vertexShader: vShader,
            fragmentShader: fShader,
            transparent: true,
            vertexColors: true,
        });

        // We're using an outdated version https://threejs.org/docs/#api/en/materials/PointsMaterial
        var materialForShapes = new THREE.PointCloudMaterial({
            //////////////////////////////////////////////////////////
            /// console says that map is undefined for some reason ///
            //////////////////////////////////////////////////////////
            //map: new THREE.TextureLoader().load( '../data/toppng.com-particles-3000x2000.png' ),
            color: 0xffffff,
            transparent: false,
            opacity: 0.9,
            size: 8,
        })


        // Group to hold various geometries
        // https://threejs.org/docs/index.html#api/en/objects/Group
        var groupGeometries = new THREE.Group();

        // https://threejs.org/docs/index.html#api/en/geometries/BoxGeometry
        // Create (any) shape 
        // @param1: Width
        // @param2: Depth (probably keep it at 0.5)
        // @param3: Height
        let geometryForShapes = new THREE.SphereGeometry( 1, 1, 5 );

        // TODO: Figure out how to add humans without hardcoding by time
        // TODO: Add humans to seperate group later? 
        for ( var i = 0; i < data[15].length; i++ ){

            // Access simulation result data from readdata.js
            var messages = data[15],
                m = messages[i];

            // For Buffer Geometries only
            let geometryForBuffers;
            
            // For any geometry
            // This will store the Point Cloud 
            // We're using an outdated version of PointCloud https://threejs.org/docs/#api/en/objects/Points
            let particles;
            
            // Create a point clouds with the correct geometry 

            // type -200 indicates a human 
            if ( m.type == -200 ) 
            {
                geometryForBuffers = new THREE.BufferGeometry();
                
                // create end points and add to geometry
                const vertices = new Float32Array( [ 1, 1, 1 ] );
                geometryForBuffers.addAttribute('position', new THREE.BufferAttribute( vertices, 3 ));

                // create colors of each end point (vertex) and add to geometry
                const colors = new Float32Array( [ 1.0, 0.0, 0.0 ] );
                geometryForBuffers.addAttribute('color', new THREE.BufferAttribute( colors, 3 ));

                // Is this line really needed?
                geometryForBuffers.computeBoundingBox();

                geometryForBuffers.isPoints = true; // gl.POINTS, needed for Forge Viewer

                // Create X.PointCloud with BufferGeometry
                particles = new THREE.PointCloud( geometryForBuffers, materialForBuffers )

                ////////////////////////////////////////
                // Should double check how this works //
                ////////////////////////////////////////
                // Left (-ve) / Right (+ve) is first argument
                // Down (-ve) / Up (+ve) is last argument
                var particle_matrix = new THREE.Matrix4().makeTranslation( m.x , m.y, this.zaxisOffset );
                particles.applyMatrix( particle_matrix );

                // Set to false since we're keeping this static for now
                // ** By default the matrixAutoUpdate is set to true **
                particles.matrixAutoUpdate = false;
                particles.updateMatrix()

                // Add particles (X.PointCloud) to group
                groupGeometries.add( particles )
            }
            else
            {
                let groupShere = new THREE.Group()
                 for ( var j = 0; j < 1; j++ ) {
                     // Create X.PointCloud with some sort of shape Geometry
                     let particles = new THREE.PointCloud( geometryForShapes, materialForShapes )
     
                     let randomX = Math.random() * ((m.x + 0.5) - (m.x - 0.5)) + (m.x - 0.5);
                     let randomY = Math.random() * ((m.y + 0.5) - (m.y - 0.5)) + (m.y - 0.5);
                     let randomZ = Math.random() * ((this.zaxisOffset + 0.5) - (this.zaxisOffset - 0.5)) + (this.zaxisOffset - 0.5);
     
                     var particle_matrix = new THREE.Matrix4().makeTranslation(  randomX, randomY, randomZ );
                     particles.applyMatrix( particle_matrix );
     
                     // Add particles (X.PointCloud) to group
                     groupShere.add( particles )
                     
                 }
                 groupGeometries.add( groupShere )
                
                
            }

        }
        return groupGeometries;
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

    _updatePointCloudGeometry(messages){
        // For "animations"
        var axis = new THREE.Vector3( 1, 1, 0 ).normalize(),
            degrees = Math.random() * ((Math.PI * 0.1) - (Math.PI * 0.05)) + (Math.PI * 0.05)

        
        for ( let index = 0; index < group.children.length; index++ ) {

            // For making edits (scale, position, rotation)
            // The object will no longer be static, so it will stay true
            group.children[index].matrixAutoUpdate = true;

            let typeOfGeometry = group.children[index].type;

            // Shape geometries and Buffer geometries use different approaches for coloring
            if ( typeOfGeometry == "PointCloud" ) 
            {
                 // Change size of particles
                //group_of_particles.children[index].material.uniforms.size.value = Math.random() * ((50) - (40)) + (40);

                // Change position
                //group_of_particles.children[0].geometry.attributes.position.array[0] += 0.5
                //group_of_particles.children[0].geometry.attributes.position.needsUpdate = true
                
                // Change color of particle
                // if( messages[index].state < 10 )
                // {
                //     // Works for yellow [1,1,0], white [1,1,1] and red [1,0,0]
                //     group.children[index].geometry.attributes.color.array = new Float32Array( [ 1, 1, 1 ] )
                // }
                // else { group.children[index].geometry.attributes.color.array = new Float32Array( [ 1, 0, 0 ] ) }
                
                // group.children[index].geometry.attributes.color.needsUpdate = true
            }
            else
            {   
                for ( var j = 0; j < group.children[index].children.length; j++ ) {
                // Rotate particles
                // group_of_particles.children[index].position.x += Math.random() * ((maxX) - (minX)) + (minX);
                group.children[index].children[j].rotation.x += 0.05
                group.children[index].children[j].rotation.z -= 0.05
                group.children[index].children[j].rotateOnAxis( axis, degrees )

                // Change color of particles
                group.children[index].children[j].material = group.children[index].children[j].material.clone();
                // Some RGB colors:
                // setRGB(255,0,0)
                let rgbColor = colorScale(messages[index].state)
                let recolor = new THREE.Color(rgbColor)
                group.children[index].children[j].material.color = recolor

                let opacColor = opac(messages[index].state)
                group.children[index].children[j].material.opacity = opacColor
                    
                }

            } 
          }
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
            var i = 0;
            var interval = setInterval(() => {
                this._updatePointCloudGeometry(data[i]);
                if (++i == data.length) window.clearInterval(interval);
            }, 0.05);
            
        };
        this._button.setToolTip('My Particles Extension');
        this._button.addClass('ParticlesExtensionIcon');
        this._group.addControl(this._button);
    }
    
}

Autodesk.Viewing.theExtensionManager.registerExtension('ParticlesExtension', ParticlesExtension);
