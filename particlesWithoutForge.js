/////////////////////////////////////////////////////////////////////

var scene = new THREE.Scene();
// degrees, ratio, near clicking plane and far clicking plane
var camera = new THREE.PerspectiveCamera(12, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set(20,40,50)
camera.lookAt(scene.position)

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/////////////////////////////////////////////////////////////////////

// Create grid to help with placing geometries
// 10x10 grid
var size = 10;
var divisions = 10;
var gridHelper = new THREE.GridHelper( size, divisions );
scene.add( gridHelper );

// Create (any) shape 
// @param1: Width
// @param2: Depth
// @param3: Height
var geometry = new THREE.BoxGeometry( 0.4, 0.3, 0.5 );

// Create group of particles
var group = new THREE.Group();

// Add a geometry to each portion of the grid
up_to_down = -4.5
for ( let i = 0; i < size; i++ ) {
  left_to_right = -4.5
  for ( let j = 0; j < divisions; j++ ) {
    // Create Particles 
    var particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      size: 1,
    }));
    // Since we have no use for position, rotation and scale
    // turn off matrixAutoUpdate
    particles.matrixAutoUpdate = false;

    // in makeTranslation, only the first and last argument will be used for movement
    // Left (-ve) / Right (+ve) is first argument
    // Up (-ve) / Down (+ve) is last argument
    var particle_matrix = new THREE.Matrix4().makeTranslation(left_to_right, 0.0, up_to_down);
    particles.applyMatrix4(particle_matrix);

    // Add particles to group of particles
    group.add(particles)

    left_to_right += 1
  }  
  up_to_down += 1
}
scene.add( group );

// Change color of the top left particles
group.children[0].material = group.children[0].material.clone();
group.children[0].material.color.setHex( 0xFF0000)

var axis = new THREE.Vector3( 1, 1, 0 ).normalize();
var degrees = Math.PI * 0.01

// Game logic
var update = function(){
  // rotate torus each frame 
  for (let index = 0; index < group.children.length; index++) {
    group.children[index].matrixAutoUpdate = true;
    group.children[index].rotation.x += 0.05
    group.children[index].rotation.z += 0.05
    group.children[index].rotateOnAxis(axis, degrees )
    
  }
};

// Draw scene
var render = function(){
  renderer.render( scene, camera);
};

// How game will flow
// Look into it
// run game loop (update, render, repeat)
var GameLoop = function(){
  // Run every single frame
  requestAnimationFrame (GameLoop);

  update();
  render();
};

GameLoop();