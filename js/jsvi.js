
var albums = new Array();
var albumsBackup = new Array();
$(document).ready(function() {
	$.ajax({
		type : "GET",
		url : "https://dl.dropboxusercontent.com/u/73302210/music.xml",
		dataType : "xml",
		success : function(xml) {
			var i = 0;
			$(xml).find('music').each(function() {
				albums.push({'image': $(this).find('image').text(), 
					'song': $(this).find('song').text(),
					'genre': $(this).find('genre').text(),
					'band': $(this).find('banda').text(),
					'title': $(this).find('titulo').text(),
				});
			});
			loadDone(albums);
			albumsBackup = albums;
		}
	});
});

var camera, scene, renderer;
var mesh;
var projector = new THREE.Projector();
var controls;
var ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
var mouse = { x: 0, y: 0, z: 1 };
var mouse_vector = new THREE.Vector3();
var origin = new THREE.Vector3(0, 0, -250);
var objects = [];
var targets = { rotate: [], grid: [],sphere: []};
var selected;
var mouse = { x: 0, y: 0, z: 1 };
var mouse_vector = new THREE.Vector3();
var settings = new CoverFlow();

camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.z = 400;
var audioIntercept = document.getElementById('audioIntercept');
controls = new THREE.OrbitControls( camera, audioIntercept );
controls.addEventListener( 'change', render );

scene = new THREE.Scene();

function loadDone(albumsReceive){
	targets = { rotate: [], grid: [],sphere: []};
	objects = [];
	var i = albumsReceive.length;
	selected = Math.floor(albumsReceive.length / 2);

	while (--i >= 0) {
		var cover = document.createElement('div');
		cover.className = 'cover';
		cover.id = albumsReceive[i].song;
		cover.style.backgroundColor = 'white';
		cover.style.backgroundImage = 'url(' + albumsReceive[i].image + ')';

		var overlay = document.createElement('div');
		overlay.className = 'overlay';
		cover.appendChild(overlay);

		var title = document.createElement('h1');
		title.textContent = albumsReceive[i].band;
		overlay.appendChild(title);

		var copy = document.createElement('h2');
		copy.textContent = albumsReceive[i].titulo;
		overlay.appendChild(copy);

		var object = new THREE.CSS3DObject(cover);

		cover.addEventListener( 'click', function ( event ) {
			var element = this;
			var aux = element.id;
			onClick(aux,albumsReceive,cover);
		});


		if (i === 0) {
			object.position.x = 0;
			object.position.z = 0;
		} else {
			object.position.x = settings.margin + i * settings.spacing;
			object.position.z = -settings.distance;
		}

		object.position.y = 0;
		object.lookAt(origin);

		scene.add(object);
		objects.push(object);

	}

	//Circular View
	var numTargets = albumsReceive.length * 2 - 1;
	var centered = albumsReceive.length - 1;
	for (i = 0; i < numTargets; i++) {
		var object = new THREE.Object3D();
		var j;

		if (i < centered) {
			j = centered - i;
			object.position.set(-j * settings.spacing - settings.margin, 0, -settings.distance);
			object.lookAt(origin);
		} else if (i > centered) {
			j = i - centered;
			object.position.set(j * settings.spacing + settings.margin, 0, -settings.distance);
			object.lookAt(origin);
		} else {
			object.position.set(0, 0, 0);
			object.lookAt(new THREE.Vector3)
		}
		targets.rotate.push(object);
	}


	//Grid View
	for ( var i = 0; i < objects.length; i ++ ) {
		var object = new THREE.Object3D();
		object.position.x = ( ( i % 6 ) * 400 ) - 800;
		object.position.y = ( - ( Math.floor( i / 6 ) % 5 ) * 400 ) + 800;
		object.position.z = ( Math.floor( i / 30 ) ) * 1000 - 2000;
		targets.grid.push( object );	
	}


    //Esfera
    var vector = new THREE.Vector3();
    for ( var i = 0, l = objects.length; i < l; i ++ ) {
    	var phi = Math.acos( -1 + ( 2 * i ) / l );
    	var theta = Math.sqrt( l * Math.PI ) * phi;
    	var object = new THREE.Object3D();
    	object.position.x = 800 * Math.cos( theta ) * Math.sin( phi );
    	object.position.y = 800 * Math.sin( theta ) * Math.sin( phi );
    	object.position.z = 800 * Math.cos( phi );
    	vector.copy( object.position ).multiplyScalar( 2 );
    	object.lookAt( vector );
    	targets.sphere.push( object );
    }



    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    window.addEventListener('keydown', keyPress, true);
    document.getElementById('container').appendChild(renderer.domElement);

    render();

    var button = document.getElementById( 'grid' );
    button.addEventListener( 'click', function ( event ) {
    	transform( targets.grid, 2000 );
    }, false );

    var button = document.getElementById( 'sphere' );
    button.addEventListener( 'click', function ( event ) {
    	transform( targets.sphere, 2000 );
    }, false );

    var button = document.getElementById( 'coverflow' );
    button.addEventListener( 'click', function ( event ) {
    	selectCover();
    }, false );

    var button2 = document.getElementById( 'button' );
    button2.addEventListener( 'click', function ( event ) {
    	var search = document.getElementById('query');
    	if(search.value!=""){
    		searchQuery(search.value);
    	}
    }, false );

    var button4 = document.getElementById( 'buttonquery2' );
    button4.addEventListener( 'click', function ( event ) {
    	var search = document.getElementById('query2');
    	if(search.value!=""){
    		searchQueryG(search.value);
    	}
    }, false );

    var button3 = document.getElementById( 'resetbutton' );
    button3.addEventListener( 'click', function ( event ) {
    	removeObjects();
    	TWEEN.removeAll();
    	loadDone(albumsBackup);		
    	TWEEN.update();
    }, false );

    selectCover(0);
    animate();
}


