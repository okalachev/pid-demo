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
var pTerm = 0; // proportional term
var iTerm = 0; // integral term
var dTerm = 0; // derivative term
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

var canvasEl = document.querySelector('.canvas');
var objectEl = document.getElementById('object');
var setpointEl = document.getElementById('setpoint');
var gainPEl = document.getElementById('gain-p');
var gainIEl = document.getElementById('gain-i');
var gainDEl = document.getElementById('gain-d');

function readParameters() {
	asymmetry = readValue('input[name=asymmetry]', 'Asymmetry');
	timeConstant = readValue('input[name=time-constant]', 'Time constant');
	setpoint = readValue('input[name=setpoint]', 'Setpoint');
	kp = readValue('input[name=kp]', 'P');
	ki = readValue('input[name=ki]', 'I');
	kd = readValue('input[name=kd]', 'D');
	windup = 3; // slightly more than max asymmetry
}

function update() {
	var time = new Date();
	var dt = (time - prevTime) / 1000; // on first iteration dt is NaN
	if (dt == 0) return; // skip zero dt
	dt = Math.min(dt, 2 / frequency); // don't let dt be too big
	prevTime = time;

	if (isFinite(dt)) {
		// apply control action form previous iteration
		// FIXME:
		// vx = controlAction + asymmetry;
		// x = x + vx * dt;
		x = controlAction + asymmetry;
	}

	readParameters();

	var error = setpoint - x;
	var derivative = 0;

	if (isFinite(dt)) {
		integral += ki * error * dt;
		integral = constrain(integral, -windup, windup);
		derivative = (error - prevError) / dt;
	}

	prevError = error;

	// calculate control action
	pTerm = kp * error;
	iTerm = integral;
	dTerm = kd * derivative;
	var controlActionInput = pTerm + iTerm + dTerm;
	var controlActionInput = kp * error + integral + kd * derivative;

	if (!isFinite(dt) || timeConstant == 0) {
		// first iteration or time constant is zero
		controlAction = controlActionInput;
	} else {
		// apply time constant
		controlAction += (controlActionInput - controlAction) * dt / timeConstant;
	}

	updateScene();
}

function updateGain(el, value) {
	var limit = 12; // TODO:
	var canvasWidth = canvasEl.clientWidth;
	if (value >= 0) {
		el.style.left = 0;
		el.style.width = value * canvasWidth / limit;
	} else {
		el.style.left = value * canvasWidth / limit;
		el.style.width = -value * canvasWidth / limit;
	}
}

function updateScene() {
	var limit = 12;
	objectEl.style.left = 50 + x * 100 / limit + '%';
	setpointEl.style.left = 50 + setpoint * 100 / limit + '%';

	updateGain(gainPEl, pTerm);
	updateGain(gainIEl, iTerm);
	updateGain(gainDEl, dTerm);
}

var stepInputHigh = true;
var stepInputEl = document.querySelector('input[name=step-input]');
var setpointInputEl = document.querySelector('input[name=setpoint]');

function stepInput() {
	if (stepInputEl.checked) {
		setpointInputEl.value = stepInputHigh ? -1 : 1;
		stepInputHigh = !stepInputHigh;
	}
}

window.setInterval(update, 1000 / frequency);
window.setInterval(stepInput, 3000);
