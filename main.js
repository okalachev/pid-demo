// Copyright (c) 2023 Oleg Kalachev <okalachev@gmail.com>
// Repository: https://github.com/okalachev/pid-demo
// Distributed under the MIT License (https://opensource.org/licenses/MIT)

var asymmetry;
var timeConstant;
var setpoint;
var frequency = 200;
var kp;
var ki;
var kd;
var windup;

var x = -2; // process value
var vx = 0; // process value change rate
var prevTime = NaN;
var controlAction = 0; // control action
var prevError = NaN;
var integral = 0;

function readValue(selector, caption) {
	var el = document.querySelector(selector);
	var text = el.parentNode.childNodes[0];

	if (caption) {
		text.textContent = caption + ' = ' + el.value;
	}

	return Number(el.value);
}

function constrain(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

var objectEl = document.getElementById('object');
var setpointEl = document.getElementById('setpoint');

function readParameters() {
	asymmetry = readValue('input[name=asymmetry]', 'Asymmetry');
	timeConstant = readValue('input[name=time-constant]', 'Time constant');
	setpoint = readValue('input[name=setpoint]', 'Setpoint');
	kp = readValue('input[name=kp]', 'P');
	ki = readValue('input[name=ki]', 'I');
	kd = readValue('input[name=kd]', 'D');
	windup = ki; // let windup be equal to ki for simplicity
}

function update() {
	var time = new Date();
	var dt = (time - prevTime) / 1000; // on first iteration dt is NaN
	if (dt == 0) return; // skip zero dt
	dt = Math.min(dt, 2 / frequency); // don't let dt be too big
	prevTime = time;

	if (isFinite(dt)) {
		// apply control action
		vx = controlAction + asymmetry;
		x = x + vx * dt;
	}

	readParameters();

	var error = setpoint - x;
	var derivative = 0;

	if (isFinite(dt)) {
		integral += error * dt;
		derivative = (error - prevError) / dt;
	}

	prevError = error;

	// calculate control action
	var controlActionInput = kp * error + constrain(ki * integral, -windup, windup) + kd * derivative;

	if (!isFinite(dt) || timeConstant == 0) {
		// first iteration or time constant is zero
		controlAction = controlActionInput;
	} else {
		// apply time constant
		controlAction += (controlActionInput - controlAction) * dt / timeConstant;
	}

	updateScene();
}

function updateScene() {
	var limit = 12;
	objectEl.style.left = 50 + x * 100 / limit + '%';
	setpointEl.style.left = 50 + setpoint * 100 / limit + '%';
}

window.setInterval(update, 1000 / frequency);
