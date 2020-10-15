let geometry;
let group_of_particles;

class ParticlesExtension extends Autodesk.Viewing.Extension {
    
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        // First floor of house
        this.zaxisOffset = -6.5;
        this.pointSize = 50;
    }

    load() {
        this._renderCloud();
        return true;
    }

    _renderCloud(){
        var vShader = `uniform float size;
        varying vec3 vColor;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size * ( size / (length(mvPosition.xyz) + 0.00001) );
            gl_Position = projectionMatrix * mvPosition;
        }`
        // var fShader = `varying vec3 vColor;
        // void main() {
        //     gl_FragColor = vec4( vColor, 1.0 );
        // }`

        var fShader = `varying vec3 vColor;
        uniform sampler2D sprite;
        void main() {
            gl_FragColor = vec4(vColor, 1.0 ) * texture2D( sprite, gl_PointCoord );
            if (gl_FragColor.x < 0.2) discard;
        }`
        var material = new THREE.ShaderMaterial( {
            uniforms: {
                size: { type: 'f', value: 10},
                sprite: { type: 't', value: THREE.ImageUtils.loadTexture("../data//white.png") },
            },
            vertexShader: vShader,
            fragmentShader: fShader,
            transparent: false,
            vertexColors: true,
        });
        var matTwo = new THREE.PointCloudMaterial({
            //map: new THREE.TextureLoader().load( '../data/toppng.com-particles-3000x2000.png' ),
            color: 0xffff00,
            transparent: false,
            opacity: 0.9,
            size: 10,
        })
        let geometry = new THREE.BufferGeometry();
        //let geometry = new THREE.BoxGeometry();
        let numPoints = max_x * max_y;
        let positions = new Float32Array(numPoints * 3);
        let colors = new Float32Array(numPoints * 3);
        let color = new THREE.Color();

        var group = new THREE.Group()

        for (var i = 0; i < data[0].length; i++){
            var messages = data[0];
            var m = messages[i]
                

                let k = m.x //* max_y + m.y;
                let u = m.y // max_x ;//- 0.52;
                let v = 0 //m.y / max_y ;//- 0.52;

                positions[3 * k] = u;
                positions[3 * k + 1] = v;
                positions[3 * k + 2] = -1.5;

                color.setRGB(255/255, 255/255, 255/255);
                color.toArray(colors, k * 3);

                geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.computeBoundingBox();
                geometry.isPoints = true;

                var particles = new THREE.PointCloud(geometry, material)
                particles.matrixAutoUpdate = false;
                var particle_matrix = new THREE.Matrix4().makeTranslation(m.x , m.y, this.zaxisOffset);
                // Add particles (X.PointCloud)to group
                particles.applyMatrix(particle_matrix);
                particles.matrixAutoUpdate = true;
                group.add(particles)

                //this.pointSize = Math.floor(Math.random() * (1 + 70 - 30)) + 30;
                
            
        }

        

        //var geometry = new THREE.IcosahedronGeometry(1, 1, 1);
        // var geometry = new THREE.BoxGeometry(1, 1, 1);
        // var matTwo = new THREE.PointCloudMaterial({
        //     //map: new THREE.TextureLoader().load( '../data/toppng.com-particles-3000x2000.png' ),
        //     color: 0xffff00,
        //     transparent: false,
        //     opacity: 0.9,
        //     size: 10,
        // })
        
        


        // Add a geometry to each portion of the grid

        // Stop when index is no longer 0, which is time 0

        // Max data are from readData.js
        // let numPoints = max_x * max_y;
        // let positions = new Float32Array(numPoints * 3);
        // let spacing = 5

        // for (var i = 0; i < data[0].length; i++){
        //     var messages = data[0];
        //     var m = messages[i]
        //         // Create Particles 
        //         var particles = new THREE.PointCloud(geometry, matTwo)
        //         // Since we have no use for position, rotation and scale
        //         // turn off matrixAutoUpdate
        //         particles.matrixAutoUpdate = false;

        //         let k = m.x * max_y + m.y;
        //         let u = m.x / max_x - 0.52;
        //         let v = m.y / max_y - 0.52;

        //         positions[3 * k] = u;
        //         positions[3 * k + 1] = v;
        //         positions[3 * k + 2] = this.zaxisOffset;

        //          // in makeTranslation, only the first and last argument will be used for movement
        //         // Left (-ve) / Right (+ve) is first argument
        //         // Down (-ve) / Up (+ve) is last argument
        //         var particle_matrix = new THREE.Matrix4().makeTranslation(m.x , m.y, this.zaxisOffset);
        //         // let rotate = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
        //         particles.applyMatrix(particle_matrix);
        //         particles.matrixAutoUpdate = true;

        //         // Add particles (X.PointCloud)to group
        //         group.add(particles)

        //         //this.pointSize = Math.floor(Math.random() * (1 + 70 - 30)) + 30;
            
        // }

        // let up_to_down = -40.5
        // for ( let i = 0; i < 10; i++ ) {
        // let left_to_right = -40.5
        // for ( let j = 0; j < 10; j++ ) {
        //     // Create Particles 
        //     var particles = new THREE.PointCloud(geometry, matTwo)
        //     // Since we have no use for position, rotation and scale
        //     // turn off matrixAutoUpdate
        //     particles.matrixAutoUpdate = false;

        //     // in makeTranslation, only the first and last argument will be used for movement
        //     // Left (-ve) / Right (+ve) is first argument
        //     // Up (-ve) / Down (+ve) is last argument
        //     var particle_matrix = new THREE.Matrix4().makeTranslation(left_to_right, up_to_down, 0.0);
        //     // let rotate = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
        //     particles.applyMatrix(particle_matrix);
        //     particles.matrixAutoUpdate = true;

        //     // Add particles (X.PointCloud)to group
        //     group.add(particles)

        //     left_to_right += 1.5
        // }  
        // up_to_down += 1.5
        // }

        // if (!viewer.overlays.hasScene('custom-scene')) {
        //     viewer.overlays.addScene('custom-scene');
        // }
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
            
            let color = new THREE.Color();
            let colors = group_of_particles.children[index].geometry.attributes.color.array
            var color1 = {r:0,g:0,b:255};
            let r = color1.r;
            let g = color1.g;
            let b = color1.b;
            color.setRGB(r/255,g/255,b/255);
            let m = messages[index]
            let k = m.x * max_y + m.y;
            colors[3 * k] = color.r;       // r=1 when 0<w<1
            colors[3 * k + 1] = color.g;   // g=1 when w==1
            colors[3 * k + 2] = color.b;   // b=1 when -1<w<0
            group_of_particles.children[index].geometry.colorsNeedsUpdate=true;
            // if(messages[index].state < 3){ group_of_particles.children[index].material.color.setHex( 0xFFFFFF) }
            // else if(messages[index].state < 10){ group_of_particles.children[index].material.color.setHex( 0x808080) }
            // else{ group_of_particles.children[index].material.color.setHex( 0xFF0000) }
            
            
            
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
        this._button.addClass('ParticlesExtensionIcon');
        this._group.addControl(this._button);
    }
    
}

Autodesk.Viewing.theExtensionManager.registerExtension('ParticlesExtension', ParticlesExtension);