function CoverFlow() {
	this.cameraDistance = 760;
	this.spacing = 400;
	this.margin = 600;
	this.distance = 900;
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	camera.position.z = settings.cameraDistance;
	TWEEN.update();
}

var currentObj;


function animateAlbum(obj){
	currentObj = obj;
}

function render() {
	requestAnimationFrame( render );
	renderer.render(scene, camera);
	if(currentObj != null) {
		currentObj.rotation.y += 0.0008;
	}
}


function transform(targets, duration) {
	TWEEN.removeAll();
	for ( var i = 0; i < objects.length; i ++ ) {
		var object = objects[ i ];
		var target = targets[ i ];
		new TWEEN.Tween( object.position )
		.to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
		.easing( TWEEN.Easing.Exponential.InOut )
		.start();
		new TWEEN.Tween( object.rotation )
		.to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
		.easing( TWEEN.Easing.Exponential.InOut )
		.start();
	}
	new TWEEN.Tween( this )
	.to( {}, duration * 2 )
	.onUpdate( render )
	.start();
}



function selectCover() {
	TWEEN.removeAll();

	var i = objects.length;
	while (--i >= 0) {
		var object = objects[i];
		var aux = objects.length - 1 + selected - i;
		var target = targets.rotate[aux];

		new TWEEN.Tween(object.position)
		.to({ x: target.position.x, y: target.position.y, z: target.position.z }, 500)
		.easing(TWEEN.Easing.Quadratic.InOut)
		.start();

		new TWEEN.Tween(object.rotation)
		.to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, 500)
		.easing(TWEEN.Easing.Exponential.InOut)
		.start();
	}

	new TWEEN.Tween(this).to({}, 500)
	.onUpdate(render)
	.start();
}


function keyPress(evt) {
	switch (evt.keyIdentifier) {
		case 'Left':
		selected = Math.max(0, selected - 1);
		selectCover();
		break;
		case 'Right':
		selected = Math.min(objects.length - 1, selected + 1);
		selectCover();
		break;
		case 'Up':
		transform( targets.grid, 2000 );
		break;
		case 'Down':
		transform( targets.sphere, 2000 );
		break;
	}
	
}

function removeObjects(){
	var obj, i;
	for ( i = scene.children.length - 1; i >= 0 ; i -- ) {
		obj = scene.children[ i ];
		if (obj !== camera) {
			scene.remove(obj);
		}
	}
}

function onClick(x,y,cover){
	var object = new THREE.CSS3DObject(cover);
	for (i = 0; i < y.length; i++) {
		var aux = y[i].song;
		if(x==aux){
			var audio = document.getElementById('audio');
			var image = document.getElementById('image');
			var name = document.getElementById('name');
			audio.src = y[i].song;
			image.src = y[i].image;
			name.textContent = y[i].title;
			for (j = 0; j < objects.length; j++) {
				if(objects[j].element.id == aux){
					animateAlbum(objects[j]);
				}
			}
		}
	}
}

function searchQuery( query ) {
	var albumAux = new Array();
	for (i = 0; i < albums.length; i++) {
		if(albums[i].band.toLowerCase().includes(query.toLowerCase())){
			albumAux.push({'image': albums[i].image, 
				'song': albums[i].song,
				'genre': albums[i].genre,
				'band': albums[i].band,
				'title': albums[i].title,
			});
		}
	}

	if(albumAux.length!=0){
		removeObjects();
		TWEEN.removeAll();
		loadDone(albumAux);
		TWEEN.update();
	}
}

//albums[i].genre.toLowerCase() == query.toLowerCase() || 
function searchQueryG( query ) {
	var albumAux = new Array();
	for (i = 0; i < albums.length; i++) {
		if(albums[i].genre.toLowerCase().includes(query.toLowerCase())){
			albumAux.push({'image': albums[i].image, 
				'song': albums[i].song,
				'genre': albums[i].genre,
				'band': albums[i].band,
				'title': albums[i].title,
			});
		}
	}

	if(albumAux.length!=0){
		removeObjects();
		TWEEN.removeAll();
		loadDone(albumAux);
		TWEEN.update();
	}
}

$(document).ready(function() {
	$('#audio-player').mediaelementplayer({
		alwaysShowControls: true,
		features: ['playpause','volume','progress'],
		audioVolume: 'horizontal',
		audioWidth: 400,
		audioHeight: 120
	});
});