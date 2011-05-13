/**
 * Nebula by Felix Turner
 * www.airtight.cc
 */

var container, 
	stats, 
	camera, 
	scene, 
	renderer, 
	particles, 
	particleGeometry, 
	i, 
	mouseX = 0, 
	mouseY = 0, 
	stars = [], 
	webGLSizeIndex = 1, 
	beamGroup, 
	windowHalfX, 
	windowHalfY, 
	material, 
	sizeFactor = 0.7, //size of 
	
	//consts
	PARTICLE_COUNT = 300, 
	BEAM_COUNT = 40, 
	MAX_DISTANCE = 1000, 
	STAR_ROT_SPEED = 0.01, 
	BEAM_ROT_SPEED = 0.003;

/**
 * Star Class handles movement of particles
 */
function Star(){
    this.posn = new THREE.Vector3();
    this.init();
}

Star.MAX_SPEED = 20;
Star.ORIGIN = new THREE.Vector3();

//returns random number within a range
Star.prototype.getRand = function(minVal, maxVal){
    return minVal + (Math.random() * (maxVal - minVal));
}

Star.prototype.init = function(){
	//start at center
    this.posn.copy(Star.ORIGIN);
	//random speed
    this.speed = new THREE.Vector3(this.getRand(-Star.MAX_SPEED, Star.MAX_SPEED), this.getRand(-Star.MAX_SPEED, Star.MAX_SPEED), this.getRand(-Star.MAX_SPEED, Star.MAX_SPEED));
}

Star.prototype.update = function(){
	//move star
    this.posn = this.posn.addSelf(this.speed);
    //reset if out of sphere
    if (this.posn.distanceTo(Star.ORIGIN) > MAX_DISTANCE) {
        this.init();
    }
}

/**
 * Initialize
 */
function initNebula(){

    var colors = [];
    
    // stop the user getting a text cursor
    document.onselectstart = function(){
        return false;
    };
    
    container = document.getElementById("container");
    
    //init camera
    camera = new THREE.Camera(75, 4 / 3, 1, 3000);
    camera.position.z = 1000;
    
    scene = new THREE.Scene();
    
    //init Particles
    particleGeometry = new THREE.Geometry();
    //create one shared material
    var sprite = ImageUtils.loadTexture("img/particle.png");
    material = new THREE.ParticleBasicMaterial({
        size: 380,
        map: sprite,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        vertexColors: true //allows 1 color per particle
    });
    //create particles
    for (i = 0; i < PARTICLE_COUNT; i++) {
        particleGeometry.vertices.push(new THREE.Vertex());
        colors[i] = new THREE.Color();
        colors[i].setHSV(Math.random(), 1.0, 1.0);
        stars.push(new Star());
        particleGeometry.vertices[i] = new THREE.Vertex(stars[i].posn);
    }
    
    particleGeometry.colors = colors;
    
    //init particle system
    particles = new THREE.ParticleSystem(particleGeometry, material);
    particles.sortParticles = false;
    scene.addObject(particles);
    
    //init Sun Beams
    var beamGeometry = new Plane(5000, 50, 1, 1);
    beamGroup = new THREE.Object3D();
    
    for (i = 0; i < BEAM_COUNT; ++i) {
    
        //create one material per beam
        var beamMaterial = new THREE.MeshBasicMaterial({
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthTest: false,
        });
        beamMaterial.color = new THREE.Color();
        beamMaterial.color.setHSV(Math.random(), 1.0, 1.0);
        //create a beam
        beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.doubleSided = true;
        beam.rotation.x = Math.random() * Math.PI;
        beam.rotation.y = Math.random() * Math.PI;
        beam.rotation.z = Math.random() * Math.PI;
        beamGroup.addChild(beam);
    }
    
    scene.addObject(beamGroup);
    
    //init renderer
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        clearAlpha: 1
    });
    //renderer.setSize(WEBGL_WIDTH, WEBGL_HEIGHT);
    renderer.sortElements = false;
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);
    
    setWebGLSize();
    
    //init stats
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
    
    //init mouse listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    container.addEventListener('click', onDocumentClick, false);
    $(window).mousewheel(function(event, delta){
        handleMouseWheel(delta);
    });
    
    animate();
}

function onDocumentClick(event){
    for (i = 0; i < PARTICLE_COUNT; i++) {
        stars[i].init();
    }
}

function onDocumentMouseMove(event){
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function animate(){
    requestAnimationFrame(animate); //requestAnimationFrame is more polite way to ask for system resources
    render();
    stats.update();
}

function render(){

    particles.rotation.x += STAR_ROT_SPEED;
    particles.rotation.y += STAR_ROT_SPEED;
    
    beamGroup.rotation.x += BEAM_ROT_SPEED;
    beamGroup.rotation.y += BEAM_ROT_SPEED;
    
    camera.position.x += (mouseX - camera.position.x) * 0.3;
    camera.position.y += (-mouseY - camera.position.y) * 0.3;
    
    for (i = 0; i < PARTICLE_COUNT; i++) {
        stars[i].update();
    }
    
    particleGeometry.__dirtyVertices = true;
    renderer.render(scene, camera);
    
}

function handleMouseWheel(delta){

    sizeFactor += delta * 0.20;
    
    //constrain to 0.2 - 1
    sizeFactor = Math.max(sizeFactor, .2);
    sizeFactor = Math.min(sizeFactor, 1);
    
    setWebGLSize();
}

function setWebGLSize(w, h){

    //use letterbox dimensions unless 100%
    var w = window.innerWidth * sizeFactor;
    var h = window.innerWidth * sizeFactor * 5 / 9;
    if (sizeFactor === 1) 
        h = window.innerHeight;
    
    renderer.setSize(w, h);
    container.style.width = w + "px";
    container.style.height = h + "px";
    
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2
    
    camera.aspect = windowHalfX / windowHalfY;
    
    //reposition container div
    $(window).resize();
    
}

/**
 * Center container div inside window
 */
$(window).resize(function(){

    $('#container').css({
        position: 'absolute',
        left: ($(window).width() -
        $('#container').outerWidth()) /
        2,
        top: ($(window).height() -
        $('#container').outerHeight()) /
        2,
        visibility: "visible"
    });
});

$(document).ready(function(){

    $(window).resize();
    
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage({
            parent: document.getElementById("no_webgl")
        });
    }
    else {
        initNebula();
    }
});
