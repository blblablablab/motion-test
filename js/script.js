// constants
var GROUND_WIDTH = 10000;
var GROUND_HEIGHT = 100;
var GROUND_DEPTH = 500;

var WHEEL_RADIUS = 50;
var WHEEL_HEIGHT = 50;
var WHEEL_SEGMENTS_RAD = 26;
var LEAPFROG = 1;

// visual
var camera, scene, renderer, projector;
var rearWheelMesh, bikeBodyMesh, frontWheelMesh;
var groundMesh;
var visualObjects;
// physics
var world;
var stone;
var rearWheelBody, bikeBodyBody, frontWheelBody;
var groundBody;
var physicsBodies;

if (!Detector.webgl) 
	Detector.addGetWebGLMessage();

init();
animate();

function init() {

	scene = new THREE.Scene(); 
	world = new CANNON.World(); 
	world.gravity(new CANNON.Vec3(0, -1050, 0));
	var bp = new CANNON.NaiveBroadphase();
	world.broadphase(bp);
	world.iterations(2);
	
	stone = new CANNON.Material('stone');
	var stone_stone = new CANNON.ContactMaterial(stone,
					     stone,
					     0.0, // Friction
					     0.0  // Restitution
					     );
	world.addContactMaterial(stone_stone);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.y = 200;
	camera.position.z = 800;
	scene.add(camera);

	// create a point light
	var pointLight = new THREE.PointLight(0xffffff);
	pointLight.position.x = 0;
	pointLight.position.y = 700;
	pointLight.position.z = 2000;
	scene.add(pointLight);
	
	// create an ambient light
	var ambientLight = new THREE.AmbientLight(0x333333);
	scene.add(ambientLight);
	
	visualObjects = new Array();
	physicsBodies = new Array();
	
	createGround();
	createScene();
	
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);

	projector = new THREE.Projector();
	
	document.getElementById('webgl-container').appendChild(renderer.domElement);
	//document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('keydown', onKeyDown, false);
	
	stats = new Stats();
	stats.getDomElement().style.position = 'absolute';
	stats.getDomElement().style.top = '0px';
	stats.getDomElement().style.zIndex = 100;
	document.getElementById('webgl-container').appendChild(stats.getDomElement());
}

function createScene() {    
	// cylinder
	geometry = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_HEIGHT, WHEEL_SEGMENTS_RAD, 1);
	material = new THREE.MeshPhongMaterial({ color: 0x602580 });
	rearWheelMesh = new THREE.Mesh(geometry, material);
	rearWheelMesh.useQuaternion = true;
	rearWheelMesh.rotation.x = Math.PI / 2.0; // side view
	scene.add(rearWheelMesh);	
	visualObjects.push(rearWheelMesh);
	// ::physics
    bodyShape = new CANNON.Sphere(WHEEL_RADIUS);
    rearWheelBody = new CANNON.RigidBody(0.5, bodyShape, stone);
    rearWheelBody.setPosition(0, 500, 0);
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2.0);
    rearWheelBody.setOrientation(q.x, q.y, q.z, q.w);
    world.add(rearWheelBody);
    physicsBodies.push(rearWheelBody);
    
    // cylinder 2
    geometry = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_HEIGHT, WHEEL_SEGMENTS_RAD, 1);
    material = new THREE.MeshPhongMaterial({ color: 0xFF4040 });
    frontWheelMesh = new THREE.Mesh(geometry, material);
    frontWheelMesh.useQuaternion = true;
    frontWheelMesh.rotation.x = Math.PI / 2.0; // side view
    scene.add(frontWheelMesh);   
    visualObjects.push(frontWheelMesh);
    // ::physics
    bodyShape = new CANNON.Sphere(WHEEL_RADIUS);
    frontWheelBody = new CANNON.RigidBody(0.5, bodyShape, stone);
    frontWheelBody.setPosition(5, 100, 0);
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2.0);
    frontWheelBody.setOrientation(q.x, q.y, q.z, q.w);
    world.add(frontWheelBody);
    physicsBodies.push(frontWheelBody);
    
    rearWheelBody.setForce(10000, 0, 0);
}

function createGround() {
    // construct ground
    var geometry = new THREE.CubeGeometry(GROUND_WIDTH, GROUND_HEIGHT, GROUND_DEPTH);
    var material = new THREE.MeshPhongMaterial({ color: 0xCD0074 });
    groundMesh = new THREE.Mesh(geometry, material);
    scene.add(groundMesh);
    visualObjects.push(groundMesh);
    // ::physics
    var bodyShape = new CANNON.Box(new CANNON.Vec3(GROUND_WIDTH, GROUND_HEIGHT, GROUND_DEPTH));
    var rigidBody = new CANNON.RigidBody(0, bodyShape, stone);
    rigidBody.setPosition(0, -GROUND_HEIGHT / 2.0, 0);
    world.add(rigidBody);
    physicsBodies.push(rigidBody);
    
    // kicker
    /*
    geometry = new THREE.CubeGeometry(200, GROUND_HEIGHT, GROUND_DEPTH);
    material = new THREE.MeshPhongMaterial({ color: 0xCD0074 });
    var someMesh = new THREE.Mesh(geometry, material);
    scene.add(someMesh);
    visualObjects.push(someMesh);
    // ::physics
    var stone2 = new CANNON.Material('dsadasdasdas');
    bodyShape = new CANNON.Box(new CANNON.Vec3(20, 20, 20));
    rigidBody = new CANNON.RigidBody(0, bodyShape, stone2);
    rigidBody.setPosition(0, 500.0, 0);
    //var q = new CANNON.Quaternion();
    //q.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 4.0);
    //rigidBody.setOrientation(q.x, q.y, q.z, q.w);
    world.add(rigidBody);
    physicsBodies.push(rigidBody);
    */
}

function animate() {
	// note: three.js includes requestAnimationFrame shim
	requestAnimationFrame(animate);
	updatePhysics();
	render();
	stats.update();
}

function render() {
	//doSimulationStep(basicMeshes, repulsionSources);
	renderer.render(scene, camera);
}

function updatePhysics(){
  // step world
  if(!world.paused){
    world.step(1.0/60.0);
    
    // read position data into visuals
    for(var i = 0; i < physicsBodies.length; i++){
      physicsBodies[i].getPosition(visualObjects[i].position);
      physicsBodies[i].getOrientation(visualObjects[i].quaternion);
    }
    
    rearWheelMesh.position.y -= WHEEL_RADIUS; // workaround
    frontWheelMesh.position.y -= WHEEL_RADIUS; // workaround
  }
}

function onDocumentMouseMove(event) {
	event.preventDefault();

	var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0.5);
	projector.unprojectVector(vector, camera);

	var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

	var intersects = ray.intersectObjects(basicMeshes);

	if (intersects.length > 0) {
		intersects[0].object.material.color.setHex(Math.random() * 0xffffff);
		
		if (repulsionSources.length > 0) {
			repulsionSources[0].scale.x = 1; repulsionSources[0].scale.y = 1; repulsionSources[0].scale.z = 1;
		}
		repulsionSources[0] = intersects[0].object;
		repulsionSources[0].scale.x = 2; repulsionSources[0].scale.y = 2; repulsionSources[0].scale.z = 2;
		
	}
}

    
function onKeyDown(event) {
    //event.preventDefault();
    if ('65' == event.keyCode) { // a
        rearWheelBody.setForce(-1500, 0, 0);
    }
    else if ('68' == event.keyCode) { // d
        rearWheelBody.setForce(1500, 0, 0);
    }
    else if ('87' == event.keyCode) { // d
        rearWheelBody.setForce(0, 1500, 0);
    }
}
