
var displayInstantResult = true;
var autoAdvanceTimeout = 0;

var tests = testData.split(/\n\n/m).map(function(text, index) {
	var m = text.trim().match(/^([\s\S]+)\[([\s\S]+):([\s\S]+)\]$/m);
	var question = (m[1] || "").trim().
		replace(new RegExp('\n','g'), '<br>').
		replace(new RegExp('^[ ]*' + (index + 1) + '\.[ ]*','m'), '');
	return {question: question, answer: m[2], comment: m[3]};
}).filter(function(t) {
	return t.question && t.answer && t.comment;
});

var currentQuestion = 0;
var collectedAnswers = [];
var answerTries = [];

/* disable state persistence
if (localStorage) {
	currentQuestion = +(localStorage[testId + '.currentQuestion'] || 0);
	collectedAnswers = (localStorage[testId + '.collectedAnswers'] || "").split(/[@][@][@]/);
	answerTries = (localStorage[testId + '.answerTries'] || "").split(/[@][@][@]/).map(function (v) {
		return +v;
	});
}*/

var onPopupHideOneShot = null;
var answerIsCorrect = false;
var advanceOnPopupHide = false;

function matchNumeral(nr, w1, w2, w5) {
	if (nr < 0)
		nr = -nr;
	nr = nr % 100;
	if (nr >= 20)
		return matchNumeral(nr % 10, w1, w2, w5);
	if (nr >= 5)
		return w5;
	if (nr >= 2)
		return w2;
	if (nr == 1)
		return w1;
	return w5;
}

function displayPopup(html) {
	$('#test-popup > div').html(html);
	$('#test-popup').removeClass('display-none').addClass('hidden').removeClass('visible');
	setTimeout(function () {
		$('#test-popup').addClass('visible').removeClass('hidden');
	}, 10);
}

function hidePopupNow() {
	$('#test-popup > div').html("");
	$('#test-popup').addClass('display-none').addClass('hidden').removeClass('visible');
}

function hidePopup() {
	$('#test-popup').addClass('hidden').removeClass('visible')
	setTimeout(hidePopupNow, 500);
	if (onPopupHideOneShot) {
		onPopupHideOneShot();
		onPopupHideOneShot = null;
	}
}


function askQuestion(nr) {
	hidePopupNow();
	answerTries[nr] = 0;

	$('#question-title').html("Вопрос №" + (nr + 1) + ":");
	$('#question-body').html(tests[nr].question);

	$('#options-body').html(possibleAnswers.map(function(answers, sectionIndex){
		return (
			'<span class="section" id="options-section-' + sectionIndex + '">' + 
			answers.map(function(answer, answerIndex){
				return "<a href='#' id='option-" + sectionIndex + "-" + answerIndex + "' onclick='doAnswer(" + sectionIndex + ", " + answerIndex + "); return false;'>" + answer + "</a>"
			}).join('') +
			'</span>'
		);
	}).join(''));

	if (nr > 0) {
		$('#reset-test').removeClass('display-none');
	} else {
		$('#reset-test').addClass('display-none');
	}

	if (nr > 0 && !displayInstantResult) {
		$('#step-back').removeClass('display-none');
	} else {
		$('#step-back').addClass('display-none');
	}

	$('#reset-test-2').addClass('display-none');

	$('#results-wrapper').addClass('display-none');
	$('#question-wrapper').removeClass('display-none');
	$('#test-wrapper').addClass('visible').removeClass('hidden');
}

function answersEqual(a1, a2) {
	if (a1 == a2)
		return true;

	a1 = a1.split(/, /).sort().join(', ');
	a2 = a2.split(/, /).sort().join(', ');
	return a1 == a2;
}

function displayResults() {
	var s = '';
	var s1 = '';
	var correctAnswers = 0;
	var correctAnswers2 = 0;
	for (var nr = 0; nr < tests.length; nr++) {
		s += '<div class="result">';
		s += '<p class="question-title"> Вопрос №' + (nr + 1) + ':</p>';
		s += '</div>';
		if (answersEqual(tests[nr].answer, collectedAnswers[nr])) {
			var correct_class = (answerTries[nr]) ? "correct2" : "correct";
			s +=
				'<p class="answer-body">' + 
				'<span class="' + correct_class + '">Вы ответили правильно:</span> ' +
				'<span class="answer">' + tests[nr].answer + '</span>' +
				(tests[nr].comment ? ' — <span class="comment">' + tests[nr].comment + '</span>' : '') +
				'</p>';
			s1 += '<li class="answer"><span class="' + correct_class + '">' + tests[nr].answer + '</span></li>';
			if (answerTries[nr]) {
				correctAnswers2++;
			} else {
				correctAnswers++;
			}
		} else {
			var wrong_msg = (collectedAnswers[nr] == '') ?
				'<span class="wrong">Вы не ответили на этот вопрос.</span> ' :
				'<span class="wrong">Вы ответили неправильно: </span> ' +
				'<span class="answer">' + collectedAnswers[nr] + '</span>';
			s +=
				'<p class="answer-body">' + 
				wrong_msg + '<br>' +
				'Правильный ответ: <span class="answer">' + tests[nr].answer + '</span>' +
				(tests[nr].comment ? ' — <span class="comment">' + tests[nr].comment + '</span>' : '') +
				'</p>';
			s1 +=
				'<li class="answer">' +
				'<span class="wrong">' + (collectedAnswers[nr] ? '<s>' + collectedAnswers[nr] + '</s>' : "(нет ответа)" ) + '</span> → ' +
				'<span class="correct">' + tests[nr].answer + '</span>' +
				'</li>';
		}

		s += '<p class="question-body">' + tests[nr].question + '</p>';
	}

	var s2 = '';
	if (correctAnswers2 == 0) {
		s2 =
			'Вы ответили правильно на ' +
			correctAnswers + ' ' +
			matchNumeral(correctAnswers, 'вопрос', 'вопроса', 'вопросов') +
			' из ' + tests.length + ':';
	} else {
		s2 =
			'Из ' + tests.length + matchNumeral(tests.length, ' вопроса', ' вопросов', ' вопросов') +
			' Вы ответили правильно <span class="correct">на ' +
			correctAnswers + matchNumeral(correctAnswers, ' вопрос', ' вопроса', ' вопросов') +
			' с первой попытки</span> и еще <span class="correct2">на ' +
			correctAnswers2 + matchNumeral(correctAnswers2, ' вопрос', ' вопроса', ' вопросов') +
			' не с первой попытки</span>:';
	}

	s = 
		'<p class="total-nr">' + s2 + '</p>' +
		'<ol>' + s1 + '</ol>' +
		s;

	$('#results-wrapper').html(s);

	$('#step-back').addClass('display-none');
	$('#reset-test').addClass('display-none');
	$('#reset-test-2').removeClass('display-none');

	$('#results-wrapper').removeClass('display-none');
	$('#question-wrapper').addClass('display-none');
	$('#test-wrapper').addClass('visible').removeClass('hidden');
}

