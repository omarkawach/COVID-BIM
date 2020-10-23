//let geometry;
let group_of_particles;

let colorScale = d3.scaleLinear()
                // Based on min state and max state
                 .domain( [ 0,310,330,390,430,470,490,510,530,550,590,610,630,650,670,690 ] )
                 .range( [ 
                     '#ffffff',
                     'rgb(26, 26, 255)',
                     'rgb(77, 77, 255)',
                     'rgb(128, 128, 255)',
                     'rgb(179, 179, 255)',
                     'rgb(230, 230, 255)',
                     'rgb(252,244,166)',
                     'rgb(252,218,150)',
                     'rgb(252,206,142)',
                     'rgb(252,181,126)',
                     'rgb(253,156,111)',
                     'rgb(253,130,95)',
                     'rgb(254,93,72)',
                     'rgb(254,68,56)',
                     'rgb(255,0,0)',
                     'rgb(255,0,0)'
                    ] );

class ParticlesExtension extends Autodesk.Viewing.Extension {
    
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        // First floor of house
        this.zaxisOffset = -6.5;
        this.pointSize = 40;
        this.xaxisOffset = -49;
        this.yzaxisOffset = -11;
    }

    load() {
        this._renderCloud();
        return true;
    }

    _renderCloud(){

        var group = new THREE.Group()

        //var geometry = new THREE.IcosahedronGeometry(1, 1, 1);
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var matTwo = new THREE.PointCloudMaterial({
            color: 0xffffff,
            transparent: false,
            opacity: 0.9,
            size: 10,
        })

        //Add a geometry to each portion of the grid

        //Stop when index is no longer 0, which is time 0

        //Max data are from readData.js
        let numPoints = max_x * max_y;
        let positions = new Float32Array(numPoints * 3);
        let spacing = 5

        for (var i = 0; i < data[0].length; i++){
            var messages = data[0];
            var m = messages[i]
                // Create Particles 
                var particles = new THREE.PointCloud(geometry, matTwo)
                // Since we have no use for position, rotation and scale
                // turn off matrixAutoUpdate
                particles.matrixAutoUpdate = false;

                let k = m.x * max_y + m.y;
                let u = m.x / max_x ;
                let v = m.y / max_y;

                positions[3 * k] = u;
                positions[3 * k + 1] = v;
                positions[3 * k + 2] = this.zaxisOffset;

                 // in makeTranslation, only the first and last argument will be used for movement
                // Left (-ve) / Right (+ve) is first argument
                // Down (-ve) / Up (+ve) is last argument
                var particle_matrix = new THREE.Matrix4().makeTranslation(m.x + this.xaxisOffset, m.y + this.yzaxisOffset, this.zaxisOffset);
                // let rotate = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
                particles.applyMatrix(particle_matrix);
                particles.matrixAutoUpdate = true;

                // Add particles (X.PointCloud)to group
                group.add(particles)

                //this.pointSize = Math.floor(Math.random() * (1 + 70 - 30)) + 30;
            
        }

        //this.viewer.overlays.addMesh(group, 'custom-scene');
        this.viewer.impl.createOverlayScene('custom-scene');
        this.viewer.impl.addOverlay('custom-scene', group);
        group_of_particles = group;

        // Problem:
        //  - Buffer Geom in groups (vertices)
        //  - Map is undefined
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('ParticlesExtensions has been unloaded');
        return true;
    }

    _getColor( state ) {
        // Convert rgb string from d3
        let stringColor = colorScale( state ) 
        let threeColor = new THREE.Color( stringColor )
        return threeColor
    }
    
    _updatePointCloudGeometry(messages){
        // Only update the color based on the state
        var axis = new THREE.Vector3( 1, 1, 0 ).normalize();
        var degrees = Math.PI * 0.01
        for (let index = 0; index < group_of_particles.children.length; index++) {
            // Rotate particles
            group_of_particles.children[index].matrixAutoUpdate = true;
            group_of_particles.children[index].rotation.x += 0.05
            group_of_particles.children[index].rotation.z += 0.05
            group_of_particles.children[index].rotateOnAxis(axis, degrees )

            // Change color of the particles
            
            group_of_particles.children[index].material = group_of_particles.children[index].material.clone();
            group_of_particles.children[index].material.color = this._getColor( messages[index].state )

            // if(messages[index].state < 500){ 
            //     group_of_particles.children[index].material.color.setHex( 0xFFFFFF)
            // }
            // else if(messages[index].state == 500){ 
            //     group_of_particles.children[index].material.color.setHex( 0x3437eb) 
            // }
            // else{ 
            //     group_of_particles.children[index].material.color.setHex( 0xFF0000)
            // }
            
            
            
          }
        this.viewer.impl.invalidate(true,false,true);
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
            /////////////////////////
            // Execute an action here
            /////////////////////////
            // Rotate
            var i = 0;
            var interval = setInterval(() => {
                this._updatePointCloudGeometry(data[i]);
                if (++i == data.length) window.clearInterval(interval);
            }, 2.5);
            
        };
        this._button.setToolTip('My Particles Extension');
        this._button.addClass('playIcon');
        this._group.addControl(this._button);
    }
    
}

Autodesk.Viewing.theExtensionManager.registerExtension('ParticlesExtension', ParticlesExtension);