function updateInterface() {
	if (currentQuestion >= tests.length) {
		displayResults();
	} else {
		askQuestion(currentQuestion);
	}
}

function react() {
	$('#test-wrapper').addClass('hidden').removeClass('visible');

	if (localStorage) {
		localStorage[testId + '.currentQuestion'] = currentQuestion;
		localStorage[testId + '.collectedAnswers'] = collectedAnswers.join("@@@");
		localStorage[testId + '.answerTries'] = answerTries.join("@@@");
	}

	setTimeout(updateInterface, 500);
}

function tryAgain() {
	hidePopup();
}

function skipQuestion() {
	collectedAnswers[currentQuestion] = '';
	advanceOnPopupHide = true;
	hidePopup();
}

function nextQuestion() {
	hidePopup();
}


function doAnswer(sectionIndex, answerIndex) {
	$('#options-section-' + sectionIndex + ' a').removeClass('selected');
	$('#option-' + sectionIndex + '-' + answerIndex).addClass('selected');

	var intervalID = null;

	var selected = $('#options-body a.selected');
	if (selected.length == possibleAnswers.length) {
		collectedAnswers[currentQuestion] = selected.map(function() {
			return $(this).html();
		}).get().sort().join(', ');

		if (displayInstantResult) {
			answerIsCorrect = answersEqual(tests[currentQuestion].answer, collectedAnswers[currentQuestion]);
			advanceOnPopupHide = answerIsCorrect;
			if (answerIsCorrect) {
				var advanceButton = '';
				if (!autoAdvanceTimeout) {
					advanceButton = 
						'<p>' + 
						"<a class='button' href='#' onclick='nextQuestion(); return false;' id='next-question'>Продолжить</a>" +
						'</p>';
				}
				displayPopup(
					'<p>' + 
					'<span class="correct">Вы ответили правильно!</span><br>' +
					'<span class="answer">' + tests[currentQuestion].answer + '</span>' +
					(tests[currentQuestion].comment ? ' — <span class="comment">' + tests[currentQuestion].comment + '</span>' : '') + 
					'</p>' +
					advanceButton
				);
				if (autoAdvanceTimeout) {
					intervalID = setTimeout(function() {
						hidePopup();
					}, autoAdvanceTimeout);
				}
			} else {
				displayPopup(
					'<p>' + 
					'<span class="wrong">К сожалению, вы ответили неправильно!</span><br>' +
					'</p>' +
					'<p>' + 
					"<a class='button' href='#' onclick='tryAgain(); return false;' id='try-again'> Попробовать еще раз</a>" + 
					"<a class='button' href='#' onclick='skipQuestion(); return false;' id='skip-question'>Пропустить этот вопрос</a>" +
					'</p>'
				);
			}
			onPopupHideOneShot = (function () {
				if (advanceOnPopupHide) {
					currentQuestion++;
					react();
				} else {
					$('#options-body a').removeClass('selected');
					answerTries[currentQuestion]++;
				}
				if (intervalID) {
					clearInterval(intervalID);
					intervalID = null;
				}
			});
		} else {
			currentQuestion++;
			react();
		}
	}
}

function stepBack() {
	if (currentQuestion > 0)
		currentQuestion--;
	react();
}

function resetTest() {
	currentQuestion = 0;
	collectedAnswers = [];
	react();
}

$(document).ready(function() {

	var html_skeleton = "\
<h1 id='test-title'></h1>\
\
<div id='test-wrapper' class='hidden'>\
\
	<div id='question-wrapper'>\
		<p id='question-title'></p>\
		<p id='question-body'></p>\
\
		<p id='options-title'></p>\
\
		<p id='options-body'></p>\
	</div>\
\
	<div id='results-wrapper' class='display-none'>\
	</div>\
\
	<p id='buttons'>\
		<a class='button' href='#' onclick='stepBack(); return false;' id='step-back'> &lt;&lt; На шаг назад</a>\
		<a class='button' href='#' onclick='resetTest(); return false;' id='reset-test'>Начать тест заново</a>\
		<a class='button' href='#' onclick='resetTest(); return false;' id='reset-test-2'>Пройти тест еще раз</a>\
	</p>\
\
	<div id='test-popup'>\
		<div></div>\
	</div>\
\
</div>\
";

	$('#test-container').html(html_skeleton);

	$('#test-popup').on("click", function() {
		hidePopup();
	});

	hidePopupNow();

	$('#test-title').html(testTitle);
	document.title = testTitle;
	$('#options-title').html(optionsTitle);
	updateInterface();
});
